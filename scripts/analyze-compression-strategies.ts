/**
 * 分析不同压缩策略的潜力
 * 1. 单独压缩每个 mod
 * 2. chunk 去重
 * 3. delta 压缩（相似文件）
 */

import { createHash } from 'crypto';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';

const TARGET_EXTS = ['.dds', '.buf', '.ib'];

// 递归获取文件
async function* walkFiles(dir: string): AsyncGenerator<{ path: string; size: number }> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkFiles(fullPath);
      } else if (TARGET_EXTS.includes(extname(entry.name).toLowerCase())) {
        const s = await stat(fullPath);
        yield { path: fullPath, size: s.size };
      }
    }
  } catch (e) {
    // 忽略权限错误
  }
}

// 文件级 hash
async function fileHash(path: string): Promise<string> {
  const data = await readFile(path);
  return createHash('md5').update(data).digest('hex');
}

// 采样分析：随机选择一些文件对比相似度
async function analyzeSimilarity(files: string[], sampleSize = 50) {
  const samples = files.sort(() => Math.random() - 0.5).slice(0, sampleSize);
  const similarities: { file1: string; file2: string; similarity: number }[] = [];
  
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      try {
        const data1 = await readFile(samples[i]);
        const data2 = await readFile(samples[j]);
        
        // 只比较相同大小的文件（更可能相似）
        if (Math.abs(data1.length - data2.length) > data1.length * 0.1) continue;
        
        // 计算相似度（相同字节比例）
        const minLen = Math.min(data1.length, data2.length);
        let sameBytes = 0;
        for (let k = 0; k < minLen; k++) {
          if (data1[k] === data2[k]) sameBytes++;
        }
        const similarity = sameBytes / minLen;
        
        if (similarity > 0.5) {
          similarities.push({
            file1: basename(dirname(samples[i])) + '/' + basename(samples[i]),
            file2: basename(dirname(samples[j])) + '/' + basename(samples[j]),
            similarity
          });
        }
      } catch (e) {
        // 忽略读取错误
      }
    }
  }
  
  return similarities.sort((a, b) => b.similarity - a.similarity);
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log(`分析目录: ${modDir}\n`);
  console.log('收集文件信息...');
  
  const files: { path: string; size: number }[] = [];
  const hashMap = new Map<string, { paths: string[]; size: number }>();
  
  let totalSize = 0;
  let fileCount = 0;
  
  for await (const file of walkFiles(modDir)) {
    files.push(file);
    totalSize += file.size;
    fileCount++;
    
    if (fileCount % 500 === 0) {
      process.stdout.write(`\r已扫描 ${fileCount} 个文件, ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
    }
  }
  
  console.log(`\r已扫描 ${fileCount} 个文件, ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB\n`);
  
  // 1. 文件级去重分析
  console.log('计算文件 hash（采样 1000 个）...');
  const sampleFiles = files.sort(() => Math.random() - 0.5).slice(0, 1000);
  
  for (const file of sampleFiles) {
    try {
      const hash = await fileHash(file.path);
      const existing = hashMap.get(hash);
      if (existing) {
        existing.paths.push(file.path);
      } else {
        hashMap.set(hash, { paths: [file.path], size: file.size });
      }
    } catch (e) {
      // 忽略
    }
  }
  
  let duplicateSize = 0;
  let duplicateCount = 0;
  for (const [, info] of hashMap) {
    if (info.paths.length > 1) {
      duplicateCount += info.paths.length - 1;
      duplicateSize += info.size * (info.paths.length - 1);
    }
  }
  
  const sampleTotalSize = sampleFiles.reduce((sum, f) => sum + f.size, 0);
  const fileDedupRatio = duplicateSize / sampleTotalSize;
  
  console.log(`\n=== 文件级去重（采样 ${sampleFiles.length} 个文件）===`);
  console.log(`重复文件: ${duplicateCount} 个`);
  console.log(`去重率: ${(fileDedupRatio * 100).toFixed(1)}%`);
  console.log(`预估全量节省: ${(totalSize * fileDedupRatio / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  // 2. 相似度分析（delta 压缩潜力）
  console.log('\n分析文件相似度（delta 压缩潜力）...');
  const ddsPaths = files.filter(f => f.path.endsWith('.dds')).map(f => f.path);
  const similarities = await analyzeSimilarity(ddsPaths, 100);
  
  console.log(`\n=== 高相似度文件对（>50%）===`);
  console.log(`发现 ${similarities.length} 对高相似度文件`);
  
  if (similarities.length > 0) {
    console.log('\nTop 10 相似文件对:');
    for (const sim of similarities.slice(0, 10)) {
      console.log(`  ${(sim.similarity * 100).toFixed(1)}%: ${sim.file1} <-> ${sim.file2}`);
    }
    
    // 估算 delta 压缩收益
    const avgSimilarity = similarities.reduce((sum, s) => sum + s.similarity, 0) / similarities.length;
    console.log(`\n平均相似度: ${(avgSimilarity * 100).toFixed(1)}%`);
    console.log(`Delta 压缩潜在收益: 相似文件可压缩到 ${((1 - avgSimilarity) * 100).toFixed(0)}% 大小`);
  }
  
  // 3. 按扩展名统计
  console.log('\n=== 按扩展名统计 ===');
  const extStats = new Map<string, { count: number; size: number }>();
  for (const file of files) {
    const ext = extname(file.path).toLowerCase();
    const existing = extStats.get(ext) || { count: 0, size: 0 };
    existing.count++;
    existing.size += file.size;
    extStats.set(ext, existing);
  }
  
  for (const [ext, stats] of [...extStats.entries()].sort((a, b) => b[1].size - a[1].size)) {
    console.log(`${ext}: ${stats.count} 文件, ${(stats.size / 1024 / 1024 / 1024).toFixed(2)} GB (${(stats.size / totalSize * 100).toFixed(1)}%)`);
  }
  
  // 4. 压缩率估算
  console.log('\n=== 压缩策略对比（估算）===');
  console.log(`原始大小: ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  // DDS 文件通常已经是压缩格式，压缩率较低
  // buf/ib 是二进制数据，压缩率中等
  const ddsSize = extStats.get('.dds')?.size || 0;
  const otherSize = totalSize - ddsSize;
  
  // zstd 压缩估算
  const zstdDdsRatio = 0.85;  // DDS 已压缩，zstd 效果有限
  const zstdOtherRatio = 0.4; // buf/ib 压缩效果好
  const zstdEstimate = ddsSize * zstdDdsRatio + otherSize * zstdOtherRatio;
  
  console.log(`\n1. 单独 zstd 压缩:`);
  console.log(`   预估大小: ${(zstdEstimate / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   节省: ${((1 - zstdEstimate / totalSize) * 100).toFixed(1)}%`);
  
  console.log(`\n2. 文件去重 + zstd:`);
  const afterDedup = totalSize * (1 - fileDedupRatio);
  const dedupZstd = (afterDedup - ddsSize * (1 - fileDedupRatio)) * zstdOtherRatio + ddsSize * (1 - fileDedupRatio) * zstdDdsRatio;
  console.log(`   预估大小: ${(dedupZstd / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`   节省: ${((1 - dedupZstd / totalSize) * 100).toFixed(1)}%`);
  
  console.log(`\n3. Delta 压缩（需要更多分析）:`);
  console.log(`   适用于：同角色不同皮肤的 mod`);
  console.log(`   潜在收益：相似文件可压缩 50-90%`);
}

main().catch(console.error);
