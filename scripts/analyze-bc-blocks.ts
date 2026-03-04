/**
 * BC 块级别去重分析
 * BC 格式每 4x4 像素块独立编码，可以按块去重
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { createHash } from 'crypto';

async function* walkDDS(dir: string): AsyncGenerator<string> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        yield* walkDDS(fullPath);
      } else if (extname(entry.name).toLowerCase() === '.dds') {
        yield fullPath;
      }
    }
  } catch (e) {}
}

function parseDDSHeader(buffer: Buffer) {
  if (buffer.length < 128 || buffer.toString('ascii', 0, 4) !== 'DDS ') return null;
  
  const height = buffer.readUInt32LE(12);
  const width = buffer.readUInt32LE(16);
  const fourCC = buffer.toString('ascii', 84, 88);
  
  let dataOffset = 128;
  let format = fourCC;
  let blockSize = 16; // BC7 default
  
  if (fourCC === 'DX10') {
    dataOffset = 148;
    const dxgiFormat = buffer.readUInt32LE(128);
    format = `DX10_${dxgiFormat}`;
    // BC1/BC4 = 8 bytes, BC2/BC3/BC5/BC6/BC7 = 16 bytes
    if (dxgiFormat === 71 || dxgiFormat === 72 || dxgiFormat === 80 || dxgiFormat === 81) {
      blockSize = 8;
    }
  } else if (fourCC === 'DXT1') {
    blockSize = 8;
  }
  
  return { width, height, dataOffset, format, blockSize };
}

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  const sampleSize = parseInt(process.argv[3] || '500');
  
  console.log(`BC 块级别去重分析: ${modDir}`);
  console.log(`采样文件数: ${sampleSize}\n`);
  
  // 收集所有 BC 块的 hash
  const blockHashes = new Map<string, { count: number; size: number }>();
  
  let totalFiles = 0;
  let totalBlocks = 0;
  let totalBlockSize = 0;
  
  for await (const filePath of walkDDS(modDir)) {
    if (totalFiles >= sampleSize) break;
    
    try {
      const buffer = await readFile(filePath);
      const header = parseDDSHeader(buffer);
      if (!header) continue;
      
      totalFiles++;
      
      // 只分析 level 0
      const blocksW = Math.ceil(header.width / 4);
      const blocksH = Math.ceil(header.height / 4);
      const level0Size = blocksW * blocksH * header.blockSize;
      
      if (header.dataOffset + level0Size > buffer.length) continue;
      
      // 遍历每个块
      let offset = header.dataOffset;
      for (let i = 0; i < blocksW * blocksH && offset + header.blockSize <= buffer.length; i++) {
        const block = buffer.subarray(offset, offset + header.blockSize);
        const hash = createHash('md5').update(block).digest('hex').slice(0, 12);
        
        const existing = blockHashes.get(hash);
        if (existing) {
          existing.count++;
        } else {
          blockHashes.set(hash, { count: 1, size: header.blockSize });
        }
        
        totalBlocks++;
        totalBlockSize += header.blockSize;
        offset += header.blockSize;
      }
      
      if (totalFiles % 100 === 0) {
        process.stdout.write(`\r已分析 ${totalFiles} 个文件, ${totalBlocks} 个块`);
      }
    } catch (e) {}
  }
  
  console.log(`\r已分析 ${totalFiles} 个文件, ${totalBlocks} 个块\n`);
  
  // 统计
  let uniqueBlocks = 0;
  let uniqueSize = 0;
  let duplicateBlocks = 0;
  let duplicateSize = 0;
  
  const countDistribution = new Map<number, number>(); // count -> 出现次数
  
  for (const [, info] of blockHashes) {
    uniqueBlocks++;
    uniqueSize += info.size;
    
    if (info.count > 1) {
      duplicateBlocks += info.count - 1;
      duplicateSize += info.size * (info.count - 1);
    }
    
    const bucket = info.count >= 100 ? 100 : info.count >= 10 ? 10 : info.count;
    countDistribution.set(bucket, (countDistribution.get(bucket) || 0) + 1);
  }
  
  console.log('=== BC 块去重分析 ===\n');
  console.log(`总块数: ${totalBlocks.toLocaleString()}`);
  console.log(`总大小: ${(totalBlockSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`唯一块数: ${uniqueBlocks.toLocaleString()} (${(uniqueBlocks / totalBlocks * 100).toFixed(1)}%)`);
  console.log(`去重后大小: ${(uniqueSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`可节省: ${(duplicateSize / 1024 / 1024).toFixed(1)} MB (${(duplicateSize / totalBlockSize * 100).toFixed(1)}%)`);
  
  console.log('\n=== 块重复分布 ===\n');
  console.log(`出现 1 次: ${countDistribution.get(1) || 0} 种块`);
  console.log(`出现 2-9 次: ${[...countDistribution.entries()].filter(([k]) => k >= 2 && k < 10).reduce((sum, [, v]) => sum + v, 0)} 种块`);
  console.log(`出现 10-99 次: ${countDistribution.get(10) || 0} 种块`);
  console.log(`出现 100+ 次: ${countDistribution.get(100) || 0} 种块`);
  
  // 找出最常见的块
  const topBlocks = [...blockHashes.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);
  
  console.log('\n=== Top 10 最常见块 ===\n');
  for (const [hash, info] of topBlocks) {
    const savings = (info.size * (info.count - 1) / 1024).toFixed(1);
    console.log(`${hash}: ${info.count} 次, 节省 ${savings} KB`);
  }
  
  // 估算全量数据
  console.log('\n=== 全量估算 ===\n');
  const ratio = duplicateSize / totalBlockSize;
  console.log(`采样去重率: ${(ratio * 100).toFixed(1)}%`);
  console.log(`预估 28GB DDS 数据可节省: ${(28 * ratio).toFixed(1)} GB`);
}

main().catch(console.error);
