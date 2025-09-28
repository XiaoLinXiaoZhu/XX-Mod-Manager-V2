/**
 * 插件服务类型定义
 * 定义插件服务层的状态管理和事件类型
 */

import type { 
  PluginInfo, 
  PluginLoadOptions,
  PluginLoadResult,
  PluginStatistics,
  PluginSearchOptions,
  PluginSearchResult
} from '@/modules/plugin-management';

/**
 * 插件服务状态
 */
export interface PluginServiceState {
  plugins: Map<string, PluginInfo>;
  enabledPlugins: Set<string>;
  disabledPlugins: Set<string>;
  loadingPlugins: Set<string>;
  errorPlugins: Set<string>;
  isInitialized: boolean;
  lastUpdated: string;
}

/**
 * 插件服务选项
 */
export interface PluginServiceOptions {
  autoLoad: boolean;
  validateOnLoad: boolean;
  checkDependencies: boolean;
  checkConflicts: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableEvents: boolean;
  enableLogging: boolean;
}

/**
 * 插件服务事件类型
 */
export enum PluginServiceEventType {
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ENABLED = 'plugin:enabled',
  PLUGIN_DISABLED = 'plugin:disabled',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_VALIDATION_FAILED = 'plugin:validation_failed',
  PLUGIN_DEPENDENCY_ERROR = 'plugin:dependency_error',
  PLUGIN_CONFLICT_ERROR = 'plugin:conflict_error'
}

/**
 * 插件事件数据
 */
export interface PluginEventData {
  pluginId: string;
  pluginInfo?: PluginInfo;
  error?: string;
  timestamp: string;
  loadTime?: number;
}

/**
 * 插件服务接口
 */
export interface IPluginService {
  // 生命周期管理
  initialize(): Promise<{ success: boolean; error?: string }>;
  destroy(): Promise<void>;

  // 插件管理
  loadPlugin(pluginId: string, options?: PluginLoadOptions): Promise<{ success: boolean; data?: PluginLoadResult; error?: string }>;
  unloadPlugin(pluginId: string): Promise<{ success: boolean; data?: PluginLoadResult; error?: string }>;
  enablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }>;
  disablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }>;

  // 插件查询
  getPlugin(pluginId: string): PluginInfo | undefined;
  getAllPlugins(): PluginInfo[];
  searchPlugins(options?: PluginSearchOptions): PluginSearchResult;
  getStatistics(): PluginStatistics;

  // 状态管理
  getState(): PluginServiceState;
  subscribe(listener: (state: PluginServiceState) => void): () => void;

  // 事件管理
  on(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void;
  off(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void;
}

/**
 * 默认插件服务选项
 */
export const DEFAULT_PLUGIN_SERVICE_OPTIONS: PluginServiceOptions = {
  autoLoad: true,
  validateOnLoad: true,
  checkDependencies: true,
  checkConflicts: true,
  logLevel: 'info',
  enableEvents: true,
  enableLogging: true
};