/**
 * 测试 Transferable 传输
 */

import { readFileSync, readdirSync } from 'fs';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

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
  const chunks = event.data.map(ab => Buffer.from(ab));
  
  const results = chunks.map(chunk => ({
    hash: createHash('md5').update(chunk).digest('hex').slice(0, 16),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  
  self.postMessage(results);
};
`;

async function compressWithTransfer(chunks: Buffer[], workerCount: number): Promise<any[]> {
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
      
      // 使用 Transferable 传输
      const arrayBuffers = workerChunks.map(c => {
        // 创建新的 ArrayBuffer 并复制数据
        const ab = new ArrayBuffer(c.length);
        new Uint8Array(ab).set(c);
        return ab;
      });
      
      // 传输所有权，避免复制
      worker.postMessage(arrayBuffers, arrayBuffers);
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  return results;
}

async function compressWithCopy(chunks: Buffer[], workerCount: number): Promise<any[]> {
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
      
      // 普通传输（复制）
      const arrayBuffers = workerChunks.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength));
      worker.postMessage(arrayBuffers);
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  return results;
}

async function main() {
  const modPath = process.argv[2] || 'data/mod-samples/露西-泳装';
  
  console.log(`测试 Transferable 传输: ${modPath}\n`);
  
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
  chunks.map(chunk => ({
    hash: createHash('md5').update(chunk).digest('hex').slice(0, 16),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  let serialTime = performance.now() - serialStart;
  console.log(`串行: ${serialTime.toFixed(0)} ms`);
  
  // 普通传输
  let copyStart = performance.now();
  await compressWithCopy(chunks, 4);
  let copyTime = performance.now() - copyStart;
  console.log(`Worker x4 (复制): ${copyTime.toFixed(0)} ms, 加速比 ${(serialTime/copyTime).toFixed(2)}x`);
  
  // Transferable 传输
  let transferStart = performance.now();
  await compressWithTransfer(chunks, 4);
  let transferTime = performance.now() - transferStart;
  console.log(`Worker x4 (Transfer): ${transferTime.toFixed(0)} ms, 加速比 ${(serialTime/transferTime).toFixed(2)}x`);
}

main().catch(console.error);
