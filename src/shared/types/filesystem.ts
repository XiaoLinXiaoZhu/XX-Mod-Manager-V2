import { IFileSystemBase } from '@xlxz/utils';

// 扩展文件系统接口
export interface IFileSystem extends IFileSystemBase {
  // 二进制文件操作
  readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array>;
  writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void>;
  
  // 目录列表和路径操作
  getDirectoryList(path: string): Promise<string[]>;
  getFullPath(path: string): Promise<string>;
  joinPath(basePath: string, relativePath: string): Promise<string>;
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
