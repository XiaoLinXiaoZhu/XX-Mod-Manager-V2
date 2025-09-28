/**
 * 插件服务类型定义
 * 定义插件管理相关的类型和接口
 */

// 插件状态
export enum PluginStatus {
  DISABLED = 'disabled',
  ENABLED = 'enabled',
  LOADING = 'loading',
  ERROR = 'error',
  UNLOADED = 'unloaded'
}

// 插件类型
export enum PluginType {
  CORE = 'core',
  FEATURE = 'feature',
  THEME = 'theme',
  LANGUAGE = 'language',
  UTILITY = 'utility'
}

// 插件信息
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

// 插件配置
export interface PluginConfig {
  id: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  loadOrder: number;
}

// 插件加载选项
export interface PluginLoadOptions {
  validate?: boolean;
  checkDependencies?: boolean;
  checkConflicts?: boolean;
  loadOrder?: 'auto' | 'manual';
}

// 插件服务状态
export interface PluginServiceState {
  plugins: Map<string, PluginInfo>;
  enabledPlugins: Set<string>;
  disabledPlugins: Set<string>;
  loadingPlugins: Set<string>;
  errorPlugins: Set<string>;
  isInitialized: boolean;
  lastUpdated: string;
}

// 插件服务选项
export interface PluginServiceOptions {
  autoLoad: boolean;
  validateOnLoad: boolean;
  checkDependencies: boolean;
  checkConflicts: boolean;
  maxLoadTime: number;
  pluginDirectory: string;
}

// 插件事件类型
export enum PluginServiceEventType {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_CONFIG_CHANGED = 'plugin:config_changed'
}

// 插件事件数据
export interface PluginEventData {
  pluginId: string;
  pluginInfo?: PluginInfo;
  error?: string;
  timestamp: string;
}

// 插件验证结果
export interface PluginValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  dependencies: string[];
  conflicts: string[];
}

// 插件加载结果
export interface PluginLoadResult {
  success: boolean;
  pluginId: string;
  error?: string;
  loadTime?: number;
}

// 插件统计信息
export interface PluginStatistics {
  totalPlugins: number;
  enabledPlugins: number;
  disabledPlugins: number;
  loadingPlugins: number;
  errorPlugins: number;
  averageLoadTime: number;
  lastLoadTime: string;
}

// 插件搜索选项
export interface PluginSearchOptions {
  query?: string;
  type?: PluginType;
  status?: PluginStatus;
  enabled?: boolean;
  limit?: number;
  offset?: number;
}

// 插件搜索结果
export interface PluginSearchResult {
  plugins: PluginInfo[];
  total: number;
  hasMore: boolean;
  query: string;
}

// 插件依赖图
export interface PluginDependencyGraph {
  nodes: Map<string, PluginInfo>;
  edges: Map<string, string[]>;
  cycles: string[][];
}

// 插件错误
export interface PluginError {
  code: string;
  message: string;
  pluginId: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// 默认插件服务选项
export const DEFAULT_PLUGIN_SERVICE_OPTIONS: PluginServiceOptions = {
  autoLoad: true,
  validateOnLoad: true,
  checkDependencies: true,
  checkConflicts: true,
  maxLoadTime: 5000,
  pluginDirectory: './plugins'
};
