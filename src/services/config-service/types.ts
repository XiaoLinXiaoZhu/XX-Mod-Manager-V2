/**
 * 配置服务类型定义
 * 定义配置管理相关的类型和接口
 */

// 配置类型
export type ConfigType = 'global' | 'local' | 'repository';

// 主题类型
export type Theme = 'light' | 'dark' | 'auto';

// 语言类型
export type Language = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 配置值类型
export type ConfigValue = string | number | boolean | string[] | object;

// 配置项
export interface ConfigItem {
  key: string;
  value: ConfigValue;
  type: ConfigType;
  description?: string;
  defaultValue: ConfigValue;
  validator?: (value: ConfigValue) => boolean;
}

// 全局配置
export interface GlobalConfig {
  language: Language;
  theme: Theme;
  ifStartWithLastPreset: boolean;
  modSourceFolders: string[];
  modTargetFolder: string;
  presetFolder: string;
  ifUseTraditionalApply: boolean;
  ifKeepModNameAsModFolderName: boolean;
  firstLoad: boolean;
  disabledPlugins: string[];
  lastUsedGameRepo: string;
  checkUpdatesOnStart: boolean;
}

// 本地配置
export interface LocalConfig {
  language: Language;
  theme: Theme;
  ifStartWithLastPreset: boolean;
  modSourceFolders: string[];
  modTargetFolder: string;
  presetFolder: string;
  ifUseTraditionalApply: boolean;
  ifKeepModNameAsModFolderName: boolean;
  firstLoad: boolean;
  disabledPlugins: string[];
}

// 仓库配置
export interface RepositoryConfig {
  name: string;
  description?: string;
  modSourceFolders: string[];
  modTargetFolder: string;
  settings: Record<string, unknown>;
}

// 配置服务状态
export interface ConfigServiceState {
  globalConfig: GlobalConfig;
  localConfig: LocalConfig | null;
  currentRepository: string | null;
  isInitialized: boolean;
  lastUpdated: string;
}

// 配置服务选项
export interface ConfigServiceOptions {
  autoSave: boolean;
  validateOnLoad: boolean;
  backupOnChange: boolean;
  maxBackups: number;
}

// 配置加载选项
export interface ConfigLoadOptions {
  validate?: boolean;
  backup?: boolean;
  merge?: boolean;
}

// 配置保存选项
export interface ConfigSaveOptions {
  backup?: boolean;
  validate?: boolean;
  notify?: boolean;
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 配置变更事件
export interface ConfigChangeEvent {
  type: ConfigType;
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  timestamp: string;
}

// 配置服务事件类型
export enum ConfigServiceEventType {
  CONFIG_LOADED = 'config:loaded',
  CONFIG_SAVED = 'config:saved',
  CONFIG_CHANGED = 'config:changed',
  CONFIG_VALIDATED = 'config:validated',
  CONFIG_ERROR = 'config:error'
}

// 配置服务错误
export interface ConfigServiceError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// 配置统计信息
export interface ConfigStatistics {
  totalConfigs: number;
  globalConfigs: number;
  localConfigs: number;
  repositoryConfigs: number;
  lastLoadTime: string;
  lastSaveTime: string;
  errorCount: number;
}

// 默认配置值
export const DEFAULT_GLOBAL_CONFIG: GlobalConfig = {
  language: 'zh-CN',
  theme: 'dark',
  ifStartWithLastPreset: false,
  modSourceFolders: [],
  modTargetFolder: '',
  presetFolder: '',
  ifUseTraditionalApply: false,
  ifKeepModNameAsModFolderName: false,
  firstLoad: true,
  disabledPlugins: [],
  lastUsedGameRepo: '',
  checkUpdatesOnStart: true
};

export const DEFAULT_LOCAL_CONFIG: LocalConfig = {
  language: 'zh-CN',
  theme: 'dark',
  ifStartWithLastPreset: false,
  modSourceFolders: [],
  modTargetFolder: '',
  presetFolder: '',
  ifUseTraditionalApply: false,
  ifKeepModNameAsModFolderName: false,
  firstLoad: true,
  disabledPlugins: []
};

export const DEFAULT_CONFIG_SERVICE_OPTIONS: ConfigServiceOptions = {
  autoSave: true,
  validateOnLoad: true,
  backupOnChange: true,
  maxBackups: 5
};
