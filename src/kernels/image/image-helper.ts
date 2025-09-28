/**
 * 图片处理工具函数
 * 提供图片加载、缓存和转换功能
 */

import { invoke } from "@tauri-apps/api/core";
import axios from "axios";
import { FilePath, HttpUrl, BlobUrl, Base64DataUrl, ImageUrl, PathOrUrl, UrlType, EmptyImage } from './types';

// 图片缓存：文件路径映射到 Blob URL
const imageCache: Map<PathOrUrl, BlobUrl> = new Map();

/**
 * 获取图片，返回可用于 <img> 标签的 URL
 * @param filePath 文件路径或 URL
 * @param reload 是否强制重新加载
 * @returns 返回 Blob URL 或 Base64 Data URL
 */
export async function getImage(filePath: PathOrUrl, reload: boolean = false): Promise<ImageUrl> {
    // 检查缓存中是否存在图片
    if (imageCache.has(filePath) && !reload) {
        return imageCache.get(filePath)!;
    }
    // 如果缓存中不存在或者需要重新加载，则调用 loadImage 函数
    return loadImage(filePath);
}

/**
 * 释放图片缓存并撤销 Blob URL
 * @param filePath 文件路径
 */
export async function releaseImage(filePath: PathOrUrl): Promise<void> {
    // 释放图片缓存
    const cachedUrl = imageCache.get(filePath);
    if (cachedUrl) {
        URL.revokeObjectURL(cachedUrl);
        imageCache.delete(filePath);
    }
}

/**
 * 从文件系统加载图片并创建 Blob URL
 * @param filePath 文件路径
 * @param ifCreate 如果文件不存在是否创建
 * @returns 返回 Blob URL 或 Base64 Data URL（出错时）
 */
export async function loadImage(filePath: PathOrUrl, ifCreate: boolean = false): Promise<ImageUrl> {
    if (filePath === undefined || filePath === null || filePath === '') {
        console.warn('loadImage: filePath is empty');
        return EmptyImage;
    }
    
    try {
        const binaryData = await invoke<number[]>('read_binary_file', { pathStr: filePath, ifCreate: ifCreate });
        // 检查数据是否为数组
        if (!Array.isArray(binaryData)) {
            throw new Error('Expected binary data to be an array of numbers');
        }

        // 将数组转换为 Uint8Array
        const uint8Array = new Uint8Array(binaryData);

        // 自动识别图片类型
        const fileType = filePath.split('.').pop()?.toLowerCase();
        // 使用对象简化 MIME 类型映射
        const mimeTypeMap: { [key: string]: string } = {
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            gif: 'image/gif',
            webp: 'image/webp',
            bmp: 'image/bmp',
            tiff: 'image/tiff',
            ico: 'image/x-icon',
            svg: 'image/svg+xml'
        };
        const mimeType = mimeTypeMap[fileType || ''] || 'application/octet-stream'; // 默认类型

        // 创建 Blob 对象
        const blob = new Blob([uint8Array], { type: mimeType });
        // 创建 URL 对象
        const url = URL.createObjectURL(blob) as BlobUrl;
        // cache the image
        imageCache.set(filePath, url);
        return url;
    } catch (error) {
        console.error("Error loading image:", filePath, error);
        // return a empty image
        return EmptyImage;
    }
}

/**
 * 判断 URL 的类型
 * @param url URL 字符串
 * @returns URL 类型
 */
function getUrlType(url: string): UrlType {
    if (url.startsWith('blob:')) {
        return "blob";
    } else if (url.startsWith('http')) {
        return "http";
    } else if (url.startsWith('data:image/')) {
        return "base64";
    }
    return "pathOrUnknown";
}

/**
 * 从 URL 写入图片文件
 * @param filePath 目标文件路径
 * @param url 源 URL（可以是 blob、http 或本地路径）
 * @param ifCreate 如果文件不存在是否创建
 */
export async function writeImageFromUrl(filePath: PathOrUrl, url: PathOrUrl, ifCreate: boolean = false): Promise<void> {
    if (!url || url === "") {
        console.error("Url can't be null");
        return;
    }

    const type = getUrlType(url);

    try {
        // 从 url 加载 图片 转为 uint8array
        // url 可能是 blob url 或者 http url
        // 先尝试 blob url
        if (type === "blob") {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            await invoke('write_binary_file', { pathStr: filePath, data: uint8Array, ifCreate });
            return;
        }
        // 如果不是 blob url，则认为是 http url
        // 直接下载
        if (type === "http") {
            // use axios to download image
            const response = await axios.get(url, {
                responseType: 'arraybuffer',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'image/*'
                }
            });

            const arrayBuffer = await response.data;
            const uint8Array = new Uint8Array(arrayBuffer);
            await invoke('write_binary_file', { pathStr: filePath, data: uint8Array, ifCreate });
            return;
        }
        // 如果不是 blob url 也不是 http url，则认为是本地文件
        // 直接 copy 文件
        await invoke('copy_file', { oldPathStr: url, newPathStr: filePath });
    } catch (error) {
        console.error(`Error writing image file from url[${type},${url}]:`, error);
        return;
    }
}

/**
 * 从 Base64 Data URL 写入图片文件
 * @param filePath 目标文件路径
 * @param base64 Base64 Data URL 字符串
 * @param ifCreate 如果文件不存在是否创建
 */
export async function writeImageFromBase64(filePath: PathOrUrl, base64: Base64DataUrl, ifCreate: boolean = false): Promise<void> {
    try {
        // Handle data URLs (e.g., "data:image/png;base64,...")
        let rawBase64 = base64;
        if (base64.includes(';base64,')) {
            rawBase64 = base64.split(';base64,').pop() || '';
        }
        
        const binaryString = atob(rawBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        await invoke('write_binary_file', { pathStr: filePath, data: bytes, ifCreate });
    } catch (error) {
        console.error('Error writing image file from base64:', error);
        return;
    }
}
