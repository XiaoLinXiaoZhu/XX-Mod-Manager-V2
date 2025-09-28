/**
 * 脚本加载类型定义
 */

export interface ScriptLoadOptions {
  normalizePath?: boolean;
  replaceExportDefault?: boolean;
  timeout?: number;
}

export interface ScriptLoadResult {
  success: boolean;
  data?: any;
  error?: string;
}
