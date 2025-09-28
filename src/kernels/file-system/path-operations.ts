/**
 * 路径操作实现
 * 包含路径相关的工具函数
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 路径操作类
 */
export class PathOperations {
  /**
   * 获取完整路径
   */
  async getFullPath(path: string): Promise<string> {
    try {
      return await invoke<string>('get_full_path', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to get full path: ${path}`,
        'FULL_PATH_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查是否有父目录
   */
  async hasParentDirectory(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('has_parent_directory', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to check parent directory: ${path}`,
        'PARENT_DIR_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 标准化路径
   */
  async normalizePath(path: string): Promise<string> {
    try {
      return await invoke<string>('normalize_path', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to normalize path: ${path}`,
        'NORMALIZE_PATH_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取文件名
   */
  async getBaseName(filePath: string): Promise<string> {
    try {
      return await invoke<string>('get_base_name', { path_str: filePath });
    } catch (error) {
      throw new KernelError(
        `Failed to get base name: ${filePath}`,
        'BASE_NAME_ERROR',
        { filePath, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取目录名
   */
  async getDirName(filePath: string): Promise<string> {
    try {
      return await invoke<string>('get_dir_name', { path_str: filePath });
    } catch (error) {
      throw new KernelError(
        `Failed to get dir name: ${filePath}`,
        'DIR_NAME_ERROR',
        { filePath, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取文件扩展名
   */
  async getExtension(filePath: string): Promise<string> {
    try {
      return await invoke<string>('get_extension', { path_str: filePath });
    } catch (error) {
      throw new KernelError(
        `Failed to get extension: ${filePath}`,
        'EXTENSION_ERROR',
        { filePath, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
