/**
 * 分析同角色 mod 之间的相似度
 * 验证 delta 压缩的实际收益
 */

import { createHash } from 'crypto';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

const TARGET_EXTS = ['.dds', '.buf', '.ib'];

async function* walkFiles(dir: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkFiles(fullPath);
      } else if (TARGET_EXTS.includes(extname(entry.name).toLowerCase())) {
        yield fullPath;
      }
    }
  } catch (e) {}
}

// 从文件名提取角色名
function extractCharacter(filename: string): string | null {
  const patterns = [
    /^(Miyabi|Ellen|Jane|Nicole|Anby|Lucy|Grace|Koleda|Rina|Soukaku|Nekomata|Corin|Piper|Ben|Anton|Billy|Soldier11|Lycaon|Zhu Yuan|Seth|Caesar|Burnice|Yanagi|Lighter|Evelyn|Vivian|Harumasa|Trigger|Belle)/i,
  ];
  
  for (const pattern of patterns) {
    const match = filename.match(pattern);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

// 计算两个 buffer 的相似度
function calculateSimilarity(buf1: Buffer, buf2: Buffer): number {
  if (buf1.length !== buf2.length) {
    // 不同大小，计算公共部分
    const minLen = Math.min(buf1.length, buf2.length);
    let same = 0;
    for (let i = 0; i < minLen; i++) {
      if (buf1[i] === buf2[i]) same++;
    }
    return same / Math.max(buf1.length, buf2.length);
  }
  
  let same = 0;
  for (let i = 0; i < buf1.length; i++) {
    if (buf1[i] === buf2[i]) same++;
  }
  return same / buf1.length;
}

// 计算 delta 大小（简化：只计算不同字节数）
function calculateDeltaSize(base: Buffer, target: Buffer): number {
  if (base.length !== target.length) {
    return target.length; // 大小不同，无法 delta
  }
  
  let diffBytes = 0;
  let inDiffRun = false;
  
  for (let i = 0; i < base.length; i++) {
    if (base[i] !== target[i]) {
      diffBytes++;
      inDiffRun = true;
    } else if (inDiffRun) {
      diffBytes += 8; // 每个 diff run 需要 offset + length 头
      inDiffRun = false;
    }
  }
  
  return diffBytes + 16; // 基础开销
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log(`分析目录: ${modDir}\n`);
  
  // 按角色分组文件
  const characterFiles = new Map<string, Map<string, string[]>>(); // character -> filename -> paths
  
  console.log('扫描文件并按角色分组...');
  let count = 0;
  
  for await (const filePath of walkFiles(modDir)) {
    const filename = basename(filePath);
    const character = extractCharacter(filename);
    
    if (character) {
      if (!characterFiles.has(character)) {
        characterFiles.set(character, new Map());
      }
      const charMap = characterFiles.get(character)!;
      
      // 按文件名分组（去掉路径前缀）
      const key = filename;
      if (!charMap.has(key)) {
        charMap.set(key, []);
      }
      charMap.get(key)!.push(filePath);
    }
    
    count++;
    if (count % 1000 === 0) {
      process.stdout.write(`\r已扫描 ${count} 个文件`);
    }
  }
  
  console.log(`\r已扫描 ${count} 个文件\n`);
  
  // 分析每个角色的文件相似度
  console.log('=== 按角色分析 ===\n');
  
  let totalOriginalSize = 0;
  let totalDeltaSize = 0;
  
  for (const [character, fileMap] of characterFiles) {
    // 找出有多个版本的文件
    const multiVersionFiles = [...fileMap.entries()].filter(([, paths]) => paths.length > 1);
    
    if (multiVersionFiles.length === 0) continue;
    
    console.log(`\n${character.toUpperCase()}:`);
    console.log(`  有 ${multiVersionFiles.length} 种文件存在多个版本`);
    
    let charOriginal = 0;
    let charDelta = 0;
    
    for (const [filename, paths] of multiVersionFiles.slice(0, 5)) { // 只分析前5种
      if (paths.length < 2) continue;
      
      try {
        // 读取所有版本
        const buffers = await Promise.all(paths.slice(0, 10).map(p => readFile(p)));
        
        // 选择第一个作为基准
        const base = buffers[0];
        const baseSize = base.length;
        
        let totalDelta = baseSize; // 基准完整存储
        charOriginal += baseSize * buffers.length;
        
        for (let i = 1; i < buffers.length; i++) {
          const similarity = calculateSimilarity(base, buffers[i]);
          const deltaSize = calculateDeltaSize(base, buffers[i]);
          totalDelta += deltaSize;
          
          if (i === 1) {
            console.log(`  ${filename}: ${paths.length} 版本, 相似度 ${(similarity * 100).toFixed(1)}%, delta ${(deltaSize / 1024).toFixed(1)}KB vs 原始 ${(baseSize / 1024).toFixed(1)}KB`);
          }
        }
        
        charDelta += totalDelta;
      } catch (e) {
        // 忽略读取错误
      }
    }
    
    if (charOriginal > 0) {
      totalOriginalSize += charOriginal;
      totalDeltaSize += charDelta;
      console.log(`  角色总计: 原始 ${(charOriginal / 1024 / 1024).toFixed(1)}MB -> delta ${(charDelta / 1024 / 1024).toFixed(1)}MB (节省 ${((1 - charDelta / charOriginal) * 100).toFixed(1)}%)`);
    }
  }
  
  console.log('\n=== 总结 ===');
  console.log(`分析的文件: 原始 ${(totalOriginalSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`Delta 压缩后: ${(totalDeltaSize / 1024 / 1024).toFixed(1)}MB`);
  console.log(`节省: ${((1 - totalDeltaSize / totalOriginalSize) * 100).toFixed(1)}%`);
}

main().catch(console.error);
