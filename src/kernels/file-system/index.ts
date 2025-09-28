/**
 * 文件系统 Kernel 模块
 * 提供与业务解耦的文件系统操作能力
 */

export { TauriFileSystem } from './tauri-file-system';
export type { 
  FileInfo, 
  FileSystemResult, 
  FileChangeEvent,
  FileOptions,
  DirectoryOptions,
  ExtendedFileSystem 
} from './types';

// 创建默认的文件系统实例
import { TauriFileSystem } from './tauri-file-system';

export const fileSystem = new TauriFileSystem();
