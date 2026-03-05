/**
 * 对比分析：NTFS 压缩 vs chunk 去重
 * 
 * 测试 DDS 文件的压缩潜力
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { gzipSync } from 'zlib';

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

async function main() {
  const modDir = process.argv[2] || 'data/mod-samples';
  
  let totalOriginal = 0;
  let totalGzip = 0;
  let ddsOriginal = 0;
  let ddsGzip = 0;
  let bufOriginal = 0;
  let bufGzip = 0;
  
  console.log('分析文件压缩潜力...\n');
  
  let fileCount = 0;
  for await (const filePath of walkFiles(modDir)) {
    const ext = extname(filePath).toLowerCase();
    if (!['.dds', '.buf', '.ib'].includes(ext)) continue;
    
    const data = await readFile(filePath);
    const compressed = gzipSync(data, { level: 9 });
    
    totalOriginal += data.length;
    totalGzip += compressed.length;
    
    if (ext === '.dds') {
      ddsOriginal += data.length;
      ddsGzip += compressed.length;
    } else {
      bufOriginal += data.length;
      bufGzip += compressed.length;
    }
    
    fileCount++;
    if (fileCount % 100 === 0) {
      process.stdout.write(`\r已分析 ${fileCount} 个文件...`);
    }
  }
  
  console.log(`\r已分析 ${fileCount} 个文件\n`);
  
  console.log('=== 压缩效果对比 ===\n');
  
  console.log('DDS 文件:');
  console.log(`  原始: ${(ddsOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  gzip: ${(ddsGzip / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  压缩率: ${((1 - ddsGzip / ddsOriginal) * 100).toFixed(1)}%`);
  
  console.log('\nbuf/ib 文件:');
  console.log(`  原始: ${(bufOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  gzip: ${(bufGzip / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  压缩率: ${((1 - bufGzip / bufOriginal) * 100).toFixed(1)}%`);
  
  console.log('\n总计:');
  console.log(`  原始: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  gzip: ${(totalGzip / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  压缩率: ${((1 - totalGzip / totalOriginal) * 100).toFixed(1)}%`);
  
  console.log('\n=== 结论 ===\n');
  console.log('如果 DDS gzip 压缩率 > 15%，说明 DDS 文件有压缩空间');
  console.log('NTFS 压缩使用 LZ77 算法，类似 gzip');
}

main().catch(console.error);
