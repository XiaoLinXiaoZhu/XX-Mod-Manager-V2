/**
 * ChunkStore - 基于内容寻址的块存储
 * 
 * ## 解决的问题
 * 
 * 3DMigoto mod 文件（主要是 DDS 纹理）存在大量重复数据：
 * - 同一角色的不同皮肤 mod 共享大部分纹理数据
 * - 不同版本的 mod 只有少量差异
 * - 30GB 的 mod 库实际唯一数据可能只有 15GB
 * 
 * ## 设计决策
 * 
 * ### 为什么选择 4KB 块大小？
 * 
 * 经过对 30GB 真实 mod 数据的分析（见 scripts/analyze-io-tradeoff.ts）：
 * 
 * | 块大小 | 去重率 | 索引开销 | 净收益 | 平均块/文件 | IO 评估 |
 * |--------|--------|----------|--------|-------------|---------|
 * | 256B   | 78.8%  | 40.7MB   | 76.8%  | 25,774      | ❌ 差   |
 * | 1KB    | 74.9%  | 3.7MB    | 74.3%  | 6,444       | ⚠️ 中   |
 * | 4KB    | 69.3%  | 1.1MB    | 69.1%  | 1,611       | ⚠️ 中   |
 * | 16KB   | 62.4%  | 0.35MB   | 62.4%  | 403         | ✅ 好   |
 * 
 * 4KB 是去重收益和 IO 开销的最佳平衡点：
 * - 净收益 69%，比 16KB 高 7%
 * - 每文件约 1600 块，IO 开销可接受
 * - 与文件系统块大小对齐，读写效率高
 * 
 * ### 为什么用 SQLite BLOB 而不是文件系统？
 * 
 * 最初尝试每个块存一个文件，导致：
 * - 一个 4096x4096 DDS 产生 100 万个 16B 小文件
 * - NTFS 文件系统崩溃，删除都删不掉
 * - IO 延迟爆炸
 * 
 * SQLite BLOB 的优势：
 * - 批量写入：一个事务写入上千块
 * - 随机读取：通过 hash 索引快速定位
 * - 原子性：不会出现写一半的情况
 * - 易删除：删库就完事
 * 
 * ### 为什么 buf/ib 用压缩而不是 chunk 去重？
 * 
 * 分析结果（见 scripts/analyze-io-tradeoff.ts）：
 * - buf 去重净收益只有 30%，不如 gzip 压缩（50-60%）
 * - ib 去重净收益 40%，也不如压缩
 * - buf/ib 只占总数据量的 6%，优化收益有限
 * 
 * ## 存储结构
 * 
 * ```
 * archive/
 * ├── store.db          # SQLite 数据库
 * │   ├── chunks        # DDS 块数据 (hash -> BLOB)
 * │   ├── mods          # Mod 清单
 * │   └── compressed_files  # 压缩文件索引
 * ├── compressed/       # gzip 压缩的 buf/ib 文件
 * └── mods/             # 保留的配置文件 (ini/图片)
 * ```
 */

import { Database } from 'bun:sqlite';
import { createHash } from 'crypto';
import { mkdirSync, existsSync, readFileSync, writeFileSync, unlinkSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { gzipSync, gunzipSync } from 'zlib';
import type { StoreStats } from './types';

// 使用 zlib 的 gzip 作为压缩（bun 内置，无需额外依赖）
// 实际生产可换成 zstd

/** 计算块的 hash */
export function hashChunk(data: Buffer): string {
  return createHash('md5').update(data).digest('hex').slice(0, 16);
}

/** 压缩数据 */
export function compress(data: Buffer): Buffer {
  return gzipSync(data, { level: 9 });
}

/** 解压数据 */
export function decompress(data: Buffer): Buffer {
  return gunzipSync(data);
}

export class ChunkStore {
  private db: Database;
  public readonly basePath: string;
  private compressedDir: string;
  
  constructor(basePath: string) {
    this.basePath = basePath;
    this.compressedDir = join(basePath, 'compressed');
    
    // 确保目录存在
    if (!existsSync(basePath)) {
      mkdirSync(basePath, { recursive: true });
    }
    if (!existsSync(this.compressedDir)) {
      mkdirSync(this.compressedDir, { recursive: true });
    }
    
    // 初始化数据库
    this.db = new Database(join(basePath, 'store.db'));
    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA synchronous = NORMAL');
    this.initSchema();
  }
  
  private initSchema() {
    // DDS 块存储
    this.db.run(`
      CREATE TABLE IF NOT EXISTS chunks (
        hash TEXT PRIMARY KEY,
        data BLOB NOT NULL,
        ref_count INTEGER DEFAULT 1
      )
    `);
    
    // Mod 清单
    this.db.run(`
      CREATE TABLE IF NOT EXISTS mods (
        id TEXT PRIMARY KEY,
        name TEXT,
        manifest TEXT,
        created_at INTEGER
      )
    `);
    
    // 压缩文件索引
    this.db.run(`
      CREATE TABLE IF NOT EXISTS compressed_files (
        id TEXT PRIMARY KEY,
        mod_id TEXT,
        original_path TEXT,
        original_size INTEGER,
        compressed_size INTEGER,
        FOREIGN KEY (mod_id) REFERENCES mods(id)
      )
    `);
  }
  
  // ========== DDS Chunk 操作 ==========
  
  /**
   * 批量存储 DDS 块
   */
  storeChunks(chunks: Buffer[]): { hashes: string[]; newCount: number; existingCount: number; storedSize: number } {
    const hashes: string[] = [];
    let newCount = 0;
    let existingCount = 0;
    let storedSize = 0;
    
    const stmtGet = this.db.query<{ ref_count: number }, [string]>('SELECT ref_count FROM chunks WHERE hash = ?');
    const stmtInsert = this.db.query('INSERT INTO chunks (hash, data, ref_count) VALUES (?, ?, 1)');
    const stmtUpdate = this.db.query('UPDATE chunks SET ref_count = ref_count + 1 WHERE hash = ?');
    
    this.db.run('BEGIN TRANSACTION');
    
    try {
      for (const chunk of chunks) {
        const hash = hashChunk(chunk);
        hashes.push(hash);
        
        const existing = stmtGet.get(hash);
        
        if (existing) {
          stmtUpdate.run(hash);
          existingCount++;
        } else {
          stmtInsert.run(hash, chunk);
          newCount++;
          storedSize += chunk.length;
        }
      }
      
      this.db.run('COMMIT');
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
    
    return { hashes, newCount, existingCount, storedSize };
  }
  
  /**
   * 批量读取 DDS 块
   */
  readChunks(hashes: string[]): Buffer[] {
    const stmt = this.db.query<{ data: Buffer }, [string]>('SELECT data FROM chunks WHERE hash = ?');
    const chunks: Buffer[] = [];
    
    for (const hash of hashes) {
      const row = stmt.get(hash);
      if (!row) throw new Error(`Chunk not found: ${hash}`);
      chunks.push(Buffer.from(row.data));
    }
    
    return chunks;
  }
  
  /**
   * 减少块引用计数
   */
  decrementChunkRefs(hashes: string[]) {
    const stmt = this.db.query('UPDATE chunks SET ref_count = ref_count - 1 WHERE hash = ?');
    
    this.db.run('BEGIN TRANSACTION');
    try {
      for (const hash of hashes) {
        stmt.run(hash);
      }
      this.db.run('COMMIT');
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }
  
  // ========== 压缩文件操作 (buf/ib) ==========
  
  /**
   * 存储压缩文件
   */
  storeCompressedFile(modId: string, originalPath: string, data: Buffer): { id: string; compressedSize: number } {
    const id = `${modId}_${hashChunk(data).slice(0, 8)}`;
    const compressed = compress(data);
    const filePath = join(this.compressedDir, `${id}.gz`);
    
    writeFileSync(filePath, compressed);
    
    this.db.run(
      'INSERT OR REPLACE INTO compressed_files (id, mod_id, original_path, original_size, compressed_size) VALUES (?, ?, ?, ?, ?)',
      [id, modId, originalPath, data.length, compressed.length]
    );
    
    return { id, compressedSize: compressed.length };
  }
  
  /**
   * 读取压缩文件
   */
  readCompressedFile(id: string): Buffer {
    const filePath = join(this.compressedDir, `${id}.gz`);
    const compressed = readFileSync(filePath);
    return decompress(compressed);
  }
  
  /**
   * 删除 mod 的压缩文件
   */
  deleteCompressedFiles(modId: string) {
    const files = this.db.query<{ id: string }, [string]>(
      'SELECT id FROM compressed_files WHERE mod_id = ?'
    ).all(modId);
    
    for (const { id } of files) {
      const filePath = join(this.compressedDir, `${id}.gz`);
      try {
        unlinkSync(filePath);
      } catch {}
    }
    
    this.db.run('DELETE FROM compressed_files WHERE mod_id = ?', [modId]);
  }
  
  // ========== Mod 管理 ==========
  
  saveMod(id: string, name: string, manifest: string) {
    this.db.run(
      'INSERT OR REPLACE INTO mods (id, name, manifest, created_at) VALUES (?, ?, ?, ?)',
      [id, name, manifest, Date.now()]
    );
  }
  
  getMod(id: string): { name: string; manifest: string; createdAt: number } | null {
    const row = this.db.query<{ name: string; manifest: string; created_at: number }, [string]>(
      'SELECT name, manifest, created_at FROM mods WHERE id = ?'
    ).get(id);
    
    if (!row) return null;
    return { name: row.name, manifest: row.manifest, createdAt: row.created_at };
  }
  
  deleteMod(id: string): boolean {
    const result = this.db.run('DELETE FROM mods WHERE id = ?', [id]);
    return result.changes > 0;
  }
  
  listMods(): Array<{ id: string; name: string; createdAt: number }> {
    return this.db.query<{ id: string; name: string; created_at: number }, []>(
      'SELECT id, name, created_at FROM mods ORDER BY created_at DESC'
    ).all().map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    }));
  }
  
  // ========== 统计和维护 ==========
  
  gc(): { deletedChunks: number; freedSize: number } {
    const stats = this.db.query<{ count: number; size: number }, []>(
      'SELECT COUNT(*) as count, COALESCE(SUM(LENGTH(data)), 0) as size FROM chunks WHERE ref_count <= 0'
    ).get()!;
    
    this.db.run('DELETE FROM chunks WHERE ref_count <= 0');
    this.db.run('VACUUM');
    
    return { deletedChunks: stats.count, freedSize: stats.size };
  }
  
  getStats(): StoreStats {
    const chunkStats = this.db.query<{ 
      count: number; 
      total_size: number; 
      total_refs: number;
    }, []>(`
      SELECT 
        COUNT(*) as count, 
        COALESCE(SUM(LENGTH(data)), 0) as total_size,
        COALESCE(SUM(ref_count), 0) as total_refs
      FROM chunks
    `).get()!;
    
    const compressedStats = this.db.query<{
      count: number;
      original_size: number;
      compressed_size: number;
    }, []>(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(original_size), 0) as original_size,
        COALESCE(SUM(compressed_size), 0) as compressed_size
      FROM compressed_files
    `).get()!;
    
    const modCount = this.db.query<{ count: number }, []>(
      'SELECT COUNT(*) as count FROM mods'
    ).get()!.count;
    
    const avgChunkSize = chunkStats.count > 0 ? chunkStats.total_size / chunkStats.count : 4096;
    const totalOriginal = chunkStats.total_refs * avgChunkSize + compressedStats.original_size;
    const totalStored = chunkStats.total_size + compressedStats.compressed_size;
    
    return {
      totalChunks: chunkStats.total_refs,
      uniqueChunks: chunkStats.count,
      totalStoredSize: totalStored,
      totalOriginalSize: totalOriginal,
      deduplicationRatio: totalOriginal > 0 ? 1 - totalStored / totalOriginal : 0,
      modCount,
    };
  }
  
  close() {
    this.db.close();
  }
}
