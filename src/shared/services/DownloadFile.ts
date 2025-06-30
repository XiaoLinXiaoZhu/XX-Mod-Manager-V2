import { invoke } from "@tauri-apps/api/core";
import { dirname } from '@tauri-apps/api/path';

export type downloadOptions = {
    url: string; // 下载链接
    targetPath: string; // 下载保存路径
    onProgress: (progress: { event: string; data: any }) => void; // 进度回调函数
    onError?: (error: Error) => void; // 错误回调函数
    onSuccess?: (data: ArrayBuffer) => void; // 成功回调函数
    onComplete?: () => void; // 完成回调函数
    onCancel?: () => void; // 取消回调函数
    onRetry?: () => void; // 重试回调函数
    onAbort?: () => void; // 中止回调函数
    onTimeout?: () => void; // 超时回调函数
    timeout?: number; // 超时时间，单位毫秒
    retryCount?: number; // 重试次数
    retryDelay?: number; // 重试延迟，单位毫秒
}

// 通知下载进度的辅助函数
function notifyProgress(
    onProgress: downloadOptions['onProgress'], 
    event: 'Started' | 'Progress' | 'Finished',
    data: any
): void {
    onProgress({
        event,
        data
    });
}

// 从内存下载文件
async function downloadToMemory(
    url: string, 
    timeout: number,
    onProgress: downloadOptions['onProgress']
): Promise<ArrayBuffer> {
    console.log(`Trying to download to memory...`);
    const binaryData = await invoke<number[]>('download_file_to_binary', {
        url,
        timeoutMs: timeout
    });

    const data = new Uint8Array(binaryData);

    // 报告下载进度和完成
    notifyProgress(onProgress, 'Progress', {
        loaded: data.byteLength,
        total: data.byteLength,
        chunkLength: data.byteLength
    });

    notifyProgress(onProgress, 'Finished', { url });

    return data.buffer;
}

// 下载到文件，然后读取内容
async function downloadToFile(
    url: string, 
    filePath: string, 
    timeout: number,
    onProgress: downloadOptions['onProgress']
): Promise<ArrayBuffer> {
    console.log(`Starting download to ${filePath}...`);
    
    // 确保目录存在
    const dirPath = await dirname(filePath);
    await invoke('create_directory', {
        pathStr: dirPath
    }).catch(e => console.warn(`Unable to create directory (${dirPath}), 可能目录已存在:`, e));

    // 下载文件
    await invoke('download_file_to_path', {
        url,
        savePathStr: filePath,
        timeoutMs: timeout
    });

    console.log(`Successfully downloaded file to ${filePath}`);
    
    // 读取下载的文件内容
    const fileData = await invoke<number[]>('read_binary_file', {
        pathStr: filePath,
        ifCreate: false
    });

    // 转换为 Uint8Array
    const data = new Uint8Array(fileData);
    
    // 报告下载进度和完成
    notifyProgress(onProgress, 'Progress', {
        loaded: data.byteLength,
        total: data.byteLength,
        chunkLength: data.byteLength
    });

    notifyProgress(onProgress, 'Finished', { url });

    return data.buffer;
}

// 尝试多种方式下载文件
export async function downloadFile(options: downloadOptions): Promise<ArrayBuffer> {
    const {
        url,
        targetPath,
        onProgress,
        onError,
        onSuccess,
        onComplete,
        onCancel,
        onRetry,
        onAbort,
        onTimeout,
        timeout = 30000, // 默认超时时间为 30 秒
        retryCount = 3, // 默认重试次数为 3 次
        retryDelay = 1000 // 默认重试延迟为 1 秒
    } = options;    return new Promise<ArrayBuffer>(async (resolve, reject) => {
        let currentRetry = 0;
        let lastError: Error | null = null;
        let aborted = false;
        let timedOut = false;
        let cancelled = false;
        
        // 设置超时计时器
        let timeoutId: NodeJS.Timeout | undefined;
        if (timeout > 0) {
            timeoutId = setTimeout(() => {
                timedOut = true;
                if (onTimeout) onTimeout();
                reject(new Error(`Download timed out after ${timeout}ms`));
            }, timeout);
        }
        
        // 尝试下载函数
        const tryDownload = async (): Promise<void> => {
            if (aborted || timedOut || cancelled) return;
            
            try {
                // 通知开始下载
                notifyProgress(onProgress, 'Started', {
                    contentLength: 0,
                    url
                });
                
                // 优先通过文件方式下载
                try {
                    // 使用目标路径或生成临时文件路径
                    const filePath = targetPath || `./downloader/temp_${new Date().getTime()}.bin`;
                    const buffer = await downloadToFile(url, filePath, timeout, onProgress);
                    
                    // 如果下载成功，调用成功回调
                    if (aborted || timedOut || cancelled) return;
                    if (onSuccess) await onSuccess(buffer);

                    // 如果是临时文件，下载完成后删除
                    if (!targetPath) {
                        await invoke('delete_file', {
                            pathStr: filePath
                        }).catch(e => console.warn('Unable to delete temp file:', e));
                    }
                    
                    // 清除超时计时器
                    if (timeoutId) clearTimeout(timeoutId);
                    
                    if (onComplete) onComplete();
                    resolve(buffer);
                } catch (downloadError) {
                    if (aborted || timedOut || cancelled) return;
                    console.warn(`File download failed: ${downloadError}. Trying memory download...`);
                    
                    // 如果文件下载失败，尝试内存下载
                    const buffer = await downloadToMemory(url, timeout, onProgress);
                    
                    // 清除超时计时器
                    if (timeoutId) clearTimeout(timeoutId);

                    if (onSuccess) await onSuccess(buffer);
                    if (onComplete) onComplete();
                    resolve(buffer);
                }
            } catch (error) {
                // 清除超时计时器
                if (timeoutId) clearTimeout(timeoutId);
                
                if (aborted) {
                    if (onAbort) onAbort();
                    return;
                }
                
                if (cancelled) {
                    if (onCancel) onCancel();
                    return;
                }
                
                lastError = error instanceof Error ? error : new Error(String(error));
                console.error(`Download attempt ${currentRetry + 1} failed:`, lastError.message);
                
                // 判断是否需要重试
                if (currentRetry < retryCount) {
                    currentRetry++;
                    console.log(`Retrying download (${currentRetry}/${retryCount}) after ${retryDelay}ms...`);
                    if (onRetry) onRetry();
                    
                    // 延迟后重试
                    setTimeout(tryDownload, retryDelay);
                } else {
                    console.error(`All ${retryCount} download attempts failed`);
                    if (onError) onError(lastError);
                    reject(new Error(`Download failed after ${retryCount} attempts: ${lastError.message}`));
                }
            }
        };
        
        // 开始第一次尝试下载
        await tryDownload();
    });
}