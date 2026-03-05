/**
 * 测试不同压缩方案的解压速度
 * 目标：单个 mod 解压时间 < 3s
 */

import { readFile, readdir, stat, writeFile, mkdir, rm } from 'fs/promises';
import { join, extname, basename } from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import { existsSync } from 'fs';

async function* walkFiles(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(fullPath);
    } else {
      yield fullPath;
    }
  }
}

async function testModDecompression(modPath: string) {
  const modName = basename(modPath);
  
  // 收集所有资源文件
  const files: { path: string; data: Buffer }[] = [];
  let totalSize = 0;
  
  for await (const filePath of walkFiles(modPath)) {
    const ext = extname(filePath).toLowerCase();
    if (['.dds', '.buf', '.ib'].includes(ext)) {
      const data = await readFile(filePath);
      files.push({ path: filePath, data });
      totalSize += data.length;
    }
  }
  
  if (files.length === 0) return null;
  
  // 方案 1: 纯 gzip 压缩
  const compressedFiles = files.map(f => ({
    path: f.path,
    compressed: gzipSync(f.data, { level: 6 }) // level 6 平衡速度和压缩率
  }));
  const compressedSize = compressedFiles.reduce((sum, f) => sum + f.compressed.length, 0);
  
  // 测试解压速度
  const start = performance.now();
  for (const f of compressedFiles) {
    gunzipSync(f.compressed);
  }
  const decompressTime = performance.now() - start;
  
  return {
    modName,
    fileCount: files.length,
    originalSize: totalSize,
    compressedSize,
    compressionRatio: 1 - compressedSize / totalSize,
    decompressTimeMs: decompressTime,
  };
}

async function main() {
  const modsDir = process.argv[2] || 'data/mod-samples';
  
  console.log('测试解压速度...\n');
  console.log('Mod 名称\t\t\t文件数\t原始大小\t压缩后\t\t压缩率\t解压时间');
  console.log('─'.repeat(100));
  
  const entries = await readdir(modsDir, { withFileTypes: true });
  const results: any[] = [];
  
  for (const entry of entries.filter(e => e.isDirectory()).slice(0, 20)) {
    const modPath = join(modsDir, entry.name);
    const result = await testModDecompression(modPath);
    
    if (result) {
      results.push(result);
      const name = result.modName.slice(0, 24).padEnd(24);
      console.log(
        `${name}\t${result.fileCount}\t` +
        `${(result.originalSize / 1024 / 1024).toFixed(1)} MB\t\t` +
        `${(result.compressedSize / 1024 / 1024).toFixed(1)} MB\t\t` +
        `${(result.compressionRatio * 100).toFixed(0)}%\t` +
        `${result.decompressTimeMs.toFixed(0)} ms`
      );
    }
  }
  
  console.log('\n=== 统计 ===\n');
  
  const avgDecompressTime = results.reduce((sum, r) => sum + r.decompressTimeMs, 0) / results.length;
  const maxDecompressTime = Math.max(...results.map(r => r.decompressTimeMs));
  const avgCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length;
  
  console.log(`平均解压时间: ${avgDecompressTime.toFixed(0)} ms`);
  console.log(`最大解压时间: ${maxDecompressTime.toFixed(0)} ms`);
  console.log(`平均压缩率: ${(avgCompressionRatio * 100).toFixed(1)}%`);
  
  // 找出解压最慢的 mod
  const slowest = results.sort((a, b) => b.decompressTimeMs - a.decompressTimeMs)[0];
  console.log(`\n最慢的 mod: ${slowest.modName}`);
  console.log(`  大小: ${(slowest.originalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  解压时间: ${slowest.decompressTimeMs.toFixed(0)} ms`);
  
  // 估算 chunk 去重 + gzip 的解压时间
  // chunk 去重需要额外的数据库查询开销
  console.log('\n=== 方案对比 ===\n');
  console.log('方案\t\t\t压缩率\t解压时间(估算)');
  console.log('─'.repeat(50));
  console.log(`纯 gzip\t\t\t${(avgCompressionRatio * 100).toFixed(0)}%\t${avgDecompressTime.toFixed(0)} ms`);
  console.log(`chunk 去重\t\t43%\t~${(avgDecompressTime * 0.3).toFixed(0)} ms (无解压)`);
  console.log(`chunk + gzip\t\t~80%\t~${(avgDecompressTime * 1.2).toFixed(0)} ms (去重+解压)`);
}

main().catch(console.error);
