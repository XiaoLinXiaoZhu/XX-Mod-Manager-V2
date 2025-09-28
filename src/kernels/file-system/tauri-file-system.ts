/**
 * Tauri 文件系统实现
 * 基于 Tauri API 的文件系统操作实现
 */

import { invoke } from '@tauri-apps/api/core';
import { join, basename, dirname, normalize } from '@tauri-apps/api/path';
import { 
  ExtendedFileSystem, 
  FileInfo, 
  FileSystemResult, 
  FileChangeEvent,
  FileOptions,
  DirectoryOptions 
} from './types';
import { KernelError } from '../types';

/**
 * Tauri 文件系统实现类
 * 提供基于 Tauri API 的文件系统操作
 */
export class TauriFileSystem implements ExtendedFileSystem {
  /**
   * 读取文件内容
   */
  async readFile(path: string, options: FileOptions = {}): Promise<string> {
    try {
      const result = await invoke<string>('read_file', { path });
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
  async writeFile(path: string, content: string, options: FileOptions = {}): Promise<void> {
    try {
      await invoke('write_file', { path, content });
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
      await invoke('delete_file', { path });
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
      return await invoke<boolean>('file_exists', { path });
    } catch (error) {
      throw new KernelError(
        `Failed to check file existence: ${path}`,
        'FILE_EXISTS_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 创建目录
   */
  async createDirectory(path: string, options: DirectoryOptions = {}): Promise<void> {
    try {
      await invoke('create_dir', { path, recursive: options.recursive || false });
    } catch (error) {
      throw new KernelError(
        `Failed to create directory: ${path}`,
        'DIR_CREATE_ERROR',
        { path, options, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 列出目录内容
   */
  async listDirectory(path: string): Promise<string[]> {
    try {
      return await invoke<string[]>('read_dir', { path });
    } catch (error) {
      throw new KernelError(
        `Failed to list directory: ${path}`,
        'DIR_LIST_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取配置目录
   */
  async getConfigDir(): Promise<string> {
    try {
      return await invoke<string>('get_config_dir');
    } catch (error) {
      throw new KernelError(
        'Failed to get config directory',
        'CONFIG_DIR_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

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
   * 检查目录是否存在
   */
  async checkDirectoryExists(path: string): Promise<boolean> {
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
      await invoke('copy_file', { from, to });
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
      await invoke('move_file', { from, to });
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
  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void {
    // TODO: 实现文件监听功能
    // 这需要与 Tauri 的事件系统集成
    console.warn('File watching not implemented yet');
    return () => {};
  }

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
   * 检查是否支持符号链接
   */
  async isSymlinkSupported(path: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('is_symlink_supported', { path });
      return result;
    } catch (error) {
      console.warn(`Failed to check symlink support for ${path}:`, error);
      return false;
    }
  }

  /**
   * 检查符号链接是否存在
   */
  async checkSymlinkExists(path: string): Promise<boolean> {
    try {
      const result = await invoke<boolean>('check_symlink_exists', { path });
      return result;
    } catch (error) {
      console.warn(`Failed to check symlink existence for ${path}:`, error);
      return false;
    }
  }

  /**
   * 删除符号链接
   */
  async removeSymlink(path: string): Promise<void> {
    try {
      await invoke('remove_symlink', { path });
    } catch (error) {
      throw new KernelError(
        `Failed to remove symlink: ${path}`,
        'SYMLINK_REMOVE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 重命名目录
   */
  async renameDirectory(from: string, to: string): Promise<void> {
    try {
      await invoke('rename_directory', { from, to });
    } catch (error) {
      throw new KernelError(
        `Failed to rename directory from ${from} to ${to}`,
        'DIRECTORY_RENAME_ERROR',
        { from, to, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
