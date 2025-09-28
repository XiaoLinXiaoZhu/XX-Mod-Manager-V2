/**
 * 下载操作
 * 提供文件下载相关功能
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 下载文件到路径
 */
export async function downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
  try {
    await invoke('download_file_to_path', { url, save_path_str: savePath, timeout_ms: timeoutMs });
  } catch (error) {
    throw new KernelError(
      `Failed to download file from ${url} to ${savePath}`,
      'DOWNLOAD_ERROR',
      { url, savePath, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 下载文件到二进制
 */
export async function downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
  try {
    const result = await invoke<number[]>('download_file_to_binary', { url, timeout_ms: timeoutMs });
    return new Uint8Array(result);
  } catch (error) {
    throw new KernelError(
      `Failed to download file from ${url}`,
      'DOWNLOAD_BINARY_ERROR',
      { url, error: error instanceof Error ? error.message : String(error) }
    );
  }
}