/**
 * 二进制文件操作实现
 * 包含二进制文件的读写操作
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 二进制文件操作类
 */
export class BinaryOperations {
  /**
   * 读取二进制文件
   */
  async readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array> {
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
  async writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void> {
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
}
