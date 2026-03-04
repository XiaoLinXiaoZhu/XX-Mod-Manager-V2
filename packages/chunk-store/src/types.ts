/**
 * 类型定义
 */

/** 块信息 */
export interface ChunkInfo {
  hash: string;      // MD5 前 12 字符
  size: number;      // 块大小
  refCount: number;  // 引用计数
}

/** 文件清单 */
export interface FileManifest {
  /** 原始相对路径 */
  path: string;
  /** 原始文件大小 */
  originalSize: number;
  /** 块 hash 列表 */
  chunks: string[];
  /** 文件类型特定元数据 */
  metadata?: DdsMetadata | BufMetadata;
}

/** DDS 文件元数据 */
export interface DdsMetadata {
  type: 'dds';
  format: string;      // DX10_98, DXT1 等
  width: number;
  height: number;
  mipmapCount: number;
  headerSize: number;  // 头部大小 (128 或 148)
  header: string;      // Base64 编码的原始头
}

/** buf/ib 文件元数据 */
export interface BufMetadata {
  type: 'buf' | 'ib';
  chunkSize: number;   // 使用的块大小
}

/** Mod 清单 */
export interface ModManifest {
  /** Mod ID */
  id: string;
  /** Mod 名称 */
  name: string;
  /** 原始目录路径 */
  sourcePath: string;
  /** 压缩的资源文件 */
  files: FileManifest[];
  /** 保留的小文件（ini, preview 等）相对路径 */
  preservedFiles: string[];
  /** 原始总大小 */
  originalSize: number;
  /** 去重后存储大小 */
  storedSize: number;
  /** 创建时间 */
  createdAt: number;
}

/** 存储统计 */
export interface StoreStats {
  /** 总块数 */
  totalChunks: number;
  /** 唯一块数 */
  uniqueChunks: number;
  /** 总存储大小 */
  totalStoredSize: number;
  /** 原始数据大小 */
  totalOriginalSize: number;
  /** 去重率 */
  deduplicationRatio: number;
  /** Mod 数量 */
  modCount: number;
}

/** 分块配置 */
export interface ChunkConfig {
  /** DDS BC 块大小 (默认 16) */
  ddsBlockSize: number;
  /** buf 文件块大小 (默认 512) */
  bufChunkSize: number;
  /** ib 文件块大小 (默认 192) */
  ibChunkSize: number;
  /** 需要压缩的文件扩展名 */
  compressExtensions: string[];
  /** 保留原样的文件扩展名 */
  preserveExtensions: string[];
}

/** 默认配置 */
export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  ddsBlockSize: 16,
  bufChunkSize: 512,
  ibChunkSize: 192,
  compressExtensions: ['.dds', '.buf', '.ib'],
  preserveExtensions: ['.ini', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.txt', '.md', '.json'],
};
