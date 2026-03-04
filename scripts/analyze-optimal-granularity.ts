/**
 * 重新分析：找到最优的去重粒度
 * 目标：去重收益 > 索引开销
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { createHash } from 'crypto';

async function* walkDDS(dir: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkDDS(fullPath);
      } else if (extname(entry.name).toLowerCase() === '.dds') {
        yield fullPath;
      }
    }
  } catch (e) {}
}

// 测试不同块大小的实际收益
async function analyzeChunkSize(files: string[], chunkSize: number) {
  const hashes = new Map<string, number>(); // hash -> count
  let totalChunks = 0;
  let totalDataSize = 0;
  
  for (const filePath of files) {
    try {
      const data = await readFile(filePath);
      // 跳过头部 (128 或 148 bytes)
      const headerSize = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
      
      for (let offset = headerSize; offset + chunkSize <= data.length; offset += chunkSize) {
        const chunk = data.subarray(offset, offset + chunkSize);
        const hash = createHash('md5').update(chunk).digest('hex').slice(0, 16);
        hashes.set(hash, (hashes.get(hash) || 0) + 1);
        totalChunks++;
        totalDataSize += chunkSize;
      }
    } catch (e) {}
  }
  
  const uniqueChunks = hashes.size;
  const uniqueDataSize = uniqueChunks * chunkSize;
  
  // 索引开销：hash(16B) + offset(4B) + size(4B) = 24B per chunk
  const indexOverhead = uniqueChunks * 24;
  
  // 实际存储 = 唯一数据 + 索引
  const actualStorage = uniqueDataSize + indexOverhead;
  
  // 净收益
  const savings = totalDataSize - actualStorage;
  const savingsRatio = savings / totalDataSize;
  
  return {
    chunkSize,
    totalChunks,
    uniqueChunks,
    dedupRatio: 1 - uniqueChunks / totalChunks,
    totalDataSize,
    uniqueDataSize,
    indexOverhead,
    actualStorage,
    savings,
    savingsRatio,
  };
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  const sampleSize = parseInt(process.argv[3] || '100');
  
  console.log(`分析目录: ${modDir}`);
  console.log(`采样文件数: ${sampleSize}\n`);
  
  // 收集 DDS 文件
  const ddsFiles: string[] = [];
  for await (const filePath of walkDDS(modDir)) {
    ddsFiles.push(filePath);
    if (ddsFiles.length >= sampleSize) break;
  }
  
  console.log(`收集到 ${ddsFiles.length} 个 DDS 文件\n`);
  
  // 测试不同块大小
  const chunkSizes = [
    64,      // 4x4 BC7 块
    256,     // 16 个 BC7 块
    1024,    // 1KB
    4096,    // 4KB
    16384,   // 16KB
    65536,   // 64KB
    262144,  // 256KB
    1048576, // 1MB
  ];
  
  console.log('块大小\t\t总块数\t\t唯一块\t\t去重率\t\t索引开销\t净收益率');
  console.log('─'.repeat(90));
  
  for (const size of chunkSizes) {
    const result = await analyzeChunkSize(ddsFiles, size);
    const sizeStr = size >= 1024 ? `${size/1024}KB` : `${size}B`;
    console.log(
      `${sizeStr.padEnd(8)}\t` +
      `${result.totalChunks.toLocaleString().padEnd(12)}\t` +
      `${result.uniqueChunks.toLocaleString().padEnd(12)}\t` +
      `${(result.dedupRatio * 100).toFixed(1)}%\t\t` +
      `${(result.indexOverhead / 1024 / 1024).toFixed(2)}MB\t\t` +
      `${(result.savingsRatio * 100).toFixed(1)}%`
    );
  }
  
  // 特别分析：整个 mipmap 级别作为块
  console.log('\n=== Mipmap 级别去重分析 ===\n');
  
  const mipmapHashes = new Map<string, { count: number; size: number }>();
  let totalMipmapSize = 0;
  
  for (const filePath of ddsFiles.slice(0, 50)) {
    try {
      const data = await readFile(filePath);
      const headerSize = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
      const width = data.readUInt32LE(16);
      const height = data.readUInt32LE(12);
      const mipmapCount = data.readUInt32LE(28) || 1;
      
      // BC7 块大小
      const blockSize = 16;
      
      let offset = headerSize;
      let w = width, h = height;
      
      for (let level = 0; level < mipmapCount && offset < data.length; level++) {
        const blocksW = Math.max(1, Math.ceil(w / 4));
        const blocksH = Math.max(1, Math.ceil(h / 4));
        const levelSize = blocksW * blocksH * blockSize;
        
        if (offset + levelSize > data.length) break;
        
        const levelData = data.subarray(offset, offset + levelSize);
        const hash = createHash('md5').update(levelData).digest('hex');
        
        const existing = mipmapHashes.get(hash);
        if (existing) {
          existing.count++;
        } else {
          mipmapHashes.set(hash, { count: 1, size: levelSize });
        }
        
        totalMipmapSize += levelSize;
        offset += levelSize;
        w = Math.max(1, w >> 1);
        h = Math.max(1, h >> 1);
      }
    } catch (e) {}
  }
  
  let uniqueMipmapSize = 0;
  for (const [, info] of mipmapHashes) {
    uniqueMipmapSize += info.size;
  }
  
  const mipmapIndexOverhead = mipmapHashes.size * 40; // hash(32) + size(4) + offset(4)
  const mipmapActualStorage = uniqueMipmapSize + mipmapIndexOverhead;
  const mipmapSavings = totalMipmapSize - mipmapActualStorage;
  
  console.log(`总 mipmap 数据: ${(totalMipmapSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`唯一 mipmap: ${mipmapHashes.size} 个, ${(uniqueMipmapSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`索引开销: ${(mipmapIndexOverhead / 1024).toFixed(2)} KB`);
  console.log(`净收益: ${(mipmapSavings / 1024 / 1024).toFixed(2)} MB (${(mipmapSavings / totalMipmapSize * 100).toFixed(1)}%)`);
}

main().catch(console.error);
