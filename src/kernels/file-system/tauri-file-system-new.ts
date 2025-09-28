/**
 * Tauri 文件系统实现
 * 基于 Tauri API 的文件系统操作实现，组合了各种操作类
 */

import type { 
  ExtendedFileSystem, 
  FileInfo, 
  FileChangeEvent,
  DirectoryOptions 
} from './types';
import { FileOperations } from './file-operations';
import { DirectoryOperations } from './directory-operations';
import { BinaryOperations } from './binary-operations';
import { SymlinkOperations } from './symlink-operations';
import { DownloadOperations } from './download-operations';
import { SystemIntegration } from './system-integration';
import { PathOperations } from './path-operations';

/**
 * Tauri 文件系统实现类
 * 提供基于 Tauri API 的文件系统操作
 */
export class TauriFileSystem implements ExtendedFileSystem {
  private fileOps: FileOperations;
  private dirOps: DirectoryOperations;
  private binaryOps: BinaryOperations;
  private symlinkOps: SymlinkOperations;
  private downloadOps: DownloadOperations;
  private systemOps: SystemIntegration;
  private pathOps: PathOperations;

  constructor() {
    this.fileOps = new FileOperations();
    this.dirOps = new DirectoryOperations();
    this.binaryOps = new BinaryOperations();
    this.symlinkOps = new SymlinkOperations();
    this.downloadOps = new DownloadOperations();
    this.systemOps = new SystemIntegration();
    this.pathOps = new PathOperations();
  }

  // 基础文件操作
  async readFile(path: string, ifCreate?: boolean): Promise<string> {
    return this.fileOps.readFile(path, ifCreate);
  }

  async writeFile(path: string, content: string, ifCreate?: boolean): Promise<void> {
    return this.fileOps.writeFile(path, content, ifCreate);
  }

  async deleteFile(path: string): Promise<void> {
    return this.fileOps.deleteFile(path);
  }

  async exists(path: string): Promise<boolean> {
    return this.fileOps.exists(path);
  }

  async checkFileExists(path: string): Promise<boolean> {
    return this.fileOps.checkFileExists(path);
  }

  async getFileInfo(path: string): Promise<FileInfo> {
    return this.fileOps.getFileInfo(path);
  }

  async copyFile(from: string, to: string): Promise<void> {
    return this.fileOps.copyFile(from, to);
  }

  async moveFile(from: string, to: string): Promise<void> {
    return this.fileOps.moveFile(from, to);
  }

  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void {
    return this.fileOps.watchFile(path, callback);
  }

  // 目录操作
  async createDirectory(path: string, options: DirectoryOptions = {}): Promise<void> {
    return this.dirOps.createDirectory(path, options);
  }

  async deleteDirectory(path: string): Promise<void> {
    return this.dirOps.deleteDirectory(path);
  }

  async listDirectory(path: string): Promise<string[]> {
    return this.dirOps.listDirectory(path);
  }

  async checkDirectoryExists(path: string): Promise<boolean> {
    return this.dirOps.checkDirectoryExists(path);
  }

  async renameDirectory(from: string, to: string): Promise<void> {
    return this.dirOps.renameDirectory(from, to);
  }

  async getConfigDir(): Promise<string> {
    return this.dirOps.getConfigDir();
  }

  async getAppdataDir(): Promise<string> {
    return this.dirOps.getAppdataDir();
  }

  // 二进制文件操作
  async readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array> {
    return this.binaryOps.readBinaryFile(path, ifCreate);
  }

  async writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void> {
    return this.binaryOps.writeBinaryFile(path, data, ifCreate);
  }

  // 符号链接操作
  async createSymlink(from: string, to: string): Promise<void> {
    return this.symlinkOps.createSymlink(from, to);
  }

  async checkSymlinkExists(path: string): Promise<boolean> {
    return this.symlinkOps.checkSymlinkExists(path);
  }

  async removeSymlink(path: string): Promise<void> {
    return this.symlinkOps.removeSymlink(path);
  }

  async isSymlinkSupported(path: string): Promise<boolean> {
    return this.symlinkOps.isSymlinkSupported(path);
  }

  // 下载操作
  async downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
    return this.downloadOps.downloadFileToPath(url, savePath, timeoutMs);
  }

  async downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
    return this.downloadOps.downloadFileToBinary(url, timeoutMs);
  }

  // 系统集成操作
  async openFileWithDefaultApp(path: string): Promise<void> {
    return this.systemOps.openFileWithDefaultApp(path);
  }

  async openDirectoryWithDefaultApp(path: string): Promise<void> {
    return this.systemOps.openDirectoryWithDefaultApp(path);
  }

  async openUrlWithDefaultBrowser(url: string): Promise<void> {
    return this.systemOps.openUrlWithDefaultBrowser(url);
  }

  async showFileInExplorer(path: string): Promise<void> {
    return this.systemOps.showFileInExplorer(path);
  }

  async showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void> {
    return this.systemOps.showDirectoryInExplorer(path, ifCreate);
  }

  async openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
    return this.systemOps.openProgram(path, args, hide, uac);
  }

  // 路径操作
  async getFullPath(path: string): Promise<string> {
    return this.pathOps.getFullPath(path);
  }

  async hasParentDirectory(path: string): Promise<boolean> {
    return this.pathOps.hasParentDirectory(path);
  }

  async normalizePath(path: string): Promise<string> {
    return this.pathOps.normalizePath(path);
  }

  async getBaseName(filePath: string): Promise<string> {
    return this.pathOps.getBaseName(filePath);
  }

  async getDirName(filePath: string): Promise<string> {
    return this.pathOps.getDirName(filePath);
  }

  async getExtension(filePath: string): Promise<string> {
    return this.pathOps.getExtension(filePath);
  }
}
