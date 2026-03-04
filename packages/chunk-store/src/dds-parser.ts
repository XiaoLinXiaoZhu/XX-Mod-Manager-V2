/**
 * DDS 文件解析器
 * 
 * ## DDS 文件格式
 * 
 * DDS (DirectDraw Surface) 是 DirectX 纹理格式，结构如下：
 * 
 * ```
 * [Magic: 4B "DDS "]
 * [Header: 124B]
 *   - size: 4B (固定 124)
 *   - flags: 4B
 *   - height: 4B
 *   - width: 4B
 *   - pitchOrLinearSize: 4B
 *   - depth: 4B
 *   - mipmapCount: 4B
 *   - reserved: 44B
 *   - pixelFormat: 32B
 *     - fourCC: 4B (如 "DX10", "DXT1", "DXT5")
 *   - caps: 16B
 *   - reserved2: 4B
 * [DX10 Header: 20B] (仅当 fourCC == "DX10")
 *   - dxgiFormat: 4B (如 98 = BC7_UNORM)
 *   - resourceDimension: 4B
 *   - miscFlag: 4B
 *   - arraySize: 4B
 *   - miscFlags2: 4B
 * [Pixel Data]
 *   - Mipmap 0 (最大)
 *   - Mipmap 1 (1/2 大小)
 *   - ...
 * ```
 * 
 * ## BC7 压缩格式
 * 
 * 3DMigoto mod 主要使用 BC7 压缩（DXGI_FORMAT_BC7_UNORM = 98）：
 * - 每 4x4 像素块压缩为 16 字节
 * - 压缩比约 4:1（相比 RGBA8）
 * - 质量高，适合复杂纹理
 * 
 * ## 为什么不按 BC 块（16B）去重？
 * 
 * 最初尝试按 16B BC 块去重，发现：
 * - 索引开销（hash + metadata）远超数据本身
 * - 一个 4096x4096 纹理有 100 万个块
 * - 实际是负收益！
 * 
 * 改用 4KB 块（256 个 BC 块）后：
 * - 索引开销合理
 * - 去重率仍有 69%
 * - IO 开销可接受
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
