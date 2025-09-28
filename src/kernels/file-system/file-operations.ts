/**
 * 基础文件操作实现
 * 包含文件的读写、删除、存在性检查等基础操作
 */

import { invoke } from '@tauri-apps/api/core';
import type { FileInfo, FileChangeEvent } from './types';
import { KernelError } from '../types';

/**
 * 基础文件操作类
 */
export class FileOperations {
  /**
   * 读取文件内容
   */
  async readFile(path: string, ifCreate?: boolean): Promise<string> {
    try {
      const result = await invoke<string>('read_file', { path_str: path, if_create: ifCreate || false });
      return result;
    } catch (error) {
      throw new KernelError(
        `Failed to read file: ${path}`,
        'FILE_READ_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 写入文件内容
   */
  async writeFile(path: string, content: string, ifCreate?: boolean): Promise<void> {
    try {
      await invoke('write_file', { path_str: path, content, if_create: ifCreate || false });
    } catch (error) {
      throw new KernelError(
        `Failed to write file: ${path}`,
        'FILE_WRITE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(path: string): Promise<void> {
    try {
      await invoke('delete_file', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to delete file: ${path}`,
        'FILE_DELETE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查文件或目录是否存在
   */
  async exists(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('is_file_exists', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to check file existence: ${path}`,
        'FILE_EXISTS_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查文件是否存在
   */
  async checkFileExists(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('is_file_exists', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to check file existence: ${path}`,
        'FILE_EXISTS_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(path: string): Promise<FileInfo> {
    try {
      const info = await invoke<{
        path: string;
        name: string;
        size: number;
        isDirectory: boolean;
        isFile: boolean;
        lastModified: string;
      }>('get_file_info', { path });

      return {
        ...info,
        lastModified: new Date(info.lastModified)
      };
    } catch (error) {
      throw new KernelError(
        `Failed to get file info: ${path}`,
        'FILE_INFO_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 复制文件
   */
  async copyFile(from: string, to: string): Promise<void> {
    try {
      await invoke('copy_file', { old_path_str: from, new_path_str: to });
    } catch (error) {
      throw new KernelError(
        `Failed to copy file from ${from} to ${to}`,
        'FILE_COPY_ERROR',
        { from, to, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 移动文件
   */
  async moveFile(from: string, to: string): Promise<void> {
    try {
      await invoke('move_file', { old_path_str: from, new_path_str: to });
    } catch (error) {
      throw new KernelError(
        `Failed to move file from ${from} to ${to}`,
        'FILE_MOVE_ERROR',
        { from, to, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 监听文件变化
   */
  watchFile(_path: string, _callback: (event: FileChangeEvent) => void): () => void {
    // TODO: 实现文件监听逻辑，使用 Tauri 的文件监听 API
    // 暂时返回一个空的取消函数
    return () => {};
  }
}
