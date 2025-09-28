/**
 * 符号链接操作实现
 * 包含符号链接的创建、检查、删除等操作
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 符号链接操作类
 */
export class SymlinkOperations {
  /**
   * 创建符号链接
   */
  async createSymlink(from: string, to: string): Promise<void> {
    try {
      await invoke('create_symlink', { from, to });
    } catch (error) {
      throw new KernelError(
        `Failed to create symlink from ${from} to ${to}`,
        'SYMLINK_CREATE_ERROR',
        { from, to, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查符号链接是否存在
   */
  async checkSymlinkExists(path: string): Promise<boolean> {
    try {
      // TODO: 实现专门的符号链接存在性检查逻辑
      // 暂时使用基础的存在性检查
      return await invoke<boolean>('is_file_exists', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to check symlink existence: ${path}`,
        'SYMLINK_EXISTS_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 移除符号链接
   */
  async removeSymlink(path: string): Promise<void> {
    try {
      await invoke('delete_file', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to remove symlink: ${path}`,
        'SYMLINK_REMOVE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 检查符号链接是否支持
   */
  async isSymlinkSupported(path: string): Promise<boolean> {
    try {
      return await invoke<boolean>('is_symlink_supported', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to check symlink support: ${path}`,
        'SYMLINK_SUPPORT_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
