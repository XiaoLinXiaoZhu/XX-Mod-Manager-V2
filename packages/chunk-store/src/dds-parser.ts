/**
 * DDS 文件解析器
 * 支持 DXT1/DXT5/BC7 等格式
 */

import type { DdsMetadata } from './types';

/** DDS 解析结果 */
export interface DdsParseResult {
  metadata: DdsMetadata;
  /** 数据块迭代器 */
  blocks: Generator<Buffer>;
}

/**
 * 解析 DDS 文件头
 */
export function parseDdsHeader(buffer: Buffer): DdsMetadata | null {
  if (buffer.length < 128) return null;
  
  const magic = buffer.toString('ascii', 0, 4);
  if (magic !== 'DDS ') return null;
  
  const height = buffer.readUInt32LE(12);
  const width = buffer.readUInt32LE(16);
  const mipmapCount = buffer.readUInt32LE(28) || 1;
  
  // 像素格式
  const pfFlags = buffer.readUInt32LE(80);
  const fourCC = buffer.toString('ascii', 84, 88);
  
  let format = 'UNKNOWN';
  let headerSize = 128;
  
  if (pfFlags & 0x4) { // DDPF_FOURCC
    format = fourCC;
  }
  
  // DX10 扩展头
  if (fourCC === 'DX10') {
    headerSize = 148;
    if (buffer.length < 148) return null;
    const dxgiFormat = buffer.readUInt32LE(128);
    format = `DX10_${dxgiFormat}`;
  }
  
  return {
    type: 'dds',
    format,
    width,
    height,
    mipmapCount,
    headerSize,
    header: buffer.subarray(0, headerSize).toString('base64'),
  };
}

/**
 * 获取 BC 格式的块大小
 * BC1/BC4 = 8 bytes, BC2/BC3/BC5/BC6/BC7 = 16 bytes
 */
export function getBcBlockSize(format: string): number {
  // BC1 (DXT1) 和 BC4 是 8 字节
  if (format === 'DXT1' || format.includes('BC1') || format.includes('BC4')) {
    return 8;
  }
  // DXGI 格式编号
  // 71-72: BC1, 80-81: BC4 = 8 bytes
  // 74-75: BC2, 77-78: BC3, 83-84: BC5, 95-96: BC6H, 98-99: BC7 = 16 bytes
  const match = format.match(/DX10_(\d+)/);
  if (match) {
    const dxgiFormat = parseInt(match[1]);
    if (dxgiFormat === 71 || dxgiFormat === 72 || dxgiFormat === 80 || dxgiFormat === 81) {
      return 8;
    }
  }
  return 16; // 默认 16 字节
}

/**
 * 迭代 DDS 文件的所有 BC 块
 */
export function* iterateDdsBlocks(buffer: Buffer, metadata: DdsMetadata): Generator<Buffer> {
  const blockSize = getBcBlockSize(metadata.format);
  let offset = metadata.headerSize;
  let w = metadata.width;
  let h = metadata.height;
  
  // 遍历所有 mipmap 级别
  for (let level = 0; level < metadata.mipmapCount && offset < buffer.length; level++) {
    const blocksW = Math.max(1, Math.ceil(w / 4));
    const blocksH = Math.max(1, Math.ceil(h / 4));
    const levelBlockCount = blocksW * blocksH;
    
    for (let i = 0; i < levelBlockCount && offset + blockSize <= buffer.length; i++) {
      yield buffer.subarray(offset, offset + blockSize);
      offset += blockSize;
    }
    
    w = Math.max(1, w >> 1);
    h = Math.max(1, h >> 1);
  }
}

/**
 * 从块列表重建 DDS 文件
 */
export function rebuildDds(metadata: DdsMetadata, blocks: Buffer[]): Buffer {
  const header = Buffer.from(metadata.header, 'base64');
  const dataSize = blocks.reduce((sum, b) => sum + b.length, 0);
  const result = Buffer.allocUnsafe(header.length + dataSize);
  
  header.copy(result, 0);
  
  let offset = header.length;
  for (const block of blocks) {
    block.copy(result, offset);
    offset += block.length;
  }
  
  return result;
}

export const DdsParser = {
  parseHeader: parseDdsHeader,
  getBlockSize: getBcBlockSize,
  iterateBlocks: iterateDdsBlocks,
  rebuild: rebuildDds,
};
