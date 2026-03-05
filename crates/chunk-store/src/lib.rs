//! # Chunk Store
//!
//! 高性能的基于内容寻址的块存储系统，用于 mod 文件去重。
//!
//! ## 设计决策
//!
//! ### 为什么选择 4KB 块大小？
//!
//! 经过对 30GB 真实 mod 数据的分析：
//! - 4KB 块：69% 去重率，每文件约 1600 块
//! - 与文件系统块大小对齐，IO 效率高
//!
//! ### 为什么用 zstd 而不是 gzip？
//!
//! - zstd 压缩速度比 gzip 快 3-5x
//! - 压缩率相当或更好
//! - 支持字典压缩，对小块更友好
//!
//! ### 为什么用 xxh3 而不是 md5？
//!
//! - xxh3 比 md5 快 10x
//! - 128 位输出，碰撞概率足够低
//! - 专为数据去重设计

mod chunk;
mod store;
mod archive;
mod dds;

pub use chunk::{ChunkConfig, chunk_data, hash_chunk};
pub use store::{ChunkStore, StoreStats};
pub use archive::{ModArchive, ModManifest};
