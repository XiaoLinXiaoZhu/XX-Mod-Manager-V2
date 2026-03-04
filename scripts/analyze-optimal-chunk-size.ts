/**
 * 分析 buf/ib 最优分块策略
 * 目标：找到去重率和索引开销的平衡点
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';

async function* walkFiles(dir: string, exts: string[]): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkFiles(fullPath, exts);
      } else if (exts.includes(extname(entry.name).toLowerCase())) {
        yield fullPath;
      }
    }
  } catch (e) {}
}

// 测试不同块大小的去重效果
async function testChunkSize(files: string[], chunkSize: number) {
  const hashes = new Map<string, number>();
  let totalChunks = 0;
  let totalSize = 0;
  
  for (const filePath of files) {
    try {
      const data = await readFile(filePath);
      totalSize += data.length;
      
      for (let offset = 0; offset + chunkSize <= data.length; offset += chunkSize) {
        const chunk = data.subarray(offset, offset + chunkSize);
        const hash = createHash('md5').update(chunk).digest('hex').slice(0, 12);
        hashes.set(hash, (hashes.get(hash) || 0) + 1);
        totalChunks++;
      }
    } catch (e) {}
  }
  
  const uniqueChunks = hashes.size;
  const dedupRatio = 1 - uniqueChunks / totalChunks;
  const indexOverhead = uniqueChunks * 20; // hash(12) + refCount(4) + offset(4)
  const storedSize = uniqueChunks * chunkSize + indexOverhead;
  const effectiveRatio = 1 - storedSize / totalSize;
  
  return {
    chunkSize,
    totalChunks,
    uniqueChunks,
    dedupRatio,
    indexOverhead,
    effectiveRatio
  };
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log('收集 buf/ib 文件...\n');
  
  const bufFiles: string[] = [];
  const ibFiles: string[] = [];
  
  for await (const filePath of walkFiles(modDir, ['.buf', '.ib'])) {
    if (filePath.endsWith('.ib')) {
      ibFiles.push(filePath);
    } else {
      bufFiles.push(filePath);
    }
    if (bufFiles.length + ibFiles.length >= 500) break; // 采样
  }
  
  console.log(`buf 文件: ${bufFiles.length}, ib 文件: ${ibFiles.length}\n`);
  
  // 测试 buf 不同块大小
  console.log('=== buf 文件分块测试 ===\n');
  console.log('块大小\t\t总块数\t\t唯一块\t\t去重率\t\t有效压缩率');
  
  for (const size of [64, 128, 256, 512, 1024, 2048, 4096]) {
    const result = await testChunkSize(bufFiles.slice(0, 200), size);
    console.log(`${size}B\t\t${result.totalChunks}\t\t${result.uniqueChunks}\t\t${(result.dedupRatio * 100).toFixed(1)}%\t\t${(result.effectiveRatio * 100).toFixed(1)}%`);
  }
  
  // 测试 ib 不同块大小
  console.log('\n=== ib 文件分块测试 ===\n');
  console.log('块大小\t\t总块数\t\t唯一块\t\t去重率\t\t有效压缩率');
  
  for (const size of [6, 12, 24, 48, 96, 192, 384]) { // 三角形索引 = 3 * 2B = 6B
    const result = await testChunkSize(ibFiles.slice(0, 200), size);
    console.log(`${size}B\t\t${result.totalChunks}\t\t${result.uniqueChunks}\t\t${(result.dedupRatio * 100).toFixed(1)}%\t\t${(result.effectiveRatio * 100).toFixed(1)}%`);
  }
  
  // 测试按顶点对齐的块大小
  console.log('\n=== 顶点对齐分块（Position: 12B/顶点）===\n');
  for (const vertices of [16, 32, 64, 128, 256]) {
    const size = vertices * 12; // vec3 float
    const result = await testChunkSize(bufFiles.slice(0, 200), size);
    console.log(`${vertices}顶点(${size}B)\t${result.totalChunks}\t\t${result.uniqueChunks}\t\t${(result.dedupRatio * 100).toFixed(1)}%\t\t${(result.effectiveRatio * 100).toFixed(1)}%`);
  }
}

main().catch(console.error);
