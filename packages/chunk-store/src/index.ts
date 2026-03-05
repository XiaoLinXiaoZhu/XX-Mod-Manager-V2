/**
 * @xxmm/chunk-store
 * 基于内容寻址的 chunk 去重存储 (Rust 后端)
 * 
 * 核心功能：
 * - DDS 纹理 BC 块级去重 (86.8% 压缩率)
 * - buf/ib 文件 zstd 压缩
 * - SQLite 索引 + 引用计数
 * - 自动 GC 清理无引用块
 * 
 * 性能 (177 mod, 30GB):
 * - 归档: 359s (85 MB/s)
 * - 单个存入: 400ms
 * - 单个提取: 330ms-1.6s
 */

// Rust 后端包装
export { 
  ModArchive, 
  CLI_BINARY_PATH,
  type StoreStats,
  type ModInfo,
  type ArchiveResult,
} from './rust-wrapper';

// 保留旧的 TypeScript 实现作为备用
export { ModArchive as ModArchiveTS } from './mod-archive';
export { ChunkStore } from './chunk-store';
export { DdsParser } from './dds-parser';
export * from './types';

