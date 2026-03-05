/**
 * 并行压缩 Worker
 * 使用 Bun 的 Worker 实现真正的多线程压缩
 */

import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

// Worker 消息类型
interface WorkerMessage {
  type: 'compress';
  chunks: Buffer[];
  startIndex: number;
}

interface WorkerResult {
  type: 'result';
  results: { hash: string; compressed: Buffer; originalSize: number }[];
  startIndex: number;
}

// 如果是 Worker 线程
if (!Bun.isMainThread) {
  self.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const { chunks, startIndex } = event.data;
    
    const results = chunks.map(chunk => ({
      hash: createHash('md5').update(chunk).digest('hex').slice(0, 16),
      compressed: gzipSync(chunk, { level: 6 }),
      originalSize: chunk.length,
    }));
    
    self.postMessage({ type: 'result', results, startIndex } as WorkerResult);
  };
}

/** 并行压缩块 */
export async function compressChunksParallel(
  chunks: Buffer[],
  workerCount: number = 4
): Promise<{ hash: string; compressed: Buffer; originalSize: number }[]> {
  if (chunks.length === 0) return [];
  
  // 小数据量直接串行处理
  if (chunks.length < 100) {
    return chunks.map(chunk => ({
      hash: createHash('md5').update(chunk).digest('hex').slice(0, 16),
      compressed: gzipSync(chunk, { level: 6 }),
      originalSize: chunk.length,
    }));
  }
  
  const results: { hash: string; compressed: Buffer; originalSize: number }[] = new Array(chunks.length);
  const chunkSize = Math.ceil(chunks.length / workerCount);
  
  const workers: Worker[] = [];
  const promises: Promise<void>[] = [];
  
  for (let i = 0; i < workerCount; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, chunks.length);
    if (start >= chunks.length) break;
    
    const workerChunks = chunks.slice(start, end);
    
    const promise = new Promise<void>((resolve, reject) => {
      const worker = new Worker(new URL(import.meta.url));
      workers.push(worker);
      
      worker.onmessage = (event: MessageEvent<WorkerResult>) => {
        const { results: workerResults, startIndex } = event.data;
        for (let j = 0; j < workerResults.length; j++) {
          results[startIndex + j] = workerResults[j];
        }
        worker.terminate();
        resolve();
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      worker.postMessage({ type: 'compress', chunks: workerChunks, startIndex: start } as WorkerMessage);
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  
  return results;
}
