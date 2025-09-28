/**
 * 基础文件操作
 * 提供文件读写、删除、复制、移动等基础操作
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 读取文件内容
 */
export async function readFile(path: string, ifCreate?: boolean): Promise<string> {
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
export async function writeFile(path: string, content: string, ifCreate?: boolean): Promise<void> {
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
export async function deleteFile(path: string): Promise<void> {
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
 * 检查文件是否存在
 */
export async function checkFileExists(path: string): Promise<boolean> {
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
 * 复制文件
 */
export async function copyFile(from: string, to: string): Promise<void> {
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
export async function moveFile(from: string, to: string): Promise<void> {
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
 * 读取二进制文件
 */
export async function readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array> {
  try {
    const result = await invoke<number[]>('read_binary_file', { path_str: path, if_create: ifCreate || false });
    return new Uint8Array(result);
  } catch (error) {
    throw new KernelError(
      `Failed to read binary file: ${path}`,
      'BINARY_FILE_READ_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 写入二进制文件
 */
export async function writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void> {
  try {
    await invoke('write_binary_file', { path_str: path, data: Array.from(data), if_create: ifCreate || false });
  } catch (error) {
    throw new KernelError(
      `Failed to write binary file: ${path}`,
      'BINARY_FILE_WRITE_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}