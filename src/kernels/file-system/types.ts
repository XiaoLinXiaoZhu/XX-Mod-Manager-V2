/**
 * 文件系统 Kernel 类型定义
 */

import { FileSystem } from '../types';

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

// 文件系统接口扩展
export interface ExtendedFileSystem extends FileSystem {
  getFileInfo(path: string): Promise<FileInfo>;
  copyFile(from: string, to: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  watchFile(path: string, callback: (event: FileChangeEvent) => void): () => void;
  createSymlink(from: string, to: string): Promise<void>;
  isSymlinkSupported(path: string): Promise<boolean>;
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
