//! Mod 归档模块

use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;
use serde::{Serialize, Deserialize};

use crate::chunk::{chunk_data, prepare_chunks_parallel, ChunkConfig};
use crate::dds::{parse_dds_header, rebuild_dds, DdsMetadata};
use crate::store::{ChunkStore, StoreError, StoreStats};

/// 文件清单
#[derive(Debug, Serialize, Deserialize)]
pub struct FileManifest {
    pub path: String,
    pub original_size: u64,
    pub chunks: Vec<String>, // hash 的十六进制表示
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dds_metadata: Option<DdsMetadataSerde>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DdsMetadataSerde {
    pub header_size: usize,
    pub width: u32,
    pub height: u32,
    pub format: String,
}

impl From<&DdsMetadata> for DdsMetadataSerde {
    fn from(m: &DdsMetadata) -> Self {
        Self {
            header_size: m.header_size,
            width: m.width,
            height: m.height,
            format: m.format.clone(),
        }
    }
}

/// Mod 清单
#[derive(Debug, Serialize, Deserialize)]
pub struct ModManifest {
    pub id: String,
    pub name: String,
    pub source_path: String,
    pub files: Vec<FileManifest>,
    pub preserved_files: Vec<String>,
    pub original_size: u64,
    pub stored_size: u64,
    pub created_at: i64,
}

/// Mod 归档管理器
pub struct ModArchive {
    store: ChunkStore,
    config: ChunkConfig,
}

impl ModArchive {
    pub fn open<P: AsRef<Path>>(path: P) -> Result<Self, StoreError> {
        Ok(Self {
            store: ChunkStore::open(path)?,
            config: ChunkConfig::default(),
        })
    }
    
    /// 归档 mod
    pub fn archive_mod(
        &mut self,
        mod_path: &Path,
        mod_id: Option<&str>,
        mod_name: Option<&str>,
    ) -> Result<ModManifest, StoreError> {
        let id = mod_id
            .map(String::from)
            .unwrap_or_else(|| mod_path.file_name().unwrap().to_string_lossy().to_string());
        let name = mod_name
            .map(String::from)
            .unwrap_or_else(|| id.clone());
        
        let mut files = Vec::new();
        let mut preserved_files = Vec::new();
        let mut original_size = 0u64;
        let mut stored_size = 0u64;
        
        // 收集所有 DDS 文件
        struct DdsFile {
            relative_path: String,
            data: Vec<u8>,
            metadata: DdsMetadata,
        }
        let mut dds_files: Vec<DdsFile> = Vec::new();
        let mut other_files: Vec<(String, String, Vec<u8>)> = Vec::new();
        
        for entry in WalkDir::new(mod_path).into_iter().filter_map(|e| e.ok()) {
            if !entry.file_type().is_file() {
                continue;
            }
            
            let path = entry.path();
            let relative_path = path.strip_prefix(mod_path).unwrap().to_string_lossy().to_string();
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("").to_lowercase();
            
            let data = fs::read(path)?;
            original_size += data.len() as u64;
            
            match ext.as_str() {
                "dds" => {
                    if let Some(metadata) = parse_dds_header(&data) {
                        dds_files.push(DdsFile { relative_path, data, metadata });
                    }
                }
                "buf" | "ib" => {
                    other_files.push((relative_path, ext, data));
                }
                "ini" | "png" | "jpg" | "jpeg" | "webp" | "gif" | "txt" | "md" | "json" => {
                    preserved_files.push(relative_path);
                }
                _ => {}
            }
        }
        
        // 分块所有 DDS 文件
        let mut all_chunks: Vec<&[u8]> = Vec::new();
        let mut chunk_ranges: Vec<(usize, usize)> = Vec::new(); // (start, count)
        
        for dds in &dds_files {
            let start = all_chunks.len();
            let chunks = chunk_data(&dds.data[dds.metadata.header_size..], self.config.chunk_size);
            let count = chunks.len();
            all_chunks.extend(chunks);
            chunk_ranges.push((start, count));
        }
        
        // 并行压缩所有块
        let prepared = prepare_chunks_parallel(all_chunks, self.config.compression_level);
        
        // 批量写入数据库
        stored_size += self.store.store_chunks_batch(&prepared)?;
        
        // 生成 DDS 文件清单
        for (i, dds) in dds_files.iter().enumerate() {
            let (start, count) = chunk_ranges[i];
            let hashes: Vec<String> = prepared[start..start + count]
                .iter()
                .map(|c| format!("{:032x}", c.hash))
                .collect();
            
            files.push(FileManifest {
                path: dds.relative_path.clone(),
                original_size: dds.data.len() as u64,
                chunks: hashes,
                dds_metadata: Some(DdsMetadataSerde::from(&dds.metadata)),
                file_type: Some("dds".to_string()),
            });
        }
        
        // 处理 buf/ib 文件（压缩存储）
        for (relative_path, ext, data) in other_files {
            let compressed = zstd::bulk::compress(&data, self.config.compression_level)
                .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
            
            let file_id = format!("{}_{:016x}", id, crate::chunk::hash_chunk(&data) as u64);
            let compressed_path = PathBuf::from(self.store.base_path())
                .join("compressed")
                .join(format!("{}.zst", file_id));
            
            fs::create_dir_all(compressed_path.parent().unwrap())?;
            fs::write(&compressed_path, &compressed)?;
            
            stored_size += compressed.len() as u64;
            
            files.push(FileManifest {
                path: relative_path,
                original_size: data.len() as u64,
                chunks: vec![file_id],
                dds_metadata: None,
                file_type: Some(ext),
            });
        }
        
        // 复制保留的文件
        let mods_dir = PathBuf::from(self.store.base_path()).join("mods").join(&id);
        for relative_path in &preserved_files {
            let src = mod_path.join(relative_path);
            let dst = mods_dir.join(relative_path);
            if let Some(parent) = dst.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(&src, &dst)?;
        }
        
        let manifest = ModManifest {
            id: id.clone(),
            name,
            source_path: mod_path.to_string_lossy().to_string(),
            files,
            preserved_files,
            original_size,
            stored_size,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as i64,
        };
        
        // 保存清单
        let manifest_json = serde_json::to_string(&manifest)
            .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
        self.store.save_mod(&manifest.id, &manifest.name, &manifest_json)?;
        
        Ok(manifest)
    }
    
    /// 解压 mod
    pub fn extract_mod(&self, mod_id: &str, output_path: &Path) -> Result<(), StoreError> {
        let (_, manifest_json) = self.store.get_mod(mod_id)?
            .ok_or_else(|| StoreError::ChunkNotFound(mod_id.to_string()))?;
        
        let manifest: ModManifest = serde_json::from_str(&manifest_json)
            .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
        
        fs::create_dir_all(output_path)?;
        
        for file in &manifest.files {
            let file_path = output_path.join(&file.path);
            if let Some(parent) = file_path.parent() {
                fs::create_dir_all(parent)?;
            }
            
            match file.file_type.as_deref() {
                Some("dds") => {
                    // 读取原始文件头
                    let original_path = PathBuf::from(&manifest.source_path).join(&file.path);
                    let header = if original_path.exists() {
                        let data = fs::read(&original_path)?;
                        data[..file.dds_metadata.as_ref().unwrap().header_size].to_vec()
                    } else {
                        // 如果原始文件不存在，创建一个基本的 DDS 头
                        vec![0u8; file.dds_metadata.as_ref().unwrap().header_size]
                    };
                    
                    let hashes: Vec<u128> = file.chunks.iter()
                        .map(|h| u128::from_str_radix(h, 16).unwrap())
                        .collect();
                    
                    let chunks = self.store.read_chunks(&hashes)?;
                    
                    let metadata = DdsMetadata {
                        header_size: file.dds_metadata.as_ref().unwrap().header_size,
                        width: file.dds_metadata.as_ref().unwrap().width,
                        height: file.dds_metadata.as_ref().unwrap().height,
                        format: file.dds_metadata.as_ref().unwrap().format.clone(),
                    };
                    
                    let dds_data = rebuild_dds(&metadata, &header, &chunks);
                    fs::write(&file_path, dds_data)?;
                }
                Some("buf") | Some("ib") => {
                    let compressed_path = PathBuf::from(self.store.base_path())
                        .join("compressed")
                        .join(format!("{}.zst", &file.chunks[0]));
                    
                    let compressed = fs::read(&compressed_path)?;
                    let data = zstd::bulk::decompress(&compressed, file.original_size as usize)
                        .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
                    
                    fs::write(&file_path, data)?;
                }
                _ => {}
            }
        }
        
        // 复制保留的文件
        let mods_dir = PathBuf::from(self.store.base_path()).join("mods").join(mod_id);
        for relative_path in &manifest.preserved_files {
            let src = mods_dir.join(relative_path);
            let dst = output_path.join(relative_path);
            if let Some(parent) = dst.parent() {
                fs::create_dir_all(parent)?;
            }
            if src.exists() {
                fs::copy(&src, &dst)?;
            }
        }
        
        Ok(())
    }
    
    /// 删除 mod
    pub fn remove_mod(&mut self, mod_id: &str) -> Result<bool, StoreError> {
        if let Some((_, manifest_json)) = self.store.get_mod(mod_id)? {
            let manifest: ModManifest = serde_json::from_str(&manifest_json)
                .map_err(|e| StoreError::Io(std::io::Error::new(std::io::ErrorKind::Other, e)))?;
            
            // 减少 DDS 块引用
            let mut hashes = Vec::new();
            for file in &manifest.files {
                if file.file_type.as_deref() == Some("dds") {
                    for hash_str in &file.chunks {
                        if let Ok(hash) = u128::from_str_radix(hash_str, 16) {
                            hashes.push(hash);
                        }
                    }
                }
            }
            
            if !hashes.is_empty() {
                self.store.decrement_chunk_refs(&hashes)?;
            }
            
            // 删除压缩文件
            for file in &manifest.files {
                if matches!(file.file_type.as_deref(), Some("buf") | Some("ib")) {
                    let compressed_path = PathBuf::from(self.store.base_path())
                        .join("compressed")
                        .join(format!("{}.zst", &file.chunks[0]));
                    let _ = fs::remove_file(compressed_path);
                }
            }
            
            // 删除保留文件目录
            let mods_dir = PathBuf::from(self.store.base_path()).join("mods").join(mod_id);
            let _ = fs::remove_dir_all(mods_dir);
            
            self.store.delete_mod(mod_id)?;
            Ok(true)
        } else {
            Ok(false)
        }
    }
    
    pub fn gc(&mut self) -> Result<(usize, u64), StoreError> {
        self.store.gc()
    }
    
    pub fn get_stats(&self) -> Result<StoreStats, StoreError> {
        self.store.get_stats()
    }
    
    pub fn list_mods(&self) -> Result<Vec<(String, String, i64)>, StoreError> {
        self.store.list_mods()
    }
}
