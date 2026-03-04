/**
 * 深入分析 DDS 文件结构
 * 寻找更激进的压缩机会
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';

// DDS 文件头结构
interface DDSHeader {
  magic: string;
  size: number;
  flags: number;
  height: number;
  width: number;
  pitchOrLinearSize: number;
  depth: number;
  mipMapCount: number;
  format: string;
  dataOffset: number;
  dataSize: number;
}

function parseDDSHeader(buffer: Buffer): DDSHeader | null {
  if (buffer.length < 128) return null;
  
  const magic = buffer.toString('ascii', 0, 4);
  if (magic !== 'DDS ') return null;
  
  const size = buffer.readUInt32LE(4);
  const flags = buffer.readUInt32LE(8);
  const height = buffer.readUInt32LE(12);
  const width = buffer.readUInt32LE(16);
  const pitchOrLinearSize = buffer.readUInt32LE(20);
  const depth = buffer.readUInt32LE(24);
  const mipMapCount = buffer.readUInt32LE(28) || 1;
  
  // 像素格式在 offset 76
  const pfFlags = buffer.readUInt32LE(80);
  const fourCC = buffer.toString('ascii', 84, 88);
  
  let format = 'UNKNOWN';
  if (pfFlags & 0x4) { // DDPF_FOURCC
    format = fourCC;
  }
  
  // DX10 扩展头
  let dataOffset = 128;
  if (fourCC === 'DX10') {
    dataOffset = 148;
    const dxgiFormat = buffer.readUInt32LE(128);
    format = `DX10_${dxgiFormat}`;
  }
  
  return {
    magic,
    size,
    flags,
    height,
    width,
    pitchOrLinearSize,
    depth,
    mipMapCount,
    format,
    dataOffset,
    dataSize: buffer.length - dataOffset
  };
}

// 分析 DDS 数据块的熵（压缩潜力指标）
function analyzeEntropy(data: Buffer): { entropy: number; zeroRatio: number; uniqueBytes: number } {
  const freq = new Array(256).fill(0);
  let zeros = 0;
  
  for (let i = 0; i < data.length; i++) {
    freq[data[i]]++;
    if (data[i] === 0) zeros++;
  }
  
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / data.length;
      entropy -= p * Math.log2(p);
    }
  }
  
  const uniqueBytes = freq.filter(f => f > 0).length;
  
  return {
    entropy,  // 0-8, 越低越容易压缩
    zeroRatio: zeros / data.length,
    uniqueBytes
  };
}

// 分析 mipmap 级别
function analyzeMipmaps(buffer: Buffer, header: DDSHeader): { level: number; size: number; hash: string }[] {
  const mipmaps: { level: number; size: number; hash: string }[] = [];
  
  let offset = header.dataOffset;
  let w = header.width;
  let h = header.height;
  
  // BC 压缩格式每个 4x4 块占 8 或 16 字节
  const blockSize = header.format.includes('BC1') || header.format.includes('BC4') ? 8 : 16;
  
  for (let level = 0; level < header.mipMapCount && offset < buffer.length; level++) {
    const blocksW = Math.max(1, Math.ceil(w / 4));
    const blocksH = Math.max(1, Math.ceil(h / 4));
    const levelSize = blocksW * blocksH * blockSize;
    
    if (offset + levelSize > buffer.length) break;
    
    const levelData = buffer.subarray(offset, offset + levelSize);
    const hash = createHash('md5').update(levelData).digest('hex').slice(0, 8);
    
    mipmaps.push({ level, size: levelSize, hash });
    
    offset += levelSize;
    w = Math.max(1, w >> 1);
    h = Math.max(1, h >> 1);
  }
  
  return mipmaps;
}

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

async function main() {
  const modDir = process.argv[2] || 'D:\\GameResource\\ZZMI\\ModSource';
  
  console.log(`分析 DDS 文件结构: ${modDir}\n`);
  
  const formatStats = new Map<string, { count: number; totalSize: number; files: string[] }>();
  const resolutionStats = new Map<string, { count: number; totalSize: number }>();
  const mipmapHashes = new Map<string, { count: number; size: number; level: number }>();
  
  let totalFiles = 0;
  let totalSize = 0;
  let totalMipmapSize = 0;
  let level0Size = 0;
  
  const entropyStats: number[] = [];
  const zeroRatios: number[] = [];
  
  for await (const filePath of walkDDS(modDir)) {
    try {
      const buffer = await readFile(filePath);
      const header = parseDDSHeader(buffer);
      
      if (!header) continue;
      
      totalFiles++;
      totalSize += buffer.length;
      
      // 格式统计
      const fmt = formatStats.get(header.format) || { count: 0, totalSize: 0, files: [] };
      fmt.count++;
      fmt.totalSize += buffer.length;
      if (fmt.files.length < 3) fmt.files.push(basename(filePath));
      formatStats.set(header.format, fmt);
      
      // 分辨率统计
      const res = `${header.width}x${header.height}`;
      const resStat = resolutionStats.get(res) || { count: 0, totalSize: 0 };
      resStat.count++;
      resStat.totalSize += buffer.length;
      resolutionStats.set(res, resStat);
      
      // Mipmap 分析
      const mipmaps = analyzeMipmaps(buffer, header);
      for (const mip of mipmaps) {
        totalMipmapSize += mip.size;
        if (mip.level === 0) level0Size += mip.size;
        
        const existing = mipmapHashes.get(mip.hash);
        if (existing) {
          existing.count++;
        } else {
          mipmapHashes.set(mip.hash, { count: 1, size: mip.size, level: mip.level });
        }
      }
      
      // 熵分析（采样）
      if (totalFiles <= 200) {
        const dataSection = buffer.subarray(header.dataOffset);
        const { entropy, zeroRatio } = analyzeEntropy(dataSection);
        entropyStats.push(entropy);
        zeroRatios.push(zeroRatio);
      }
      
      if (totalFiles % 500 === 0) {
        process.stdout.write(`\r已分析 ${totalFiles} 个文件`);
      }
    } catch (e) {}
  }
  
  console.log(`\r已分析 ${totalFiles} 个文件\n`);
  
  // 输出结果
  console.log('=== DDS 格式分布 ===\n');
  const sortedFormats = [...formatStats.entries()].sort((a, b) => b[1].totalSize - a[1].totalSize);
  for (const [format, stats] of sortedFormats.slice(0, 10)) {
    console.log(`${format}: ${stats.count} 文件, ${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB (${(stats.totalSize / totalSize * 100).toFixed(1)}%)`);
  }
  
  console.log('\n=== 分辨率分布 ===\n');
  const sortedRes = [...resolutionStats.entries()].sort((a, b) => b[1].totalSize - a[1].totalSize);
  for (const [res, stats] of sortedRes.slice(0, 10)) {
    console.log(`${res}: ${stats.count} 文件, ${(stats.totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  }
  
  console.log('\n=== Mipmap 分析 ===\n');
  console.log(`总 mipmap 数据: ${(totalMipmapSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
  console.log(`Level 0 (最高分辨率): ${(level0Size / 1024 / 1024 / 1024).toFixed(2)} GB (${(level0Size / totalMipmapSize * 100).toFixed(1)}%)`);
  console.log(`其他 mipmap 级别: ${((totalMipmapSize - level0Size) / 1024 / 1024 / 1024).toFixed(2)} GB`);
  
  // Mipmap 去重潜力
  let uniqueMipmapSize = 0;
  let duplicateMipmapSize = 0;
  for (const [, info] of mipmapHashes) {
    uniqueMipmapSize += info.size;
    if (info.count > 1) {
      duplicateMipmapSize += info.size * (info.count - 1);
    }
  }
  console.log(`\nMipmap 级别去重:`);
  console.log(`  唯一 mipmap: ${mipmapHashes.size} 个, ${(uniqueMipmapSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`  重复 mipmap 可节省: ${(duplicateMipmapSize / 1024 / 1024).toFixed(1)} MB`);
  
  console.log('\n=== 熵分析（压缩潜力）===\n');
  if (entropyStats.length > 0) {
    const avgEntropy = entropyStats.reduce((a, b) => a + b, 0) / entropyStats.length;
    const avgZeroRatio = zeroRatios.reduce((a, b) => a + b, 0) / zeroRatios.length;
    console.log(`平均熵: ${avgEntropy.toFixed(2)} bits/byte (理论最大 8)`);
    console.log(`平均零字节比例: ${(avgZeroRatio * 100).toFixed(1)}%`);
    console.log(`熵分析: ${avgEntropy < 6 ? '有一定压缩空间' : '已高度压缩，传统压缩效果有限'}`);
  }
  
  console.log('\n=== 压缩策略建议 ===\n');
  console.log('1. Mipmap 去重: 小 mipmap 级别经常重复，可单独存储');
  console.log('2. 按分辨率分组: 相同分辨率的纹理结构相似，适合 delta');
  console.log('3. 格式感知压缩: BC 格式按 4x4 块组织，可按块去重');
}

main().catch(console.error);
