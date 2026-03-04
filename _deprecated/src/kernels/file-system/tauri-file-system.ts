/**
 * Tauri 文件系统实现
 * 基于 Tauri API 的文件系统操作实现
 * 组装各个功能模块
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '@/kernels/types';
import type { 
  ExtendedFileSystem, 
  FileInfo, 
  FileChangeEvent,
  DirectoryOptions 
} from './types';

// 导入各个功能模块
import * as fileOps from './file-operations';
import * as dirOps from './directory-operations';
import * as pathOps from './path-operations';
import * as symlinkOps from './symlink-operations';
import * as downloadOps from './download-operations';
import * as systemOps from './system-integration';

/**
 * Tauri 文件系统实现类
 * 提供基于 Tauri API 的文件系统操作
 */
export class TauriFileSystem implements ExtendedFileSystem {
  // 基础文件操作
  async readFile(path: string, ifCreate?: boolean): Promise<string> {
    return fileOps.readFile(path, ifCreate);
  }

  async writeFile(path: string, content: string, ifCreate?: boolean): Promise<void> {
    return fileOps.writeFile(path, content, ifCreate);
  }

  async deleteFile(path: string): Promise<void> {
    return fileOps.deleteFile(path);
  }

  async exists(path: string): Promise<boolean> {
    return fileOps.checkFileExists(path);
  }

  async copyFile(from: string, to: string): Promise<void> {
    return fileOps.copyFile(from, to);
  }

  async moveFile(from: string, to: string): Promise<void> {
    return fileOps.moveFile(from, to);
  }

  async readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array> {
    return fileOps.readBinaryFile(path, ifCreate);
  }

  async writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void> {
    return fileOps.writeBinaryFile(path, data, ifCreate);
  }

  async checkFileExists(path: string): Promise<boolean> {
    return fileOps.checkFileExists(path);
  }

  // 目录操作
  async createDirectory(path: string, options: DirectoryOptions = {}): Promise<void> {
    return dirOps.createDirectory(path, options);
  }

  async listDirectory(path: string): Promise<string[]> {
    return dirOps.listDirectory(path);
  }

  async checkDirectoryExists(path: string): Promise<boolean> {
    return dirOps.checkDirectoryExists(path);
  }

  async renameDirectory(from: string, to: string): Promise<void> {
    return dirOps.renameDirectory(from, to);
  }

  async deleteDirectory(path: string): Promise<void> {
    return dirOps.deleteDirectory(path);
  }

  // 路径操作
  async getFullPath(path: string): Promise<string> {
    return pathOps.getFullPath(path);
  }

  async normalizePath(path: string): Promise<string> {
    return pathOps.normalizePath(path);
  }

  async getBaseName(filePath: string): Promise<string> {
    return pathOps.getBaseName(filePath);
  }

  async getDirName(filePath: string): Promise<string> {
    return pathOps.getDirName(filePath);
  }

  async getExtension(filePath: string): Promise<string> {
    return pathOps.getExtension(filePath);
  }

  async hasParentDirectory(path: string): Promise<boolean> {
    return pathOps.hasParentDirectory(path);
  }

  // 符号链接操作
  async createSymlink(from: string, to: string): Promise<void> {
    return symlinkOps.createSymlink(from, to);
  }

  async checkSymlinkExists(path: string): Promise<boolean> {
    return symlinkOps.checkSymlinkExists(path);
  }

  async removeSymlink(path: string): Promise<void> {
    return symlinkOps.removeSymlink(path);
  }

  async isSymlinkSupported(path: string): Promise<boolean> {
    return symlinkOps.isSymlinkSupported(path);
  }

  // 下载操作
  async downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
    return downloadOps.downloadFileToPath(url, savePath, timeoutMs);
  }

  async downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
    return downloadOps.downloadFileToBinary(url, timeoutMs);
  }

  // 系统集成操作
  async getConfigDir(): Promise<string> {
    return systemOps.getConfigDir();
  }

  async getAppdataDir(): Promise<string> {
    return systemOps.getAppdataDir();
  }

  async openFileWithDefaultApp(path: string): Promise<void> {
    return systemOps.openFileWithDefaultApp(path);
  }

  async openDirectoryWithDefaultApp(path: string, ifCreate?: boolean): Promise<void> {
    return systemOps.openDirectoryWithDefaultApp(path, ifCreate);
  }

  async openUrlWithDefaultBrowser(url: string): Promise<void> {
    return systemOps.openUrlWithDefaultBrowser(url);
  }

  async showFileInExplorer(path: string): Promise<void> {
    return systemOps.showFileInExplorer(path);
  }

  async showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void> {
    return systemOps.showDirectoryInExplorer(path, ifCreate);
  }

  async openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
    return systemOps.openProgram(path, args, hide, uac);
  }

  // 文件信息操作
  async getFileInfo(path: string): Promise<FileInfo> {
    try {
      const stat = await invoke<{ 
        is_dir: boolean; 
        size: number; 
        modified_at: number 
      }>('get_file_info', { path });
      
      return {
        path,
        name: path.split('/').pop() || path.split('\\').pop() || '',
        size: stat.size,
        isDirectory: stat.is_dir,
        isFile: !stat.is_dir,
        lastModified: new Date(stat.modified_at)
      };
    } catch (error) {
      throw new KernelError(
        `Failed to get file info: ${path}`,
        'FILE_INFO_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  // 文件监听
  watchFile(_path: string, _callback: (event: FileChangeEvent) => void): () => void {
    // TODO: 实现文件监听逻辑，使用 Tauri 的文件监听 API
    // 暂时返回一个空的取消函数
    return () => {};
  }
}