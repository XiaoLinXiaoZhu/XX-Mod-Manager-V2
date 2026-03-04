/**
 * 配置存储 Kernel 模块
 * 提供与业务解耦的配置存储能力
 */

export { FileSystemConfigStorage } from './storage-adapter';
export type { 
  ConfigStorage, 
  ConfigStorageOptions, 
  ConfigStorageFactory,
  ConfigValidator,
  ConfigTransformer,
  ConfigStorageError
} from './types';
