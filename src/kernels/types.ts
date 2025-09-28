/**
 * Kernel 层通用类型定义
 * 这些类型与业务完全解耦，可在任何项目中复用
 */

// 文件系统相关类型
export interface FileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<string[]>;
  getConfigDir(): Promise<string>;
  createSymlink(from: string, to: string): Promise<void>;
  checkDirectoryExists(path: string): Promise<boolean>;
}

// 事件系统相关类型
export interface EventEmitter {
  on(event: string, listener: (...args: any[]) => void): void;
  off(event: string, listener: (...args: any[]) => void): void;
  emit(event: string, ...args: any[]): void;
  once(event: string, listener: (...args: any[]) => void): void;
}

// 存储相关类型
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  keys(): Promise<string[]>;
}

// 状态管理相关类型
export interface StateStore<T> {
  getState(): T;
  setState(newState: T): void;
  subscribe(listener: (state: T) => void): () => void;
}

// 通用结果类型
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

// 通用配置类型
export interface BaseConfig {
  readonly version: string;
  readonly environment: 'development' | 'production' | 'test';
}

// 错误类型
export class KernelError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'KernelError';
  }
  
  get details() {
    return this.context;
  }
}
