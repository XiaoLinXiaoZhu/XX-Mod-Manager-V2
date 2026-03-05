/**
 * 分析归档各阶段耗时
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';
import { Database } from 'bun:sqlite';

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
  
  console.log(`分析归档各阶段耗时: ${modPath}\n`);
  
  // 1. 文件读取
  let readStart = performance.now();
  const ddsFiles: { data: Buffer }[] = [];
  for (const filePath of walkFiles(modPath)) {
    if (extname(filePath).toLowerCase() === '.dds') {
      ddsFiles.push({ data: readFileSync(filePath) });
    }
  }
  let readTime = performance.now() - readStart;
  
  // 2. 分块
  let splitStart = performance.now();
  const chunks: Buffer[] = [];
  const CHUNK_SIZE = 4096;
  for (const { data } of ddsFiles) {
    const headerSize = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
    for (let offset = headerSize; offset < data.length; offset += CHUNK_SIZE) {
      const end = Math.min(offset + CHUNK_SIZE, data.length);
      chunks.push(Buffer.from(data.subarray(offset, end)));
    }
  }
  let splitTime = performance.now() - splitStart;
  
  // 3. Hash + 压缩（串行）
  let processStart = performance.now();
  const prepared = chunks.map(chunk => ({
    hash: hashChunk(chunk),
    compressed: gzipSync(chunk, { level: 6 }),
    originalSize: chunk.length,
  }));
  let processTime = performance.now() - processStart;
  
  // 4. 数据库写入（模拟）
  const db = new Database(':memory:');
  db.run('PRAGMA journal_mode = WAL');
  db.run(`CREATE TABLE chunks (hash TEXT PRIMARY KEY, data BLOB, original_size INTEGER, ref_count INTEGER)`);
  
  let dbStart = performance.now();
  const stmtInsert = db.query('INSERT OR IGNORE INTO chunks VALUES (?, ?, ?, 1)');
  db.run('BEGIN TRANSACTION');
  for (const { hash, compressed, originalSize } of prepared) {
    stmtInsert.run(hash, compressed, originalSize);
  }
  db.run('COMMIT');
  let dbTime = performance.now() - dbStart;
  
  // 5. 数据库写入（逐条提交）
  const db2 = new Database(':memory:');
  db2.run('PRAGMA journal_mode = WAL');
  db2.run(`CREATE TABLE chunks (hash TEXT PRIMARY KEY, data BLOB, original_size INTEGER, ref_count INTEGER)`);
  
  let db2Start = performance.now();
  const stmt2 = db2.query('INSERT OR IGNORE INTO chunks VALUES (?, ?, ?, 1)');
  for (const { hash, compressed, originalSize } of prepared) {
    stmt2.run(hash, compressed, originalSize);
  }
  let db2Time = performance.now() - db2Start;
  
  const total = readTime + splitTime + processTime + dbTime;
  
  console.log('=== 各阶段耗时 ===\n');
  console.log(`文件读取:     ${readTime.toFixed(0)} ms (${(readTime/total*100).toFixed(1)}%)`);
  console.log(`分块:         ${splitTime.toFixed(0)} ms (${(splitTime/total*100).toFixed(1)}%)`);
  console.log(`Hash+压缩:    ${processTime.toFixed(0)} ms (${(processTime/total*100).toFixed(1)}%)`);
  console.log(`DB写入(批量): ${dbTime.toFixed(0)} ms (${(dbTime/total*100).toFixed(1)}%)`);
  console.log(`DB写入(逐条): ${db2Time.toFixed(0)} ms`);
  console.log(`\n总计: ${total.toFixed(0)} ms`);
  console.log(`块数量: ${chunks.length}`);
  
  db.close();
  db2.close();
}

main().catch(console.error);
