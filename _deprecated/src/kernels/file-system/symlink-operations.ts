/**
 * 符号链接操作
 * 提供符号链接的创建、检查、删除等操作
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 创建符号链接
 */
export async function createSymlink(from: string, to: string): Promise<void> {
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
export async function checkSymlinkExists(path: string): Promise<boolean> {
  try {
    // 这里需要实现检查符号链接的逻辑
    // 暂时使用文件存在检查
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
export async function removeSymlink(path: string): Promise<void> {
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
export async function isSymlinkSupported(path: string): Promise<boolean> {
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