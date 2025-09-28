/**
 * 文件系统 Kernel 模块
 * 提供与业务解耦的文件系统操作能力
 */

export { TauriFileSystem } from './tauri-file-system-new';
export type { 
  FileInfo, 
  FileSystemResult, 
  FileChangeEvent,
  FileOptions,
  DirectoryOptions,
  ExtendedFileSystem 
} from './types';

