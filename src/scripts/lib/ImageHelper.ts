import { invoke } from "@tauri-apps/api/core";
import axios from "axios";

export type PathOrUrl = string;
export type ImageBase64 = string;

// 图片缓存
const imageCache: { [key: PathOrUrl]: ImageBase64 } = {};
export const EmptyImage: ImageBase64 = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
export async function getImage(filePath: PathOrUrl, reload: boolean = false): Promise<ImageBase64> {
    // 检查缓存中是否存在图片
    if (imageCache[filePath] && !reload) {
        return imageCache[filePath];
    }
    // 如果缓存中不存在或者需要重新加载，则调用 loadImage 函数
    return loadImage(filePath);
}
export async function releaseImage(filePath: PathOrUrl): Promise<void> {
    // 释放图片缓存
    if (imageCache[filePath]) {
        URL.revokeObjectURL(imageCache[filePath]);
        delete imageCache[filePath];
    }
}

export async function loadImage(filePath: PathOrUrl, ifCreate: boolean = false): Promise<ImageBase64> {
    if (filePath === undefined || filePath === null || filePath === '') {
        console.warn('loadImage: filePath is empty');
        return EmptyImage;
    }
    
    try {
        //debug
        // console.log('Step2: load image', filePath, "\n" ,new Error().stack);
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
        const url = URL.createObjectURL(blob) as ImageBase64;
        // cache the image
        imageCache[filePath] = url;
        // debug
        // console.log('Step3: load image success', filePath, url);
        return url;
    } catch (error) {
        console.error("Error loading image:", filePath, error);
        // return a empty image
        return EmptyImage;
    }
}

export async function writeImage(filePath: PathOrUrl, data: ImageBase64, ifCreate: boolean = false): Promise<void> {
    try {
        await invoke('write_image_file', { pathStr: filePath, data, ifCreate });
    } catch (error) {
        console.error('Error writing image file:', error);
        // don't throw error, just return
        // throw error;
        return;
    }
}

export async function writeImageFromUrl(filePath: PathOrUrl, url: PathOrUrl, ifCreate: boolean = false): Promise<void> {
    try {
        // 从 url 加载 图片 转为 uint8array
        // url 可能是 blob url 或者 http url
        // 先尝试 blob url
        if (url.startsWith('blob:')) {
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
        // 这里需要考虑跨域问题，可能需要设置请求头
        // 这里使用 fetch 下载图片
        else if (url.startsWith('http')) {

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
        // 直接读取文件
        const data = await getImage(url);
        await invoke('write_binary_file', { pathStr: filePath, data, ifCreate });
    } catch (error) {
        console.error('Error writing image file from url:', error);
        // don't throw error, just return
        // throw error;
        return;
    }
}

export async function writeImageFromBase64(filePath: PathOrUrl, base64: ImageBase64, ifCreate: boolean = false): Promise<void> {
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
        // don't throw error, just return
        // throw error;
        return;
    }
}
