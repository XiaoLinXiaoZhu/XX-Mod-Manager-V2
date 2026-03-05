//! 块处理模块

use rayon::prelude::*;
use xxhash_rust::xxh3::xxh3_128;
use zstd::bulk::{compress, decompress};

/// 块配置
pub struct ChunkConfig {
    /// 块大小（字节）
    pub chunk_size: usize,
    /// zstd 压缩级别 (1-22, 默认 3)
    pub compression_level: i32,
}

impl Default for ChunkConfig {
    fn default() -> Self {
        Self {
            chunk_size: 4096, // 4KB
            compression_level: 3, // 快速压缩
        }
    }
}

/// 计算块的 hash (xxh3-128)
#[inline]
pub fn hash_chunk(data: &[u8]) -> u128 {
    xxh3_128(data)
}

/// 将数据分割成块
pub fn chunk_data(data: &[u8], chunk_size: usize) -> Vec<&[u8]> {
    data.chunks(chunk_size).collect()
}

/// 预处理的块
#[derive(Debug)]
pub struct PreparedChunk {
    pub hash: u128,
    pub compressed: Vec<u8>,
    pub original_size: usize,
}

/// 并行处理块（hash + 压缩）
pub fn prepare_chunks_parallel(
    chunks: Vec<&[u8]>,
    compression_level: i32,
) -> Vec<PreparedChunk> {
    chunks
        .into_par_iter()
        .map(|chunk| {
            let hash = hash_chunk(chunk);
            let compressed = compress(chunk, compression_level)
                .expect("compression failed");
            PreparedChunk {
                hash,
                compressed,
                original_size: chunk.len(),
            }
        })
        .collect()
}

/// 解压块
pub fn decompress_chunk(compressed: &[u8], original_size: usize) -> Vec<u8> {
    decompress(compressed, original_size).expect("decompression failed")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chunk_data() {
        let data = vec![0u8; 10000];
        let chunks = chunk_data(&data, 4096);
        assert_eq!(chunks.len(), 3);
        assert_eq!(chunks[0].len(), 4096);
        assert_eq!(chunks[1].len(), 4096);
        assert_eq!(chunks[2].len(), 1808);
    }

    #[test]
    fn test_hash_chunk() {
        let data = b"hello world";
        let hash = hash_chunk(data);
        assert_ne!(hash, 0);
    }

    #[test]
    fn test_compress_decompress() {
        let data = vec![0u8; 4096];
        let compressed = compress(&data, 3).unwrap();
        let decompressed = decompress(&compressed, data.len()).unwrap();
        assert_eq!(data, decompressed);
    }
}
