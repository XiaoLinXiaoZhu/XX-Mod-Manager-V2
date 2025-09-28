/**
 * 插件管理 Module 层类型定义
 * 定义插件管理的业务逻辑相关类型
 */

// 类型定义文件，无需导入

/**
 * 插件状态枚举
 */
export enum PluginStatus {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  LOADING = 'loading',
  ERROR = 'error',
  UNLOADED = 'unloaded'
}

/**
 * 插件类型枚举
 */
export enum PluginType {
  CORE = 'core',
  FEATURE = 'feature',
  THEME = 'theme',
  LANGUAGE = 'language',
  UTILITY = 'utility'
}

/**
 * 插件信息接口
 * 包含插件的业务信息
 */
export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  type: PluginType;
  status: PluginStatus;
  dependencies: string[];
  conflicts: string[];
  loadOrder: number;
  enabled: boolean;
  configurable: boolean;
  filePath: string;
  loadTime?: number;
  error?: string;
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  loadOrder: number;
}

/**
 * 插件搜索选项
 */
export interface PluginSearchOptions {
  query?: string;
  type?: PluginType;
  status?: PluginStatus;
  enabled?: boolean;
  offset?: number;
  limit?: number;
}

/**
 * 插件搜索结果
 */
export interface PluginSearchResult {
  plugins: PluginInfo[];
  total: number;
  hasMore: boolean;
  query: string;
}

/**
 * 插件统计信息
 */
export interface PluginStatistics {
  total: number;
  enabled: number;
  disabled: number;
  loading: number;
  error: number;
  averageLoadTime: number;
  lastLoadTime: string;
}

/**
 * 插件依赖图
 */
export interface PluginDependencyGraph {
  [pluginId: string]: {
    dependencies: string[];
    dependents: string[];
  };
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * 插件加载选项
 */
export interface PluginLoadOptions {
  validate?: boolean;
  checkDependencies?: boolean;
  checkConflicts?: boolean;
  priority?: number;
}

/**
 * 插件加载结果
 */
export interface PluginLoadResult {
  pluginId: string;
  name: string;
  success: boolean;
  loadTime: number;
  error?: string;
}

/**
 * 插件环境配置
 */
export interface PluginEnvironmentConfig {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableEvents?: boolean;
  enableLogging?: boolean;
}