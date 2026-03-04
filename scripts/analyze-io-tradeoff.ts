/**
 * 完整分析：考虑 IO 开销的最优方案
 * 
 * IO 开销因素：
 * 1. 块数量 → 数据库查询次数
 * 2. 块大小 → 单次 IO 效率
 * 3. 索引大小 → 内存占用
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { createHash } from 'crypto';

async function* walkFiles(dir: string, exts: string[]): AsyncGenerator<{ path: string; size: number }> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkFiles(fullPath, exts);
      } else if (exts.includes(extname(entry.name).toLowerCase())) {
        const s = await stat(fullPath);
        yield { path: fullPath, size: s.size };
      }
    }
  } catch (e) {}
}

interface AnalysisResult {
  chunkSize: number;
  totalChunks: number;
  uniqueChunks: number;
  dedupRatio: number;
  totalDataSize: number;
  uniqueDataSize: number;
  indexOverhead: number;
  netSavings: number;
  netSavingsRatio: number;
  // IO 相关
  avgChunksPerFile: number;
  estimatedReadOps: number;  // 解压一个文件需要的读操作数
}

async function analyzeFileType(
  files: { path: string; size: number }[],
  chunkSizes: number[],
  fileType: string
): Promise<Map<number, AnalysisResult>> {
  const results = new Map<number, AnalysisResult>();
  
  for (const chunkSize of chunkSizes) {
    const hashes = new Map<string, number>();
    let totalChunks = 0;
    let totalDataSize = 0;
    let fileCount = 0;
    
    for (const file of files) {
      try {
        const data = await readFile(file.path);
        fileCount++;
        
        // DDS 跳过头部
        let startOffset = 0;
        if (fileType === 'dds') {
          startOffset = data.toString('ascii', 84, 88) === 'DX10' ? 148 : 128;
        }
        
        for (let offset = startOffset; offset + chunkSize <= data.length; offset += chunkSize) {
          const chunk = data.subarray(offset, offset + chunkSize);
          const hash = createHash('md5').update(chunk).digest('hex').slice(0, 16);
          hashes.set(hash, (hashes.get(hash) || 0) + 1);
          totalChunks++;
          totalDataSize += chunkSize;
        }
      } catch (e) {}
    }
    
    const uniqueChunks = hashes.size;
    const uniqueDataSize = uniqueChunks * chunkSize;
    const indexOverhead = uniqueChunks * 24; // hash + metadata
    const netSavings = totalDataSize - uniqueDataSize - indexOverhead;
    
    results.set(chunkSize, {
      chunkSize,
      totalChunks,
      uniqueChunks,
      dedupRatio: 1 - uniqueChunks / totalChunks,
      totalDataSize,
      uniqueDataSize,
      indexOverhead,
      netSavings,
      netSavingsRatio: netSavings / totalDataSize,
      avgChunksPerFile: totalChunks / fileCount,
      estimatedReadOps: uniqueChunks / fileCount, // 假设均匀分布
    });
  }
  
  return results;
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log(`分析目录: ${modDir}\n`);
  
  // 收集文件
  const ddsFiles: { path: string; size: number }[] = [];
  const bufFiles: { path: string; size: number }[] = [];
  const ibFiles: { path: string; size: number }[] = [];
  
  for await (const file of walkFiles(modDir, ['.dds', '.buf', '.ib'])) {
    const ext = extname(file.path).toLowerCase();
    if (ext === '.dds' && ddsFiles.length < 100) ddsFiles.push(file);
    else if (ext === '.buf' && bufFiles.length < 200) bufFiles.push(file);
    else if (ext === '.ib' && ibFiles.length < 200) ibFiles.push(file);
  }
  
  console.log(`DDS: ${ddsFiles.length}, buf: ${bufFiles.length}, ib: ${ibFiles.length}\n`);
  
  // 分析 DDS
  console.log('=== DDS 文件分析 ===\n');
  console.log('块大小\t\t去重率\t净收益\t平均块/文件\tIO评估');
  console.log('─'.repeat(70));
  
  const ddsResults = await analyzeFileType(ddsFiles, [256, 512, 1024, 4096, 16384, 65536], 'dds');
  for (const [size, r] of ddsResults) {
    const sizeStr = size >= 1024 ? `${size/1024}KB` : `${size}B`;
    const ioScore = r.avgChunksPerFile < 1000 ? '✅ 好' : r.avgChunksPerFile < 10000 ? '⚠️ 中' : '❌ 差';
    console.log(
      `${sizeStr.padEnd(8)}\t` +
      `${(r.dedupRatio * 100).toFixed(1)}%\t` +
      `${(r.netSavingsRatio * 100).toFixed(1)}%\t` +
      `${Math.round(r.avgChunksPerFile).toLocaleString()}\t\t` +
      `${ioScore}`
    );
  }
  
  // 分析 buf
  console.log('\n=== buf 文件分析 ===\n');
  console.log('块大小\t\t去重率\t净收益\t平均块/文件\tIO评估');
  console.log('─'.repeat(70));
  
  const bufResults = await analyzeFileType(bufFiles, [256, 512, 1024, 2048, 4096], 'buf');
  for (const [size, r] of bufResults) {
    const sizeStr = size >= 1024 ? `${size/1024}KB` : `${size}B`;
    const ioScore = r.avgChunksPerFile < 100 ? '✅ 好' : r.avgChunksPerFile < 500 ? '⚠️ 中' : '❌ 差';
    console.log(
      `${sizeStr.padEnd(8)}\t` +
      `${(r.dedupRatio * 100).toFixed(1)}%\t` +
      `${(r.netSavingsRatio * 100).toFixed(1)}%\t` +
      `${Math.round(r.avgChunksPerFile).toLocaleString()}\t\t` +
      `${ioScore}`
    );
  }
  
  // 分析 ib
  console.log('\n=== ib 文件分析 ===\n');
  console.log('块大小\t\t去重率\t净收益\t平均块/文件\tIO评估');
  console.log('─'.repeat(70));
  
  const ibResults = await analyzeFileType(ibFiles, [96, 192, 384, 768, 1536], 'ib');
  for (const [size, r] of ibResults) {
    const sizeStr = size >= 1024 ? `${size/1024}KB` : `${size}B`;
    const ioScore = r.avgChunksPerFile < 100 ? '✅ 好' : r.avgChunksPerFile < 500 ? '⚠️ 中' : '❌ 差';
    console.log(
      `${sizeStr.padEnd(8)}\t` +
      `${(r.dedupRatio * 100).toFixed(1)}%\t` +
      `${(r.netSavingsRatio * 100).toFixed(1)}%\t` +
      `${Math.round(r.avgChunksPerFile).toLocaleString()}\t\t` +
      `${ioScore}`
    );
  }
  
  // 综合建议
  console.log('\n=== 综合建议 ===\n');
  
  // 找最优平衡点
  const bestDds = [...ddsResults.entries()]
    .filter(([, r]) => r.avgChunksPerFile < 5000)
    .sort((a, b) => b[1].netSavingsRatio - a[1].netSavingsRatio)[0];
  
  const bestBuf = [...bufResults.entries()]
    .filter(([, r]) => r.avgChunksPerFile < 200)
    .sort((a, b) => b[1].netSavingsRatio - a[1].netSavingsRatio)[0];
  
  const bestIb = [...ibResults.entries()]
    .filter(([, r]) => r.avgChunksPerFile < 200)
    .sort((a, b) => b[1].netSavingsRatio - a[1].netSavingsRatio)[0];
  
  if (bestDds) {
    const [size, r] = bestDds;
    console.log(`DDS 推荐: ${size >= 1024 ? size/1024 + 'KB' : size + 'B'} 块`);
    console.log(`  净收益: ${(r.netSavingsRatio * 100).toFixed(1)}%, 平均 ${Math.round(r.avgChunksPerFile)} 块/文件`);
  }
  
  if (bestBuf) {
    const [size, r] = bestBuf;
    console.log(`buf 推荐: ${size >= 1024 ? size/1024 + 'KB' : size + 'B'} 块`);
    console.log(`  净收益: ${(r.netSavingsRatio * 100).toFixed(1)}%, 平均 ${Math.round(r.avgChunksPerFile)} 块/文件`);
  }
  
  if (bestIb) {
    const [size, r] = bestIb;
    console.log(`ib 推荐: ${size >= 1024 ? size/1024 + 'KB' : size + 'B'} 块`);
    console.log(`  净收益: ${(r.netSavingsRatio * 100).toFixed(1)}%, 平均 ${Math.round(r.avgChunksPerFile)} 块/文件`);
  }
  
  // 对比：直接 zstd 压缩
  console.log('\n=== 对比：直接 zstd 压缩 ===\n');
  console.log('DDS 文件已是压缩格式，zstd 再压缩效果有限（约 85%）');
  console.log('buf/ib 是原始二进制，zstd 压缩效果好（约 40-50%）');
  console.log('\n如果 chunk 去重净收益 < 50%，可能不如直接 zstd 压缩简单');
}

main().catch(console.error);
