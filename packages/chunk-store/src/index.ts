/**
 * @xxmm/chunk-store
 * 基于内容寻址的 chunk 去重存储
 * 
 * 核心功能：
 * - DDS 纹理 BC 块级去重 (88% 压缩率)
 * - buf/ib 文件块级去重 (32-50% 压缩率)
 * - SQLite 索引 + 引用计数
 * - 自动 GC 清理无引用块
 */

// 类型定义
export * from './types';

// 核心类
export { ChunkStore } from './chunk-store';
export { ModArchive } from './mod-archive';
export { DdsParser } from './dds-parser';
