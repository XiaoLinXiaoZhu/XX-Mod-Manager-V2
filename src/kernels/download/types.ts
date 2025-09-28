/**
 * 下载类型定义
 */

export type DownloadOptions = {
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
