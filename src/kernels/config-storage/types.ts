/**
 * 配置存储 Kernel 类型定义
 */

// import { FileSystem } from '../types';

// 配置存储选项
export interface ConfigStorageOptions {
  filePath: string;
  encoding?: 'utf8' | 'binary';
  createIfNotExists?: boolean;
  backupOnSave?: boolean;
  maxBackups?: number;
}

// 配置存储接口
export interface ConfigStorage<T = any> {
  load(): Promise<T>;
  save(data: T): Promise<void>;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
  backup(): Promise<string>;
  restore(backupPath: string): Promise<void>;
  getBackups(): Promise<string[]>;
  clearBackups(): Promise<void>;
}

// 配置存储工厂
export interface ConfigStorageFactory {
  create<T>(options: ConfigStorageOptions): ConfigStorage<T>;
}

// 配置验证器
export type ConfigValidator<T> = (data: unknown) => data is T;

// 配置转换器
export type ConfigTransformer<T, R> = {
  serialize: (data: T) => R;
  deserialize: (data: R) => T;
};

// 配置存储错误
export class ConfigStorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigStorageError';
  }
}
