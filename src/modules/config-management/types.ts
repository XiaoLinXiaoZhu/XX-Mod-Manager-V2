/**
 * 配置管理模块类型定义
 * 定义配置相关的业务类型和接口
 */

// 全局配置接口
export interface GlobalConfig {
  readonly version: string;
  readonly language: string;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly ifStartWithLastPreset: boolean;
  readonly modSourceFolders: string[];
  readonly modTargetFolder: string;
  readonly presetFolder: string;
  readonly ifUseTraditionalApply: boolean;
  readonly ifKeepModNameAsModFolderName: boolean;
  readonly firstLoad: boolean;
  readonly disabledPlugins: string[];
  readonly lastUsedGameRepo: string;
  readonly checkUpdatesOnStart: boolean;
}

// 子配置接口
export interface SubConfig {
  readonly version: string;
  readonly gameName: string;
  readonly gamePath: string;
  readonly mods: string[];
  readonly presets: string[];
  readonly settings: Record<string, unknown>;
}

// 配置验证结果
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 配置更新选项
export interface ConfigUpdateOptions {
  validate?: boolean;
  backup?: boolean;
  notify?: boolean;
}

// 配置加载选项
export interface ConfigLoadOptions {
  createIfNotExists?: boolean;
  validate?: boolean;
  mergeWithDefault?: boolean;
}

// 配置保存选项
export interface ConfigSaveOptions {
  backup?: boolean;
  validate?: boolean;
  notify?: boolean;
}

// 配置比较结果
export interface ConfigComparisonResult {
  isEqual: boolean;
  differences: Array<{
    path: string;
    oldValue: unknown;
    newValue: unknown;
  }>;
}

// 配置迁移信息
export interface ConfigMigrationInfo {
  fromVersion: string;
  toVersion: string;
  migrations: Array<{
    name: string;
    description: string;
    applied: boolean;
  }>;
}

// 配置错误
export class ConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ConfigError';
  }
}
