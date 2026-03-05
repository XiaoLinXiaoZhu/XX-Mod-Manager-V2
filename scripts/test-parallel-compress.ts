/**
 * 测试并行压缩性能
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
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

// Worker 代码
const workerCode = `
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

self.onmessage = (event) => {
  const chunks = event.data;
  const results = chunks.map(chunk => {
    const buf = Buffer.from(chunk);
    return {
      hash: createHash('md5').update(buf).digest('hex').slice(0, 16),
      compressed: gzipSync(buf, { level: 6 }),
      originalSize: buf.length,
    };
  });
  self.postMessage(results);
};
`;

async function compressWithWorkers(chunks: Buffer[], workerCount: number): Promise<any[]> {
  const results: any[] = new Array(chunks.length);
  const chunkSize = Math.ceil(chunks.length / workerCount);
  
  const promises: Promise<void>[] = [];
  
  for (let i = 0; i < workerCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, chunks.length);
    if (start >= chunks.length) break;
    
    const workerChunks = chunks.slice(start, end);
    
    const promise = new Promise<void>((resolve, reject) => {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (event) => {
        const workerResults = event.data;
        for (let j = 0; j < workerResults.length; j++) {
          results[start + j] = workerResults[j];
        }
        worker.terminate();
        resolve();
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      // 发送原始数据（ArrayBuffer）
      worker.postMessage(workerChunks.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength)));
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  return results;
}

async function main() {
  const modPath = process.argv[2] || 'data/mod-samples/露西-泳装';
  
  console.log(`测试并行压缩: ${modPath}\n`);
  
  // 收集所有块
  const chunks: Buffer[] = [];
  const CHUNK_SIZE = 4096;
  
  for (const filePath of walkFiles(modPath)) {
    if (extname(filePath).toLowerCase() !== '.dds') continue;
    
    const data = readFileSync(filePath);
    const headerSize = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
    
    for (let offset = headerSize; offset < data.length; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, data.length);
      chunks.push(Buffer.from(data.subarray(offset, end)));
    }
  }
  
  console.log(`块数量: ${chunks.length}\n`);
  
  // 串行测试
  let serialStart = performance.now();
  const serialResults = chunks.map(chunk => ({
    hash: hashChunk(chunk),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  let serialTime = performance.now() - serialStart;
  console.log(`串行: ${serialTime.toFixed(0)} ms`);
  
  // 并行测试 (2 workers)
  let parallel2Start = performance.now();
  await compressWithWorkers(chunks, 2);
  let parallel2Time = performance.now() - parallel2Start;
  console.log(`并行 (2 workers): ${parallel2Time.toFixed(0)} ms`);
  
  // 并行测试 (4 workers)
  let parallel4Start = performance.now();
  await compressWithWorkers(chunks, 4);
  let parallel4Time = performance.now() - parallel4Start;
  console.log(`并行 (4 workers): ${parallel4Time.toFixed(0)} ms`);
  
  // 并行测试 (8 workers)
  let parallel8Start = performance.now();
  await compressWithWorkers(chunks, 8);
  let parallel8Time = performance.now() - parallel8Start;
  console.log(`并行 (8 workers): ${parallel8Time.toFixed(0)} ms`);
  
  console.log(`\n加速比:`);
  console.log(`  2 workers: ${(serialTime / parallel2Time).toFixed(2)}x`);
  console.log(`  4 workers: ${(serialTime / parallel4Time).toFixed(2)}x`);
  console.log(`  8 workers: ${(serialTime / parallel8Time).toFixed(2)}x`);
}

main().catch(console.error);
