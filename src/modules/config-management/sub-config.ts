/**
 * 子配置管理模块
 * 提供子配置的创建、验证、转换等纯函数
 */

import { SubConfig, ConfigValidationResult, ConfigError } from './types';
import { Result, KernelError } from '@/kernels/types';

/**
 * 创建默认子配置
 */
export function createDefaultSubConfig(gameName: string = 'Unknown Game'): SubConfig {
  return {
    version: '2.0.0',
    gameName,
    gamePath: '',
    mods: [],
    presets: [],
    settings: {}
  };
}

/**
 * 验证子配置
 */
export function validateSubConfig(config: unknown): Result<ConfigValidationResult, KernelError> {
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

    // 验证游戏名称
    if (!configObj.gameName || typeof configObj.gameName !== 'string') {
      errors.push('Game name is required and must be a string');
    }

    // 验证游戏路径
    if (configObj.gamePath !== undefined && typeof configObj.gamePath !== 'string') {
      errors.push('Game path must be a string');
    }

    // 验证 Mod 列表
    if (configObj.mods !== undefined && !Array.isArray(configObj.mods)) {
      errors.push('Mods must be an array');
    } else if (Array.isArray(configObj.mods)) {
      const invalidMods = configObj.mods.filter(mod => typeof mod !== 'string');
      if (invalidMods.length > 0) {
        errors.push(`Invalid mod entries: ${invalidMods.length} non-string values found`);
      }
    }

    // 验证预设列表
    if (configObj.presets !== undefined && !Array.isArray(configObj.presets)) {
      errors.push('Presets must be an array');
    } else if (Array.isArray(configObj.presets)) {
      const invalidPresets = configObj.presets.filter(preset => typeof preset !== 'string');
      if (invalidPresets.length > 0) {
        errors.push(`Invalid preset entries: ${invalidPresets.length} non-string values found`);
      }
    }

    // 验证设置对象
    if (configObj.settings !== undefined && typeof configObj.settings !== 'object') {
      errors.push('Settings must be an object');
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
        'Failed to validate sub config',
        'CONFIG_VALIDATION_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      )
    };
  }
}

/**
 * 合并子配置
 */
export function mergeSubConfig(
  base: SubConfig,
  updates: Partial<SubConfig>
): SubConfig {
  return {
    ...base,
    ...updates,
    // 深度合并设置对象
    settings: {
      ...base.settings,
      ...(updates.settings || {})
    }
  };
}

/**
 * 更新子配置
 */
export function updateSubConfig(
  config: SubConfig,
  updates: Partial<SubConfig>
): SubConfig {
  return mergeSubConfig(config, updates);
}

/**
 * 添加 Mod 到配置
 */
export function addModToConfig(
  config: SubConfig,
  modId: string
): SubConfig {
  if (config.mods.includes(modId)) {
    return config; // 已存在，不重复添加
  }

  return {
    ...config,
    mods: [...config.mods, modId]
  };
}

/**
 * 从配置中移除 Mod
 */
export function removeModFromConfig(
  config: SubConfig,
  modId: string
): SubConfig {
  return {
    ...config,
    mods: config.mods.filter(id => id !== modId)
  };
}

/**
 * 添加预设到配置
 */
export function addPresetToConfig(
  config: SubConfig,
  presetName: string
): SubConfig {
  if (config.presets.includes(presetName)) {
    return config; // 已存在，不重复添加
  }

  return {
    ...config,
    presets: [...config.presets, presetName]
  };
}

/**
 * 从配置中移除预设
 */
export function removePresetFromConfig(
  config: SubConfig,
  presetName: string
): SubConfig {
  return {
    ...config,
    presets: config.presets.filter(name => name !== presetName)
  };
}

/**
 * 更新配置设置
 */
export function updateConfigSetting(
  config: SubConfig,
  key: string,
  value: unknown
): SubConfig {
  return {
    ...config,
    settings: {
      ...config.settings,
      [key]: value
    }
  };
}

/**
 * 获取配置设置
 */
export function getConfigSetting(
  config: SubConfig,
  key: string,
  defaultValue?: unknown
): unknown {
  return config.settings[key] ?? defaultValue;
}

/**
 * 比较两个子配置
 */
export function compareSubConfigs(
  config1: SubConfig,
  config2: SubConfig
): {
  isEqual: boolean;
  differences: Array<{
    key: keyof SubConfig;
    oldValue: unknown;
    newValue: unknown;
  }>;
} {
  const differences: Array<{
    key: keyof SubConfig;
    oldValue: unknown;
    newValue: unknown;
  }> = [];

  const keys = Object.keys(config1) as Array<keyof SubConfig>;
  
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
 * 检查配置是否需要迁移
 */
export function needsSubConfigMigration(config: SubConfig): boolean {
  const currentVersion = config.version;
  const targetVersion = '2.0.0';
  
  return currentVersion !== targetVersion;
}

/**
 * 获取配置迁移信息
 */
export function getSubConfigMigrationInfo(config: SubConfig): {
  fromVersion: string;
  toVersion: string;
  needsMigration: boolean;
  migrationSteps: string[];
} {
  const fromVersion = config.version;
  const toVersion = '2.0.0';
  const needsMigration = needsSubConfigMigration(config);
  
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
export function sanitizeSubConfig(config: unknown): SubConfig {
  const defaultConfig = createDefaultSubConfig();
  
  if (!config || typeof config !== 'object') {
    return defaultConfig;
  }
  
  const configObj = config as Record<string, unknown>;
  
  return {
    version: typeof configObj.version === 'string' ? configObj.version : defaultConfig.version,
    gameName: typeof configObj.gameName === 'string' ? configObj.gameName : defaultConfig.gameName,
    gamePath: typeof configObj.gamePath === 'string' ? configObj.gamePath : defaultConfig.gamePath,
    mods: Array.isArray(configObj.mods) 
      ? configObj.mods.filter(mod => typeof mod === 'string')
      : defaultConfig.mods,
    presets: Array.isArray(configObj.presets) 
      ? configObj.presets.filter(preset => typeof preset === 'string')
      : defaultConfig.presets,
    settings: typeof configObj.settings === 'object' && configObj.settings !== null
      ? configObj.settings as Record<string, unknown>
      : defaultConfig.settings
  };
}

/**
 * 导出配置为 JSON
 */
export function exportSubConfig(config: SubConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * 从 JSON 导入配置
 */
export function importSubConfig(json: string): Result<SubConfig, KernelError> {
  try {
    const parsed = JSON.parse(json);
    const sanitized = sanitizeSubConfig(parsed);
    
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

/**
 * 获取配置统计信息
 */
export function getSubConfigStats(config: SubConfig): {
  modCount: number;
  presetCount: number;
  settingCount: number;
  isEmpty: boolean;
} {
  return {
    modCount: config.mods.length,
    presetCount: config.presets.length,
    settingCount: Object.keys(config.settings).length,
    isEmpty: config.mods.length === 0 && config.presets.length === 0 && Object.keys(config.settings).length === 0
  };
}
