//! SQLite 存储模块

use rusqlite::{Connection, params};
use std::path::Path;
use thiserror::Error;

use crate::chunk::PreparedChunk;

#[derive(Error, Debug)]
pub enum StoreError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Chunk not found: {0}")]
    ChunkNotFound(String),
}

/// 存储统计
#[derive(Debug, Default)]
pub struct StoreStats {
    pub mod_count: usize,
    pub unique_chunks: usize,
    pub total_stored_size: u64,
    pub total_original_size: u64,
}

impl StoreStats {
    pub fn deduplication_ratio(&self) -> f64 {
        if self.total_original_size == 0 {
            0.0
        } else {
            1.0 - (self.total_stored_size as f64 / self.total_original_size as f64)
        }
    }
}

/// 块存储
pub struct ChunkStore {
    conn: Connection,
    base_path: String,
}

impl ChunkStore {
    /// 创建或打开存储
    pub fn open<P: AsRef<Path>>(base_path: P) -> Result<Self, StoreError> {
        let base_path = base_path.as_ref();
        std::fs::create_dir_all(base_path)?;
        
        let db_path = base_path.join("store.db");
        let conn = Connection::open(&db_path)?;
        
        // 性能优化
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA cache_size = -64000;
             PRAGMA busy_timeout = 30000;"
        )?;
        
        let store = Self {
            conn,
            base_path: base_path.to_string_lossy().to_string(),
        };
        store.init_schema()?;
        
        Ok(store)
    }
    
    fn init_schema(&self) -> Result<(), StoreError> {
        self.conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS chunks (
                hash BLOB PRIMARY KEY,
                data BLOB NOT NULL,
                original_size INTEGER NOT NULL,
                ref_count INTEGER DEFAULT 1
            );
            
            CREATE TABLE IF NOT EXISTS mods (
                id TEXT PRIMARY KEY,
                name TEXT,
                manifest TEXT,
                created_at INTEGER
            );
            
            CREATE TABLE IF NOT EXISTS compressed_files (
                id TEXT PRIMARY KEY,
                mod_id TEXT,
                original_path TEXT,
                original_size INTEGER,
                compressed_size INTEGER
            );"
        )?;
        Ok(())
    }
    
    /// 批量存储块（去重）
    pub fn store_chunks_batch(&mut self, chunks: &[PreparedChunk]) -> Result<u64, StoreError> {
        let mut stored_size = 0u64;
        
        let tx = self.conn.transaction()?;
        
        {
            let mut stmt_get = tx.prepare_cached(
                "SELECT ref_count FROM chunks WHERE hash = ?"
            )?;
            let mut stmt_insert = tx.prepare_cached(
                "INSERT INTO chunks (hash, data, original_size, ref_count) VALUES (?, ?, ?, 1)"
            )?;
            let mut stmt_update = tx.prepare_cached(
                "UPDATE chunks SET ref_count = ref_count + 1 WHERE hash = ?"
            )?;
            
            for chunk in chunks {
                let hash_bytes = chunk.hash.to_le_bytes();
                
                let exists: Result<i32, _> = stmt_get.query_row([&hash_bytes[..]], |row| row.get(0));
                
                if exists.is_ok() {
                    stmt_update.execute([&hash_bytes[..]])?;
                } else {
                    stmt_insert.execute(params![
                        &hash_bytes[..],
                        &chunk.compressed,
                        chunk.original_size as i64
                    ])?;
                    stored_size += chunk.compressed.len() as u64;
                }
            }
        }
        
        tx.commit()?;
        Ok(stored_size)
    }
    
    /// 读取块
    pub fn read_chunks(&self, hashes: &[u128]) -> Result<Vec<Vec<u8>>, StoreError> {
        let mut stmt = self.conn.prepare_cached(
            "SELECT data, original_size FROM chunks WHERE hash = ?"
        )?;
        
        let mut results = Vec::with_capacity(hashes.len());
        
        for hash in hashes {
            let hash_bytes = hash.to_le_bytes();
            let (compressed, original_size): (Vec<u8>, i64) = stmt
                .query_row([&hash_bytes[..]], |row| Ok((row.get(0)?, row.get(1)?)))
                .map_err(|_| StoreError::ChunkNotFound(format!("{:032x}", hash)))?;
            
            let decompressed = zstd::bulk::decompress(&compressed, original_size as usize)
                .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
            
            results.push(decompressed);
        }
        
        Ok(results)
    }
    
    /// 减少块引用计数
    pub fn decrement_chunk_refs(&mut self, hashes: &[u128]) -> Result<(), StoreError> {
        let tx = self.conn.transaction()?;
        
        {
            let mut stmt = tx.prepare_cached(
                "UPDATE chunks SET ref_count = ref_count - 1 WHERE hash = ?"
            )?;
            
            for hash in hashes {
                let hash_bytes = hash.to_le_bytes();
                stmt.execute([&hash_bytes[..]])?;
            }
        }
        
        tx.commit()?;
        Ok(())
    }
    
    /// 垃圾回收
    pub fn gc(&mut self) -> Result<(usize, u64), StoreError> {
        let stats: (i64, i64) = self.conn.query_row(
            "SELECT COUNT(*), COALESCE(SUM(LENGTH(data)), 0) FROM chunks WHERE ref_count <= 0",
            [],
            |row| Ok((row.get(0)?, row.get(1)?))
        )?;
        
        self.conn.execute("DELETE FROM chunks WHERE ref_count <= 0", [])?;
        self.conn.execute("VACUUM", [])?;
        
        Ok((stats.0 as usize, stats.1 as u64))
    }
    
    /// 保存 mod 清单
    pub fn save_mod(&self, id: &str, name: &str, manifest: &str) -> Result<(), StoreError> {
        self.conn.execute(
            "INSERT OR REPLACE INTO mods (id, name, manifest, created_at) VALUES (?, ?, ?, ?)",
            params![id, name, manifest, chrono_timestamp()]
        )?;
        Ok(())
    }
    
    /// 获取 mod 清单
    pub fn get_mod(&self, id: &str) -> Result<Option<(String, String)>, StoreError> {
        let result = self.conn.query_row(
            "SELECT name, manifest FROM mods WHERE id = ?",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?))
        );
        
        match result {
            Ok(data) => Ok(Some(data)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    }
    
    /// 删除 mod
    pub fn delete_mod(&self, id: &str) -> Result<bool, StoreError> {
        let changes = self.conn.execute("DELETE FROM mods WHERE id = ?", [id])?;
        Ok(changes > 0)
    }
    
    /// 列出所有 mod
    pub fn list_mods(&self) -> Result<Vec<(String, String, i64)>, StoreError> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, created_at FROM mods ORDER BY created_at DESC"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        })?;
        
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }
    
    /// 获取统计信息
    pub fn get_stats(&self) -> Result<StoreStats, StoreError> {
        let (unique_chunks, total_stored, total_refs): (i64, i64, i64) = self.conn.query_row(
            "SELECT COUNT(*), COALESCE(SUM(LENGTH(data)), 0), COALESCE(SUM(ref_count), 0) FROM chunks",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?))
        )?;
        
        let avg_original: f64 = self.conn.query_row(
            "SELECT COALESCE(AVG(original_size), 4096.0) FROM chunks",
            [],
            |row| row.get(0)
        )?;
        
        let mod_count: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM mods",
            [],
            |row| row.get(0)
        )?;
        
        Ok(StoreStats {
            mod_count: mod_count as usize,
            unique_chunks: unique_chunks as usize,
            total_stored_size: total_stored as u64,
            total_original_size: (total_refs as f64 * avg_original) as u64,
        })
    }
    
    pub fn base_path(&self) -> &str {
        &self.base_path
    }
}

fn chrono_timestamp() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis() as i64
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_store_and_read() {
        let dir = tempdir().unwrap();
        let mut store = ChunkStore::open(dir.path()).unwrap();
        
        let chunks = vec![
            PreparedChunk {
                hash: 12345,
                compressed: zstd::bulk::compress(b"hello", 3).unwrap(),
                original_size: 5,
            },
        ];
        
        store.store_chunks_batch(&chunks).unwrap();
        
        let read = store.read_chunks(&[12345]).unwrap();
        assert_eq!(read[0], b"hello");
    }
}
