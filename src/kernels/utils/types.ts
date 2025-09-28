/**
 * 工具函数类型定义
 */

/**
 * 命令行参数接口
 */
export interface Argv {
  dev_mode: boolean;
  dev_tools: boolean;
  custom_config_folder: boolean;
  repo?: string;
  page?: string;
}

/**
 * 哈希函数选项
 */
export interface HashOptions {
  algorithm?: 'sha256' | 'md5' | 'crc32';
  encoding?: 'hex' | 'base64';
}
