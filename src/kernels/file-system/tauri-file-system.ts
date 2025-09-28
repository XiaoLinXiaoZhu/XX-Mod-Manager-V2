/**
 * Tauri 文件系统实现
 * 基于 Tauri API 的文件系统操作实现
 */

import { invoke } from '@tauri-apps/api/core';
import type { 
  ExtendedFileSystem, 
  FileInfo, 
  FileChangeEvent,
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
   * 创建目录
   */
  async createDirectory(path: string, options: DirectoryOptions = {}): Promise<void> {
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
   * 列出目录内容
   */
  async listDirectory(path: string): Promise<string[]> {
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
   * 获取配置目录
   */
  async getConfigDir(): Promise<string> {
    try {
      return await invoke<string>('get_appdata_dir');
    } catch (error) {
      throw new KernelError(
        'Failed to get config directory',
        'CONFIG_DIR_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
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
   * 重命名目录
   */
  async renameDirectory(from: string, to: string): Promise<void> {
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
   * 检查符号链接是否存在
   */
  async checkSymlinkExists(path: string): Promise<boolean> {
    try {
      // 这里需要实现检查符号链接的逻辑
      return await this.exists(path);
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

  /**
   * 下载文件到路径
   */
  async downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
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
  async downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
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

  /**
   * 用默认应用打开文件
   */
  async openFileWithDefaultApp(path: string): Promise<void> {
    try {
      await invoke('open_file_with_default_app', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to open file with default app: ${path}`,
        'OPEN_FILE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 用默认应用打开目录
   */
  async openDirectoryWithDefaultApp(path: string): Promise<void> {
    try {
      await invoke('open_directory_with_default_app', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to open directory with default app: ${path}`,
        'OPEN_DIR_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 用默认浏览器打开链接
   */
  async openUrlWithDefaultBrowser(url: string): Promise<void> {
    try {
      await invoke('open_url_with_default_browser', { url });
    } catch (error) {
      throw new KernelError(
        `Failed to open URL with default browser: ${url}`,
        'OPEN_URL_ERROR',
        { url, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 在资源管理器中显示文件
   */
  async showFileInExplorer(path: string): Promise<void> {
    try {
      await invoke('show_file_in_explorer', { path_str: path });
    } catch (error) {
      throw new KernelError(
        `Failed to show file in explorer: ${path}`,
        'SHOW_FILE_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 在资源管理器中显示目录
   */
  async showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void> {
    try {
      await invoke('show_directory_in_explorer', { path_str: path, if_create: ifCreate || false });
    } catch (error) {
      throw new KernelError(
        `Failed to show directory in explorer: ${path}`,
        'SHOW_DIR_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 打开程序
   */
  async openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
    try {
      await invoke('open_program', { path_str: path, args, hide, uac });
    } catch (error) {
      throw new KernelError(
        `Failed to open program: ${path}`,
        'OPEN_PROGRAM_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 获取应用数据目录
   */
  async getAppdataDir(): Promise<string> {
    try {
      return await invoke<string>('get_appdata_dir');
    } catch (error) {
      throw new KernelError(
        'Failed to get appdata directory',
        'APPDATA_DIR_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  /**
   * 删除目录
   */
  async deleteDirectory(path: string): Promise<void> {
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
