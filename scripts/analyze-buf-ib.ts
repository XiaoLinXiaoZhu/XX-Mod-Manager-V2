/**
 * 分析 buf/ib 文件的去重潜力
 * buf = 顶点数据 (Position, Texcoord, Blend 等)
 * ib = 索引缓冲
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';

async function* walkFiles(dir: string, exts: string[]): AsyncGenerator<{ path: string; size: number }> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkFiles(fullPath, exts);
      } else if (exts.includes(extname(entry.name).toLowerCase())) {
        const s = await stat(fullPath);
        yield { path: fullPath, size: s.size };
      }
    }
  } catch (e) {}
}

// 分析文件内部结构
function analyzeBuffer(data: Buffer, filename: string) {
  const name = basename(filename).toLowerCase();
  
  // 根据文件名推断数据类型
  let elementSize = 4; // 默认 float32
  let elementType = 'unknown';
  
  if (name.includes('position')) {
    elementSize = 12; // vec3 float
    elementType = 'position';
  } else if (name.includes('texcoord')) {
    elementSize = 8; // vec2 float
    elementType = 'texcoord';
  } else if (name.includes('blend')) {
    elementSize = 32; // 通常是骨骼权重
    elementType = 'blend';
  } else if (name.includes('normal')) {
    elementSize = 12;
    elementType = 'normal';
  } else if (name.endsWith('.ib')) {
    elementSize = 2; // uint16 索引
    elementType = 'index';
  }
  
  return { elementSize, elementType, elementCount: Math.floor(data.length / elementSize) };
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log(`分析 buf/ib 文件: ${modDir}\n`);
  
  // 1. 文件级去重
  const fileHashes = new Map<string, { paths: string[]; size: number }>();
  
  // 2. 固定大小块去重 (4KB)
  const chunkHashes = new Map<string, { count: number; size: number }>();
  const CHUNK_SIZE = 4096;
  
  // 3. 元素级去重（按数据类型）
  const elementHashes = new Map<string, Map<string, { count: number; size: number }>>();
  
  let totalFiles = 0;
  let totalSize = 0;
  
  // 按类型统计
  const typeStats = new Map<string, { count: number; size: number; uniqueElements: number; totalElements: number }>();
  
  for await (const file of walkFiles(modDir, ['.buf', '.ib'])) {
    try {
      const data = await readFile(file.path);
      totalFiles++;
      totalSize += file.size;
      
      // 文件级 hash
      const fileHash = createHash('md5').update(data).digest('hex');
      const existing = fileHashes.get(fileHash);
      if (existing) {
        existing.paths.push(file.path);
      } else {
        fileHashes.set(fileHash, { paths: [file.path], size: file.size });
      }
      
      // 固定块去重
      for (let offset = 0; offset + CHUNK_SIZE <= data.length; offset += CHUNK_SIZE) {
        const chunk = data.subarray(offset, offset + CHUNK_SIZE);
        const hash = createHash('md5').update(chunk).digest('hex').slice(0, 12);
        const ex = chunkHashes.get(hash);
        if (ex) ex.count++;
        else chunkHashes.set(hash, { count: 1, size: CHUNK_SIZE });
      }
      
      // 元素级分析
      const { elementSize, elementType, elementCount } = analyzeBuffer(data, file.path);
      
      if (!typeStats.has(elementType)) {
        typeStats.set(elementType, { count: 0, size: 0, uniqueElements: 0, totalElements: 0 });
        elementHashes.set(elementType, new Map());
      }
      
      const stats = typeStats.get(elementType)!;
      const elemMap = elementHashes.get(elementType)!;
      
      stats.count++;
      stats.size += file.size;
      stats.totalElements += elementCount;
      
      // 采样元素 hash（每个文件最多 1000 个元素）
      const sampleStep = Math.max(1, Math.floor(elementCount / 1000));
      for (let i = 0; i < elementCount; i += sampleStep) {
        const offset = i * elementSize;
        if (offset + elementSize > data.length) break;
        
        const elem = data.subarray(offset, offset + elementSize);
        const hash = createHash('md5').update(elem).digest('hex').slice(0, 10);
        const ex = elemMap.get(hash);
        if (ex) ex.count++;
        else {
          elemMap.set(hash, { count: 1, size: elementSize });
          stats.uniqueElements++;
        }
      }
      
      if (totalFiles % 500 === 0) {
        process.stdout.write(`\r已分析 ${totalFiles} 个文件`);
      }
    } catch (e) {}
  }
  
  console.log(`\r已分析 ${totalFiles} 个文件, ${(totalSize / 1024 / 1024).toFixed(1)} MB\n`);
  
  // 输出结果
  console.log('=== 文件级去重 ===\n');
  let fileDupSize = 0;
  let fileDupCount = 0;
  for (const [, info] of fileHashes) {
    if (info.paths.length > 1) {
      fileDupCount += info.paths.length - 1;
      fileDupSize += info.size * (info.paths.length - 1);
    }
  }
  console.log(`重复文件: ${fileDupCount} 个`);
  console.log(`可节省: ${(fileDupSize / 1024 / 1024).toFixed(1)} MB (${(fileDupSize / totalSize * 100).toFixed(1)}%)`);
  
  console.log('\n=== 4KB 块去重 ===\n');
  let chunkDupSize = 0;
  let totalChunkSize = 0;
  for (const [, info] of chunkHashes) {
    totalChunkSize += info.size * info.count;
    if (info.count > 1) {
      chunkDupSize += info.size * (info.count - 1);
    }
  }
  console.log(`唯一块: ${chunkHashes.size} 个`);
  console.log(`可节省: ${(chunkDupSize / 1024 / 1024).toFixed(1)} MB (${(chunkDupSize / totalChunkSize * 100).toFixed(1)}%)`);
  
  console.log('\n=== 按数据类型分析 ===\n');
  for (const [type, stats] of typeStats) {
    const elemMap = elementHashes.get(type)!;
    let dupElements = 0;
    for (const [, info] of elemMap) {
      if (info.count > 1) dupElements += info.count - 1;
    }
    const totalSampled = [...elemMap.values()].reduce((sum, v) => sum + v.count, 0);
    const dedupRatio = dupElements / totalSampled;
    
    console.log(`${type}:`);
    console.log(`  文件: ${stats.count} 个, ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
    console.log(`  元素去重率（采样）: ${(dedupRatio * 100).toFixed(1)}%`);
  }
  
  console.log('\n=== 总结 ===\n');
  console.log(`buf/ib 总大小: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`文件级去重: ${(fileDupSize / 1024 / 1024).toFixed(1)} MB (${(fileDupSize / totalSize * 100).toFixed(1)}%)`);
  console.log(`块级去重: ${(chunkDupSize / 1024 / 1024).toFixed(1)} MB (${(chunkDupSize / totalChunkSize * 100).toFixed(1)}%)`);
  
  // 与 DDS 对比
  console.log('\n=== 与 DDS 对比 ===\n');
  console.log('DDS (28GB): BC 块去重 88% → 节省 24.7 GB');
  console.log(`buf/ib (${(totalSize / 1024 / 1024 / 1024).toFixed(2)}GB): 块去重 ${(chunkDupSize / totalChunkSize * 100).toFixed(1)}% → 节省 ${(chunkDupSize / 1024 / 1024).toFixed(1)} MB`);
}

main().catch(console.error);
