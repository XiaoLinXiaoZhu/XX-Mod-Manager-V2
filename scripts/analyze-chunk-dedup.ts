/**
 * 分析 mod 文件的 chunk 级去重潜力
 * 使用 content-defined chunking (CDC) 算法
 */

import { createHash } from 'crypto';
import { readdir, stat, readFile } from 'fs/promises';
import { join, extname } from 'path';

// CDC 参数
const MIN_CHUNK_SIZE = 4 * 1024;      // 4KB
const AVG_CHUNK_SIZE = 16 * 1024;     // 16KB
const MAX_CHUNK_SIZE = 64 * 1024;     // 64KB
const MASK = (1 << 14) - 1;           // ~16KB average

// Rabin fingerprint 滚动哈希
function rollingHash(data: Buffer, pos: number, windowSize: number): number {
  let hash = 0;
  const end = Math.min(pos + windowSize, data.length);
  for (let i = pos; i < end; i++) {
    hash = ((hash << 1) + data[i]) >>> 0;
  }
  return hash;
}

// CDC 分块
function* chunkBuffer(data: Buffer): Generator<{ offset: number; size: number; hash: string }> {
  let offset = 0;
  
  while (offset < data.length) {
    let chunkEnd = offset + MIN_CHUNK_SIZE;
    
    if (chunkEnd >= data.length) {
      // 剩余数据不足最小块
      const chunk = data.subarray(offset);
      yield {
        offset,
        size: chunk.length,
        hash: createHash('sha256').update(chunk).digest('hex').slice(0, 16)
      };
      break;
    }
    
    // 寻找分块边界
    while (chunkEnd < data.length && chunkEnd - offset < MAX_CHUNK_SIZE) {
      const hash = rollingHash(data, chunkEnd - 48, 48);
      if ((hash & MASK) === 0) break;
      chunkEnd++;
    }
    
    const chunk = data.subarray(offset, chunkEnd);
    yield {
      offset,
      size: chunk.length,
      hash: createHash('sha256').update(chunk).digest('hex').slice(0, 16)
    };
    
    offset = chunkEnd;
  }
}

// 递归获取文件
async function* walkFiles(dir: string, exts: string[]): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath, exts);
    } else if (exts.includes(extname(entry.name).toLowerCase())) {
      yield fullPath;
    }
  }
}

async function main() {
  const modDir = process.argv[2] || 'data/mod-samples';
  const targetExts = ['.dds', '.buf', '.ib'];
  
  console.log(`分析目录: ${modDir}`);
  console.log(`目标扩展名: ${targetExts.join(', ')}`);
  console.log(`CDC 参数: min=${MIN_CHUNK_SIZE/1024}KB, avg=${AVG_CHUNK_SIZE/1024}KB, max=${MAX_CHUNK_SIZE/1024}KB\n`);
  
  const chunkMap = new Map<string, { count: number; size: number; files: string[] }>();
  let totalFiles = 0;
  let totalSize = 0;
  let totalChunks = 0;
  
  for await (const filePath of walkFiles(modDir, targetExts)) {
    totalFiles++;
    const data = await readFile(filePath);
    totalSize += data.length;
    
    for (const chunk of chunkBuffer(data)) {
      totalChunks++;
      const existing = chunkMap.get(chunk.hash);
      if (existing) {
        existing.count++;
        if (existing.files.length < 3) existing.files.push(filePath);
      } else {
        chunkMap.set(chunk.hash, { count: 1, size: chunk.size, files: [filePath] });
      }
    }
    
    if (totalFiles % 100 === 0) {
      process.stdout.write(`\r已处理 ${totalFiles} 个文件...`);
    }
  }
  
  console.log(`\r已处理 ${totalFiles} 个文件\n`);
  
  // 统计
  let uniqueChunks = 0;
  let uniqueSize = 0;
  let duplicateChunks = 0;
  let duplicateSize = 0;
  
  const duplicateGroups: Array<{ hash: string; count: number; size: number; files: string[] }> = [];
  
  for (const [hash, info] of chunkMap) {
    uniqueChunks++;
    uniqueSize += info.size;
    if (info.count > 1) {
      duplicateChunks += info.count - 1;
      duplicateSize += info.size * (info.count - 1);
      duplicateGroups.push({ hash, ...info });
    }
  }
  
  // 按节省空间排序
  duplicateGroups.sort((a, b) => b.size * (b.count - 1) - a.size * (a.count - 1));
  
  console.log('=== 分析结果 ===\n');
  console.log(`总文件数: ${totalFiles}`);
  console.log(`总大小: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`总 chunk 数: ${totalChunks}`);
  console.log(`唯一 chunk 数: ${uniqueChunks}`);
  console.log(`去重后大小: ${(uniqueSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`可节省空间: ${(duplicateSize / 1024 / 1024).toFixed(2)} MB (${(duplicateSize / totalSize * 100).toFixed(1)}%)`);
  
  console.log('\n=== Top 10 重复 chunk ===\n');
  for (const group of duplicateGroups.slice(0, 10)) {
    const savings = (group.size * (group.count - 1) / 1024).toFixed(1);
    console.log(`${group.hash}: ${group.count}次, ${(group.size/1024).toFixed(1)}KB, 节省 ${savings}KB`);
    console.log(`  文件: ${group.files.slice(0, 2).map(f => f.split(/[/\\]/).slice(-2).join('/')).join(', ')}...`);
  }
  
  // 按扩展名统计
  console.log('\n=== 按扩展名统计 ===\n');
  const extStats = new Map<string, { files: number; size: number; chunks: number; uniqueChunks: Set<string> }>();
  
  for await (const filePath of walkFiles(modDir, targetExts)) {
    const ext = extname(filePath).toLowerCase();
    const data = await readFile(filePath);
    
    let stats = extStats.get(ext);
    if (!stats) {
      stats = { files: 0, size: 0, chunks: 0, uniqueChunks: new Set() };
      extStats.set(ext, stats);
    }
    
    stats.files++;
    stats.size += data.length;
    
    for (const chunk of chunkBuffer(data)) {
      stats.chunks++;
      stats.uniqueChunks.add(chunk.hash);
    }
  }
  
  for (const [ext, stats] of extStats) {
    const dedupRatio = (1 - stats.uniqueChunks.size / stats.chunks) * 100;
    console.log(`${ext}: ${stats.files} 文件, ${(stats.size/1024/1024).toFixed(1)}MB, 去重率 ${dedupRatio.toFixed(1)}%`);
  }
}

main().catch(console.error);
