/**
 * 目录操作
 * 提供目录创建、删除、列出等操作
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';
import type { DirectoryOptions } from './types';

/**
 * 创建目录
 */
export async function createDirectory(path: string, options: DirectoryOptions = {}): Promise<void> {
  try {
    await invoke('create_directory', { path_str: path });
  } catch (error) {
    throw new KernelError(
      `Failed to create directory: ${path}`,
      'DIR_CREATE_ERROR',
      { path, options, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 删除目录
 */
export async function deleteDirectory(path: string): Promise<void> {
  try {
    await invoke('delete_directory', { path_str: path });
  } catch (error) {
    throw new KernelError(
      `Failed to delete directory: ${path}`,
      'DIR_DELETE_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 列出目录内容
 */
export async function listDirectory(path: string): Promise<string[]> {
  try {
    return await invoke<string[]>('get_directory_list', { path_str: path });
  } catch (error) {
    throw new KernelError(
      `Failed to list directory: ${path}`,
      'DIR_LIST_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 检查目录是否存在
 */
export async function checkDirectoryExists(path: string): Promise<boolean> {
  try {
    return await invoke<boolean>('dir_exists', { path });
  } catch (error) {
    throw new KernelError(
      `Failed to check directory existence: ${path}`,
      'DIR_EXISTS_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 重命名目录
 */
export async function renameDirectory(from: string, to: string): Promise<void> {
  try {
    await invoke('rename_directory', { old_path_str: from, new_path_str: to });
  } catch (error) {
    throw new KernelError(
      `Failed to rename directory from ${from} to ${to}`,
      'DIRECTORY_RENAME_ERROR',
      { from, to, error: error instanceof Error ? error.message : String(error) }
    );
  }
}