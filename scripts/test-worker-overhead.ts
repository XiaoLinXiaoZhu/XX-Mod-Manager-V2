/**
 * 测试 Worker 开销
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
      
      worker.postMessage(workerChunks.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength)));
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  return results;
}

async function main() {
  const modPath = process.argv[2] || 'data/mod-samples/露西-泳装';
  
  console.log(`测试 Worker 开销: ${modPath}\n`);
  
  // 收集块
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
  
  // 串行基准
  let serialStart = performance.now();
  const serialResults = chunks.map(chunk => ({
    hash: hashChunk(chunk),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  let serialTime = performance.now() - serialStart;
  console.log(`串行: ${serialTime.toFixed(0)} ms`);
  
  // Worker 测试（包含创建开销）
  for (const workerCount of [2, 4, 8]) {
    // 冷启动
    let coldStart = performance.now();
    await compressWithWorkers(chunks, workerCount);
    let coldTime = performance.now() - coldStart;
    
    // 热启动（第二次）
    let warmStart = performance.now();
    await compressWithWorkers(chunks, workerCount);
    let warmTime = performance.now() - warmStart;
    
    console.log(`Worker x${workerCount}: 冷启动 ${coldTime.toFixed(0)} ms, 热启动 ${warmTime.toFixed(0)} ms, 加速比 ${(serialTime/warmTime).toFixed(2)}x`);
  }
  
  // 测试 Worker 创建开销
  console.log('\n=== Worker 创建开销 ===');
  let createStart = performance.now();
  for (let i = 0; i < 10; i++) {
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.terminate();
  }
  let createTime = performance.now() - createStart;
  console.log(`创建+销毁 10 个 Worker: ${createTime.toFixed(0)} ms (平均 ${(createTime/10).toFixed(1)} ms/个)`);
}

main().catch(console.error);
