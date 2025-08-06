import { IFileSystemBase } from '@xlxz/utils';

// 扩展文件系统接口
// IFileSystemBase 已经包含了基础的文件操作、目录操作、路径处理等功能
// 这里只添加 FileHelper.ts 中额外的功能
export interface IFileSystem extends IFileSystemBase {
  // 二进制文件操作
  readBinaryFile(path: string, ifCreate?: boolean): Promise<Uint8Array>;
  writeBinaryFile(path: string, data: Uint8Array, ifCreate?: boolean): Promise<void>;
  
  // 路径操作的扩展（FileHelper 中的额外功能）
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
