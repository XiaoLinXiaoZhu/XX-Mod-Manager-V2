/**
 * 文件系统 Kernel 类型定义
 */

import type { FileSystem } from '../types';

// 文件操作选项
export interface FileOptions {
  create?: boolean;
  encoding?: 'utf8' | 'binary';
}

// 目录操作选项
export interface DirectoryOptions {
  recursive?: boolean;
  create?: boolean;
}

// 文件信息
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  lastModified: Date;
}

// 文件系统操作结果
export interface FileSystemResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// 基础文件系统接口
export interface IFileSystemBase {
  readFile(path: string, ifCreate?: boolean): Promise<string>;
  writeFile(path: string, content: string, ifCreate?: boolean): Promise<void>;
  deleteFile(path: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
  checkFileExists(path: string): Promise<boolean>;
  checkDirectoryExists(path: string): Promise<boolean>;
  normalizePath(path: string): Promise<string>;
  getBaseName(filePath: string): Promise<string>;
  getDirName(filePath: string): Promise<string>;
  getExtension(filePath: string): Promise<string>;
}

// 扩展文件系统接口
export interface IFileSystem extends IFileSystemBase {
  // 二进制文件操作
  readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array>;
  writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void>;
  
  // 路径操作的扩展
  getFullPath(path: string): Promise<string>;
  hasParentDirectory(path: string): Promise<boolean>;
  
  // 符号链接操作
  createSymlink(target: string, link: string): Promise<void>;
  isSymlinkSupported(path: string): Promise<boolean>;
  
  // 下载功能
  downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void>;
  downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array>;
  
  // 系统集成
  openFileWithDefaultApp(path: string): Promise<void>;
  openDirectoryWithDefaultApp(path: string): Promise<void>;
  openUrlWithDefaultBrowser(url: string): Promise<void>;
  showFileInExplorer(path: string): Promise<void>;
  showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void>;
  openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void>;
  
  // 系统目录
  getAppdataDir(): Promise<string>;
  getConfigDir(): Promise<string>;
}

// 文件系统接口扩展
export interface ExtendedFileSystem extends IFileSystem {
  getFileInfo(path: string): Promise<FileInfo>;
  copyFile(from: string, to: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void;
  checkSymlinkExists(path: string): Promise<boolean>;
  removeSymlink(path: string): Promise<void>;
  renameDirectory(from: string, to: string): Promise<void>;
}

// 文件变化事件
export interface FileChangeEvent {
  type: 'create' | 'update' | 'delete';
  path: string;
  timestamp: Date;
}
