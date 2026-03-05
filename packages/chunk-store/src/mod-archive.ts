/**
 * ModArchive - Mod 归档管理（并行优化版）
 * 
 * ## 性能优化
 * 
 * 瓶颈分析：
 * - 文件读取：IO 密集，可并行
 * - gzip 压缩：CPU 密集，可并行 (87% 耗时)
 * - 数据库写入：需要串行（SQLite 限制）
 * 
 * 优化策略：
 * - 批量读取文件
 * - Worker 并行压缩（4 workers, 2.14x 加速）
 * - 批量写入数据库
 */

import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, extname, relative, dirname, basename } from 'path';
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';
import { ChunkStore } from './chunk-store';
import { parseDdsHeader, rebuildDds } from './dds-parser';
import type { 
  ModManifest, 
  FileManifest, 
  ChunkConfig, 
  DdsMetadata,
  BufMetadata 
} from './types';

const DDS_CHUNK_SIZE = 4096; // 4KB 块
const WORKER_COUNT = 4; // 并行 Worker 数量
const PARALLEL_THRESHOLD = 100; // 超过此数量使用并行（约 400KB）

/** 计算块的 hash */
function hashChunk(data: Buffer): string {
  return createHash('md5').update(data).digest('hex').slice(0, 16);
}

/** Worker 代码 */
const workerCode = `
import { gzipSync } from 'zlib';
import { createHash } from 'crypto';

self.onmessage = (event) => {
  const chunks = event.data;
  const results = chunks.map(chunk => {
    const buf = Buffer.from(chunk);
    return {
      hash: createHash('md5').update(buf).digest('hex').slice(0, 16),
      compressed: gzipSync(buf, { level: 6 }),
      originalSize: buf.length,
    };
  });
  self.postMessage(results);
};
`;

/** 并行压缩块 */
async function compressChunksParallel(
  chunks: Buffer[]
): Promise<{ hash: string; compressed: Buffer; originalSize: number }[]> {
  // 小数据量直接串行
  if (chunks.length < PARALLEL_THRESHOLD) {
    return chunks.map(chunk => ({
      hash: hashChunk(chunk),
      compressed: gzipSync(chunk, { level: 6 }),
      originalSize: chunk.length,
    }));
  }
  
  const results: { hash: string; compressed: Buffer; originalSize: number }[] = new Array(chunks.length);
  const chunkSize = Math.ceil(chunks.length / WORKER_COUNT);
  const promises: Promise<void>[] = [];
  
  for (let i = 0; i < WORKER_COUNT; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, chunks.length);
    if (start >= chunks.length) break;
    
    const workerChunks = chunks.slice(start, end);
    
    const promise = new Promise<void>((resolve, reject) => {
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      worker.onmessage = (event) => {
        const workerResults = event.data;
        for (let j = 0; j < workerResults.length; j++) {
          results[start + j] = {
            hash: workerResults[j].hash,
            compressed: Buffer.from(workerResults[j].compressed),
            originalSize: workerResults[j].originalSize,
          };
        }
        worker.terminate();
        resolve();
      };
      
      worker.onerror = (error) => {
        worker.terminate();
        reject(error);
      };
      
      // 发送 ArrayBuffer
      worker.postMessage(workerChunks.map(c => c.buffer.slice(c.byteOffset, c.byteOffset + c.byteLength)));
    });
    
    promises.push(promise);
  }
  
  await Promise.all(promises);
  return results;
}

const defaultConfig: ChunkConfig = {
  ddsBlockSize: DDS_CHUNK_SIZE,
  bufChunkSize: 0,
  ibChunkSize: 0,
  compressExtensions: ['.dds', '.buf', '.ib'],
  preserveExtensions: ['.ini', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.txt', '.md', '.json'],
};

/** 预处理的块数据 */
interface PreparedChunk {
  hash: string;
  compressed: Buffer;
  originalSize: number;
}

export class ModArchive {
  private store: ChunkStore;
  private config: ChunkConfig;
  
  constructor(archivePath: string, config: Partial<ChunkConfig> = {}) {
    this.store = new ChunkStore(archivePath);
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * 归档 mod（异步版，支持并行压缩）
   */
  async archiveModAsync(modPath: string, modId?: string, modName?: string): Promise<ModManifest> {
    const id = modId || basename(modPath);
    const name = modName || basename(modPath);
    
    const files: FileManifest[] = [];
    const preservedFiles: string[] = [];
    let originalSize = 0;
    let storedSize = 0;
    
    // 第一步：收集所有文件
    const ddsFiles: { relativePath: string; data: Buffer; metadata: DdsMetadata }[] = [];
    const otherFiles: { relativePath: string; ext: string; data: Buffer }[] = [];
    
    for (const filePath of this.walkFilesSync(modPath)) {
      const relativePath = relative(modPath, filePath);
      const ext = extname(filePath).toLowerCase();
      const fileStat = statSync(filePath);
      originalSize += fileStat.size;
      
      if (ext === '.dds') {
        const data = readFileSync(filePath);
        const metadata = parseDdsHeader(data);
        if (!metadata) throw new Error(`Invalid DDS: ${relativePath}`);
        ddsFiles.push({ relativePath, data, metadata });
      } else if (ext === '.buf' || ext === '.ib') {
        otherFiles.push({ relativePath, ext, data: readFileSync(filePath) });
      } else if (this.config.preserveExtensions.includes(ext)) {
        preservedFiles.push(relativePath);
      }
    }
    
    // 第二步：收集所有 DDS 块
    const allChunks: Buffer[] = [];
    const ddsManifests: { relativePath: string; metadata: DdsMetadata; chunkStart: number; chunkCount: number }[] = [];
    
    for (const { relativePath, data, metadata } of ddsFiles) {
      const chunkStart = allChunks.length;
      
      for (let offset = metadata.headerSize; offset < data.length; offset += DDS_CHUNK_SIZE) {
        const end = Math.min(offset + DDS_CHUNK_SIZE, data.length);
        allChunks.push(Buffer.from(data.subarray(offset, end)));
      }
      
      ddsManifests.push({ 
        relativePath, 
        metadata, 
        chunkStart, 
        chunkCount: allChunks.length - chunkStart 
      });
    }
    
    // 第三步：并行压缩所有块
    const preparedChunks = await compressChunksParallel(allChunks);
    
    // 第四步：批量写入数据库
    const { storedSize: ddsStoredSize } = this.store.storeChunksBatch(preparedChunks);
    storedSize += ddsStoredSize;
    
    // 第五步：生成 DDS 文件清单
    for (const { relativePath, metadata, chunkStart, chunkCount } of ddsManifests) {
      const hashes: string[] = [];
      let fileOriginalSize = metadata.headerSize;
      
      for (let i = 0; i < chunkCount; i++) {
        hashes.push(preparedChunks[chunkStart + i].hash);
        fileOriginalSize += preparedChunks[chunkStart + i].originalSize;
      }
      
      files.push({
        path: relativePath,
        originalSize: fileOriginalSize,
        chunks: hashes,
        metadata,
      });
    }
    
    // 第六步：处理 buf/ib 文件
    for (const { relativePath, ext, data } of otherFiles) {
      const { id: compressedId, compressedSize } = this.store.storeCompressedFile(id, relativePath, data);
      storedSize += compressedSize;
      
      files.push({
        path: relativePath,
        originalSize: data.length,
        chunks: [compressedId],
        metadata: { type: ext.slice(1) as 'buf' | 'ib', chunkSize: 0 } as BufMetadata,
      });
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
    
    this.store.saveMod(id, name, JSON.stringify(manifest));
    
    const modDir = join(this.store.basePath, 'mods', id);
    this.copyPreservedFiles(modPath, modDir, preservedFiles);
    
    return manifest;
  }
  
  /**
   * 归档 mod（同步版，兼容旧代码）
   */
  archiveMod(modPath: string, modId?: string, modName?: string): ModManifest {
    const id = modId || basename(modPath);
    const name = modName || basename(modPath);
    
    const files: FileManifest[] = [];
    const preservedFiles: string[] = [];
    let originalSize = 0;
    let storedSize = 0;
    
    const ddsFiles: { relativePath: string; data: Buffer; metadata: DdsMetadata }[] = [];
    const otherFiles: { relativePath: string; ext: string; data: Buffer }[] = [];
    
    for (const filePath of this.walkFilesSync(modPath)) {
      const relativePath = relative(modPath, filePath);
      const ext = extname(filePath).toLowerCase();
      const fileStat = statSync(filePath);
      originalSize += fileStat.size;
      
      if (ext === '.dds') {
        const data = readFileSync(filePath);
        const metadata = parseDdsHeader(data);
        if (!metadata) throw new Error(`Invalid DDS: ${relativePath}`);
        ddsFiles.push({ relativePath, data, metadata });
      } else if (ext === '.buf' || ext === '.ib') {
        otherFiles.push({ relativePath, ext, data: readFileSync(filePath) });
      } else if (this.config.preserveExtensions.includes(ext)) {
        preservedFiles.push(relativePath);
      }
    }
    
    // 串行处理 DDS
    const preparedChunks: PreparedChunk[] = [];
    const ddsManifests: { relativePath: string; metadata: DdsMetadata; chunkStart: number; chunkCount: number }[] = [];
    
    for (const { relativePath, data, metadata } of ddsFiles) {
      const chunkStart = preparedChunks.length;
      
      for (let offset = metadata.headerSize; offset < data.length; offset += DDS_CHUNK_SIZE) {
        const end = Math.min(offset + DDS_CHUNK_SIZE, data.length);
        const chunk = data.subarray(offset, end);
        
        preparedChunks.push({
          hash: hashChunk(chunk),
          compressed: gzipSync(chunk, { level: 6 }),
          originalSize: chunk.length,
        });
      }
      
      ddsManifests.push({ 
        relativePath, 
        metadata, 
        chunkStart, 
        chunkCount: preparedChunks.length - chunkStart 
      });
    }
    
    const { storedSize: ddsStoredSize } = this.store.storeChunksBatch(preparedChunks);
    storedSize += ddsStoredSize;
    
    for (const { relativePath, metadata, chunkStart, chunkCount } of ddsManifests) {
      const hashes: string[] = [];
      let fileOriginalSize = metadata.headerSize;
      
      for (let i = 0; i < chunkCount; i++) {
        hashes.push(preparedChunks[chunkStart + i].hash);
        fileOriginalSize += preparedChunks[chunkStart + i].originalSize;
      }
      
      files.push({
        path: relativePath,
        originalSize: fileOriginalSize,
        chunks: hashes,
        metadata,
      });
    }
    
    for (const { relativePath, ext, data } of otherFiles) {
      const { id: compressedId, compressedSize } = this.store.storeCompressedFile(id, relativePath, data);
      storedSize += compressedSize;
      
      files.push({
        path: relativePath,
        originalSize: data.length,
        chunks: [compressedId],
        metadata: { type: ext.slice(1) as 'buf' | 'ib', chunkSize: 0 } as BufMetadata,
      });
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
    
    this.store.saveMod(id, name, JSON.stringify(manifest));
    
    const modDir = join(this.store.basePath, 'mods', id);
    this.copyPreservedFiles(modPath, modDir, preservedFiles);
    
    return manifest;
  }
  
  extractMod(modId: string, outputPath: string): void {
    const modData = this.store.getMod(modId);
    if (!modData) throw new Error(`Mod not found: ${modId}`);
    
    const manifest: ModManifest = JSON.parse(modData.manifest);
    
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath, { recursive: true });
    }
    
    for (const file of manifest.files) {
      const outputFilePath = join(outputPath, file.path);
      const dir = dirname(outputFilePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      
      if (file.metadata && 'type' in file.metadata) {
        if (file.metadata.type === 'dds') {
          const chunks = this.store.readChunks(file.chunks);
          const ddsData = rebuildDds(file.metadata as DdsMetadata, chunks);
          writeFileSync(outputFilePath, ddsData);
        } else {
          const compressedId = file.chunks[0];
          const data = this.store.readCompressedFile(compressedId);
          writeFileSync(outputFilePath, data);
        }
      }
    }
    
    const modDir = join(this.store.basePath, 'mods', modId);
    for (const relativePath of manifest.preservedFiles) {
      const srcPath = join(modDir, relativePath);
      const dstPath = join(outputPath, relativePath);
      const dstDir = dirname(dstPath);
      
      if (!existsSync(dstDir)) mkdirSync(dstDir, { recursive: true });
      if (existsSync(srcPath)) copyFileSync(srcPath, dstPath);
    }
  }
  
  removeMod(modId: string): boolean {
    const modData = this.store.getMod(modId);
    if (!modData) return false;
    
    const manifest: ModManifest = JSON.parse(modData.manifest);
    
    const ddsHashes: string[] = [];
    for (const file of manifest.files) {
      if (file.metadata && 'type' in file.metadata && file.metadata.type === 'dds') {
        ddsHashes.push(...file.chunks);
      }
    }
    if (ddsHashes.length > 0) {
      this.store.decrementChunkRefs(ddsHashes);
    }
    
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
