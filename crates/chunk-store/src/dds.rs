//! DDS 文件解析

/// DDS 文件头信息
#[derive(Debug, Clone)]
pub struct DdsMetadata {
    pub header_size: usize,
    pub width: u32,
    pub height: u32,
    pub format: String,
}

/// 解析 DDS 文件头
pub fn parse_dds_header(data: &[u8]) -> Option<DdsMetadata> {
    if data.len() < 128 {
        return None;
    }
    
    // 检查 DDS 魔数
    if &data[0..4] != b"DDS " {
        return None;
    }
    
    let height = u32::from_le_bytes([data[12], data[13], data[14], data[15]]);
    let width = u32::from_le_bytes([data[16], data[17], data[18], data[19]]);
    
    // 检查是否有 DX10 扩展头
    let has_dx10 = data.len() >= 148 && &data[84..88] == b"DX10";
    let header_size = if has_dx10 { 148 } else { 128 };
    
    // 获取格式
    let format = if has_dx10 {
        let dxgi_format = u32::from_le_bytes([data[128], data[129], data[130], data[131]]);
        format!("DXGI_{}", dxgi_format)
    } else {
        let fourcc = &data[84..88];
        String::from_utf8_lossy(fourcc).to_string()
    };
    
    Some(DdsMetadata {
        header_size,
        width,
        height,
        format,
    })
}

/// 重建 DDS 文件
pub fn rebuild_dds(metadata: &DdsMetadata, header: &[u8], chunks: &[Vec<u8>]) -> Vec<u8> {
    let total_size: usize = metadata.header_size + chunks.iter().map(|c| c.len()).sum::<usize>();
    let mut result = Vec::with_capacity(total_size);
    
    result.extend_from_slice(&header[..metadata.header_size]);
    for chunk in chunks {
        result.extend_from_slice(chunk);
    }
    
    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_dds_header() {
        // 创建一个最小的 DDS 头
        let mut data = vec![0u8; 128];
        data[0..4].copy_from_slice(b"DDS ");
        data[12..16].copy_from_slice(&100u32.to_le_bytes()); // height
        data[16..20].copy_from_slice(&200u32.to_le_bytes()); // width
        
        let meta = parse_dds_header(&data).unwrap();
        assert_eq!(meta.header_size, 128);
        assert_eq!(meta.width, 200);
        assert_eq!(meta.height, 100);
    }
}
