/**
 * 测试数据传输开销
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
  const startTime = performance.now();
  const chunks = event.data.map(ab => Buffer.from(ab));
  const parseTime = performance.now() - startTime;
  
  const processStart = performance.now();
  const results = chunks.map(chunk => ({
    hash: createHash('md5').update(chunk).digest('hex').slice(0, 16),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  const processTime = performance.now() - processStart;
  
  self.postMessage({ results, parseTime, processTime });
};
`;

async function main() {
  const modPath = process.argv[2] || 'data/mod-samples/露西-泳装';
  
  console.log(`测试数据传输开销: ${modPath}\n`);
  
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
  
  const totalSize = chunks.reduce((sum, c) => sum + c.length, 0);
  console.log(`块数量: ${chunks.length}, 总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB\n`);
  
  // 测试单个 Worker
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  
  const sendStart = performance.now();
  const arrayBuffers = chunks.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength));
  const prepareTime = performance.now() - sendStart;
  
  await new Promise<void>((resolve) => {
    const postStart = performance.now();
    
    worker.onmessage = (event) => {
      const receiveTime = performance.now() - postStart;
      const { parseTime, processTime } = event.data;
      
      console.log('=== 耗时分解 ===\n');
      console.log(`准备 ArrayBuffer: ${prepareTime.toFixed(0)} ms`);
      console.log(`发送 + 接收总时间: ${receiveTime.toFixed(0)} ms`);
      console.log(`  - Worker 内解析: ${parseTime.toFixed(0)} ms`);
      console.log(`  - Worker 内处理: ${processTime.toFixed(0)} ms`);
      console.log(`  - 传输开销: ${(receiveTime - parseTime - processTime).toFixed(0)} ms`);
      
      worker.terminate();
      resolve();
    };
    
    worker.postMessage(arrayBuffers);
  });
}

main().catch(console.error);
