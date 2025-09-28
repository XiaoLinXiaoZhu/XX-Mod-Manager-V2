/**
 * 全局配置管理模块
 * 提供全局配置的创建、验证、转换等纯函数
 */

import { GlobalConfig, ConfigValidationResult, ConfigError } from './types';
import { Result, KernelError } from '@/kernels/types';

/**
 * 创建默认全局配置
 */
export function createDefaultGlobalConfig(): GlobalConfig {
  return {
    version: '2.0.0',
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
}

/**
 * 验证全局配置
 */
export function validateGlobalConfig(config: unknown): Result<ConfigValidationResult, KernelError> {
  try {
    if (!config || typeof config !== 'object') {
      return {
        success: false,
        error: new KernelError(
          'Invalid config: not an object',
          'INVALID_CONFIG',
          { config }
        )
      };
    }

    const configObj = config as Record<string, unknown>;
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证版本
    if (!configObj.version || typeof configObj.version !== 'string') {
      errors.push('Version is required and must be a string');
    }

    // 验证语言
    if (!configObj.language || typeof configObj.language !== 'string') {
      errors.push('Language is required and must be a string');
    } else if (!['zh-CN', 'en-US'].includes(configObj.language)) {
      warnings.push(`Unsupported language: ${configObj.language}`);
    }

    // 验证主题
    if (!configObj.theme || typeof configObj.theme !== 'string') {
      errors.push('Theme is required and must be a string');
    } else if (!['light', 'dark', 'auto'].includes(configObj.theme)) {
      errors.push(`Invalid theme: ${configObj.theme}. Must be 'light', 'dark', or 'auto'`);
    }

    // 验证布尔值字段
    const booleanFields = [
      'ifStartWithLastPreset',
      'ifUseTraditionalApply',
      'ifKeepModNameAsModFolderName',
      'firstLoad',
      'checkUpdatesOnStart'
    ];

    for (const field of booleanFields) {
      if (configObj[field] !== undefined && typeof configObj[field] !== 'boolean') {
        errors.push(`${field} must be a boolean`);
      }
    }

    // 验证数组字段
    const arrayFields = ['modSourceFolders', 'disabledPlugins'];

    for (const field of arrayFields) {
      if (configObj[field] !== undefined && !Array.isArray(configObj[field])) {
        errors.push(`${field} must be an array`);
      }
    }

    // 验证字符串字段
    const stringFields = ['modTargetFolder', 'presetFolder', 'lastUsedGameRepo'];

    for (const field of stringFields) {
      if (configObj[field] !== undefined && typeof configObj[field] !== 'string') {
        errors.push(`${field} must be a string`);
      }
    }

    return {
      success: true,
      data: {
        isValid: errors.length === 0,
        errors,
        warnings
      }
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Failed to validate global config',
        'CONFIG_VALIDATION_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      )
    };
  }
}

/**
 * 合并全局配置
 */
export function mergeGlobalConfig(
  base: GlobalConfig,
  updates: Partial<GlobalConfig>
): GlobalConfig {
  return {
    ...base,
    ...updates
  };
}

/**
 * 更新全局配置
 */
export function updateGlobalConfig(
  config: GlobalConfig,
  updates: Partial<GlobalConfig>
): GlobalConfig {
  return mergeGlobalConfig(config, updates);
}

/**
 * 比较两个全局配置
 */
export function compareGlobalConfigs(
  config1: GlobalConfig,
  config2: GlobalConfig
): {
  isEqual: boolean;
  differences: Array<{
    key: keyof GlobalConfig;
    oldValue: unknown;
    newValue: unknown;
  }>;
} {
  const differences: Array<{
    key: keyof GlobalConfig;
    oldValue: unknown;
    newValue: unknown;
  }> = [];

  const keys = Object.keys(config1) as Array<keyof GlobalConfig>;
  
  for (const key of keys) {
    const oldValue = config1[key];
    const newValue = config2[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      differences.push({
        key,
        oldValue,
        newValue
      });
    }
  }

  return {
    isEqual: differences.length === 0,
    differences
  };
}

/**
 * 获取配置差异摘要
 */
export function getConfigDiffSummary(
  config1: GlobalConfig,
  config2: GlobalConfig
): string {
  const comparison = compareGlobalConfigs(config1, config2);
  
  if (comparison.isEqual) {
    return 'No differences found';
  }

  const diffCount = comparison.differences.length;
  const changedKeys = comparison.differences.map(diff => diff.key).join(', ');
  
  return `${diffCount} field(s) changed: ${changedKeys}`;
}

/**
 * 检查配置是否需要迁移
 */
export function needsConfigMigration(config: GlobalConfig): boolean {
  const currentVersion = config.version;
  const targetVersion = '2.0.0';
  
  return currentVersion !== targetVersion;
}

/**
 * 获取配置迁移信息
 */
export function getConfigMigrationInfo(config: GlobalConfig): {
  fromVersion: string;
  toVersion: string;
  needsMigration: boolean;
  migrationSteps: string[];
} {
  const fromVersion = config.version;
  const toVersion = '2.0.0';
  const needsMigration = needsConfigMigration(config);
  
  const migrationSteps: string[] = [];
  
  if (needsMigration) {
    migrationSteps.push('Update version number');
    migrationSteps.push('Validate new configuration structure');
    migrationSteps.push('Apply any necessary data transformations');
  }
  
  return {
    fromVersion,
    toVersion,
    needsMigration,
    migrationSteps
  };
}

/**
 * 清理配置数据
 */
export function sanitizeGlobalConfig(config: unknown): GlobalConfig {
  const defaultConfig = createDefaultGlobalConfig();
  
  if (!config || typeof config !== 'object') {
    return defaultConfig;
  }
  
  const configObj = config as Record<string, unknown>;
  
  return {
    version: typeof configObj.version === 'string' ? configObj.version : defaultConfig.version,
    language: typeof configObj.language === 'string' ? configObj.language : defaultConfig.language,
    theme: ['light', 'dark', 'auto'].includes(configObj.theme as string) 
      ? configObj.theme as 'light' | 'dark' | 'auto' 
      : defaultConfig.theme,
    ifStartWithLastPreset: typeof configObj.ifStartWithLastPreset === 'boolean' 
      ? configObj.ifStartWithLastPreset 
      : defaultConfig.ifStartWithLastPreset,
    modSourceFolders: Array.isArray(configObj.modSourceFolders) 
      ? configObj.modSourceFolders.filter(folder => typeof folder === 'string')
      : defaultConfig.modSourceFolders,
    modTargetFolder: typeof configObj.modTargetFolder === 'string' 
      ? configObj.modTargetFolder 
      : defaultConfig.modTargetFolder,
    presetFolder: typeof configObj.presetFolder === 'string' 
      ? configObj.presetFolder 
      : defaultConfig.presetFolder,
    ifUseTraditionalApply: typeof configObj.ifUseTraditionalApply === 'boolean' 
      ? configObj.ifUseTraditionalApply 
      : defaultConfig.ifUseTraditionalApply,
    ifKeepModNameAsModFolderName: typeof configObj.ifKeepModNameAsModFolderName === 'boolean' 
      ? configObj.ifKeepModNameAsModFolderName 
      : defaultConfig.ifKeepModNameAsModFolderName,
    firstLoad: typeof configObj.firstLoad === 'boolean' 
      ? configObj.firstLoad 
      : defaultConfig.firstLoad,
    disabledPlugins: Array.isArray(configObj.disabledPlugins) 
      ? configObj.disabledPlugins.filter(plugin => typeof plugin === 'string')
      : defaultConfig.disabledPlugins,
    lastUsedGameRepo: typeof configObj.lastUsedGameRepo === 'string' 
      ? configObj.lastUsedGameRepo 
      : defaultConfig.lastUsedGameRepo,
    checkUpdatesOnStart: typeof configObj.checkUpdatesOnStart === 'boolean' 
      ? configObj.checkUpdatesOnStart 
      : defaultConfig.checkUpdatesOnStart
  };
}

/**
 * 导出配置为 JSON
 */
export function exportGlobalConfig(config: GlobalConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * 从 JSON 导入配置
 */
export function importGlobalConfig(json: string): Result<GlobalConfig, KernelError> {
  try {
    const parsed = JSON.parse(json);
    const sanitized = sanitizeGlobalConfig(parsed);
    
    return {
      success: true,
      data: sanitized
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Failed to parse config JSON',
        'CONFIG_IMPORT_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      )
    };
  }
}
