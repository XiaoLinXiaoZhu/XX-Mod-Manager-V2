/**
 * ModArchive v3 - 混合压缩策略
 * 
 * DDS: 4KB chunk 去重
 * buf/ib: gzip 压缩
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, extname, relative, dirname, basename } from 'path';
import { ChunkStore } from './chunk-store';
import { parseDdsHeader, iterateDdsBlocks, rebuildDds } from './dds-parser';
import type { 
  ModManifest, 
  FileManifest, 
  ChunkConfig, 
  DdsMetadata,
  BufMetadata 
} from './types';

const DDS_CHUNK_SIZE = 4096; // 4KB 块

const defaultConfig: ChunkConfig = {
  ddsBlockSize: DDS_CHUNK_SIZE,
  bufChunkSize: 0,  // 不再使用 chunk，改用压缩
  ibChunkSize: 0,
  compressExtensions: ['.dds', '.buf', '.ib'],
  preserveExtensions: ['.ini', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.txt', '.md', '.json'],
};

export class ModArchive {
  private store: ChunkStore;
  private config: ChunkConfig;
  
  constructor(archivePath: string, config: Partial<ChunkConfig> = {}) {
    this.store = new ChunkStore(archivePath);
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * 归档 mod
   */
  archiveMod(modPath: string, modId?: string, modName?: string): ModManifest {
    const id = modId || basename(modPath);
    const name = modName || basename(modPath);
    
    const files: FileManifest[] = [];
    const preservedFiles: string[] = [];
    let originalSize = 0;
    let storedSize = 0;
    
    for (const filePath of this.walkFilesSync(modPath)) {
      const relativePath = relative(modPath, filePath);
      const ext = extname(filePath).toLowerCase();
      const fileStat = statSync(filePath);
      originalSize += fileStat.size;
      
      if (ext === '.dds') {
        // DDS: chunk 去重
        const { manifest, stored } = this.archiveDds(filePath, relativePath);
        files.push(manifest);
        storedSize += stored;
      } else if (ext === '.buf' || ext === '.ib') {
        // buf/ib: 压缩存储
        const { manifest, stored } = this.archiveCompressed(id, filePath, relativePath, ext);
        files.push(manifest);
        storedSize += stored;
      } else if (this.config.preserveExtensions.includes(ext)) {
        preservedFiles.push(relativePath);
      }
    }
    
    const manifest: ModManifest = {
      id,
      name,
      sourcePath: modPath,
      files,
      preservedFiles,
      originalSize,
      storedSize,
      createdAt: Date.now(),
    };
    
    // 保存清单
    this.store.saveMod(id, name, JSON.stringify(manifest));
    
    // 复制保留的文件
    const modDir = join(this.store.basePath, 'mods', id);
    this.copyPreservedFiles(modPath, modDir, preservedFiles);
    
    return manifest;
  }
  
  /**
   * 归档 DDS 文件（chunk 去重）
   */
  private archiveDds(filePath: string, relativePath: string): { manifest: FileManifest; stored: number } {
    const data = readFileSync(filePath);
    const metadata = parseDdsHeader(data);
    
    if (!metadata) {
      throw new Error(`Invalid DDS: ${relativePath}`);
    }
    
    // 按 4KB 分块（不是按 BC 块）
    const chunks: Buffer[] = [];
    for (let offset = metadata.headerSize; offset < data.length; offset += DDS_CHUNK_SIZE) {
      const end = Math.min(offset + DDS_CHUNK_SIZE, data.length);
      chunks.push(Buffer.from(data.subarray(offset, end)));
    }
    
    const { hashes, storedSize } = this.store.storeChunks(chunks);
    
    return {
      manifest: {
        path: relativePath,
        originalSize: data.length,
        chunks: hashes,
        metadata,
      },
      stored: storedSize,
    };
  }
  
  /**
   * 归档 buf/ib 文件（压缩存储）
   */
  private archiveCompressed(
    modId: string, 
    filePath: string, 
    relativePath: string,
    ext: string
  ): { manifest: FileManifest; stored: number } {
    const data = readFileSync(filePath);
    const { id, compressedSize } = this.store.storeCompressedFile(modId, relativePath, data);
    
    return {
      manifest: {
        path: relativePath,
        originalSize: data.length,
        chunks: [id], // 用 chunks 字段存储压缩文件 ID
        metadata: { type: ext.slice(1) as 'buf' | 'ib', chunkSize: 0 } as BufMetadata,
      },
      stored: compressedSize,
    };
  }
  
  /**
   * 解压 mod
   */
  extractMod(modId: string, outputPath: string): void {
    const modData = this.store.getMod(modId);
    if (!modData) throw new Error(`Mod not found: ${modId}`);
    
    const manifest: ModManifest = JSON.parse(modData.manifest);
    
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }
    
    // 解压资源文件
    for (const file of manifest.files) {
      const outputFilePath = join(outputPath, file.path);
      const dir = dirname(outputFilePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      
      if (file.metadata && 'type' in file.metadata) {
        if (file.metadata.type === 'dds') {
          // DDS: 从 chunks 重建
          const chunks = this.store.readChunks(file.chunks);
          const ddsData = rebuildDds(file.metadata as DdsMetadata, chunks);
          writeFileSync(outputFilePath, ddsData);
        } else {
          // buf/ib: 解压
          const compressedId = file.chunks[0];
          const data = this.store.readCompressedFile(compressedId);
          writeFileSync(outputFilePath, data);
        }
      }
    }
    
    // 复制保留的文件
    const modDir = join(this.store.basePath, 'mods', modId);
    for (const relativePath of manifest.preservedFiles) {
      const srcPath = join(modDir, relativePath);
      const dstPath = join(outputPath, relativePath);
      const dstDir = dirname(dstPath);
      
      if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });
      if (existsSync(srcPath)) copyFileSync(srcPath, dstPath);
    }
  }
  
  /**
   * 删除 mod
   */
  removeMod(modId: string): boolean {
    const modData = this.store.getMod(modId);
    if (!modData) return false;
    
    const manifest: ModManifest = JSON.parse(modData.manifest);
    
    // 减少 DDS chunk 引用
    const ddsHashes: string[] = [];
    for (const file of manifest.files) {
      if (file.metadata && 'type' in file.metadata && file.metadata.type === 'dds') {
        ddsHashes.push(...file.chunks);
      }
    }
    if (ddsHashes.length > 0) {
      this.store.decrementChunkRefs(ddsHashes);
    }
    
    // 删除压缩文件
    this.store.deleteCompressedFiles(modId);
    
    return this.store.deleteMod(modId);
  }
  
  gc() { return this.store.gc(); }
  getStats() { return this.store.getStats(); }
  listMods() { return this.store.listMods(); }
  close() { this.store.close(); }
  
  private *walkFilesSync(dir: string): Generator<string> {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) yield* this.walkFilesSync(fullPath);
      else yield fullPath;
    }
  }
  
  private copyPreservedFiles(srcDir: string, dstDir: string, files: string[]) {
    for (const relativePath of files) {
      const srcPath = join(srcDir, relativePath);
      const dstPath = join(dstDir, relativePath);
      const dir = dirname(dstPath);
      
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      if (existsSync(srcPath)) copyFileSync(srcPath, dstPath);
    }
  }
}
