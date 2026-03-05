/**
 * 分析归档瓶颈
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

function hashChunk(data: Buffer): string {
  return createHash('md5').update(data).digest('hex').slice(0, 16);
}

function* walkFiles(dir: string): Generator<string> {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(fullPath);
    else yield fullPath;
  }
}

async function main() {
  const modPath = process.argv[2] || 'data/mod-samples/露西-泳装';
  
  console.log(`分析 mod: ${modPath}\n`);
  
  // 收集 DDS 文件
  const ddsFiles: { path: string; data: Buffer }[] = [];
  let totalSize = 0;
  
  for (const filePath of walkFiles(modPath)) {
    if (extname(filePath).toLowerCase() === '.dds') {
      const data = readFileSync(filePath);
      ddsFiles.push({ path: filePath, data });
      totalSize += data.length;
    }
  }
  
  console.log(`DDS 文件: ${ddsFiles.length} 个, 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  // 测试各阶段耗时
  const CHUNK_SIZE = 4096;
  
  // 1. 文件读取（已完成）
  console.log('1. 文件读取: 已完成\n');
  
  // 2. 分块
  let chunks: Buffer[] = [];
  let splitStart = performance.now();
  for (const { data } of ddsFiles) {
    const headerSize = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
    for (let offset = headerSize; offset < data.length; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, data.length);
      chunks.push(Buffer.from(data.subarray(offset, end)));
    }
  }
  let splitTime = performance.now() - splitStart;
  console.log(`2. 分块: ${splitTime.toFixed(0)} ms (${chunks.length} 个块)\n`);
  
  // 3. 计算 hash（串行）
  let hashStart = performance.now();
  const hashes: string[] = [];
  for (const chunk of chunks) {
    hashes.push(hashChunk(chunk));
  }
  let hashTime = performance.now() - hashStart;
  console.log(`3. 计算 hash (串行): ${hashTime.toFixed(0)} ms\n`);
  
  // 4. gzip 压缩（串行）
  let compressStart = performance.now();
  const compressed: Buffer[] = [];
  for (const chunk of chunks) {
    compressed.push(gzipSync(chunk, { level: 6 }));
  }
  let compressTime = performance.now() - compressStart;
  console.log(`4. gzip 压缩 (串行): ${compressTime.toFixed(0)} ms\n`);
  
  // 5. 并行压缩测试
  let parallelStart = performance.now();
  const parallelCompressed = await Promise.all(
    chunks.map(chunk => Promise.resolve(gzipSync(chunk, { level: 6 })))
  );
  let parallelTime = performance.now() - parallelStart;
  console.log(`5. gzip 压缩 (Promise.all): ${parallelTime.toFixed(0)} ms\n`);
  
  // 总结
  console.log('=== 瓶颈分析 ===\n');
  console.log(`分块: ${splitTime.toFixed(0)} ms (${(splitTime / (splitTime + hashTime + compressTime) * 100).toFixed(1)}%)`);
  console.log(`hash: ${hashTime.toFixed(0)} ms (${(hashTime / (splitTime + hashTime + compressTime) * 100).toFixed(1)}%)`);
  console.log(`压缩: ${compressTime.toFixed(0)} ms (${(compressTime / (splitTime + hashTime + compressTime) * 100).toFixed(1)}%)`);
  console.log(`\n压缩是主要瓶颈！`);
}

main().catch(console.error);
