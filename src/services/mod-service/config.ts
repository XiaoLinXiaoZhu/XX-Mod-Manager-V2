/**
 * Mod 服务配置
 * 定义 Mod 服务的默认配置和配置验证
 */

import { ModServiceConfig, ModServiceOptions } from './types';

/**
 * 默认 Mod 服务配置
 */
export const DEFAULT_MOD_SERVICE_CONFIG: ModServiceConfig = {
  modSourceFolders: [],
  modTargetFolder: '',
  keepModNameAsModFolderName: false,
  traditionalApply: false
};

/**
 * 默认 Mod 服务选项
 */
export const DEFAULT_MOD_SERVICE_OPTIONS: ModServiceOptions = {
  autoLoad: true,
  validateOnLoad: true,
  checkConflicts: true,
  backupOnApply: true
};

/**
 * 验证 Mod 服务配置
 */
export function validateModServiceConfig(config: unknown): config is ModServiceConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const configObj = config as Record<string, unknown>;

  // 检查必需字段
  if (!Array.isArray(configObj.modSourceFolders)) {
    return false;
  }

  if (typeof configObj.modTargetFolder !== 'string') {
    return false;
  }

  if (typeof configObj.keepModNameAsModFolderName !== 'boolean') {
    return false;
  }

  if (typeof configObj.traditionalApply !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * 验证 Mod 服务选项
 */
export function validateModServiceOptions(options: unknown): options is ModServiceOptions {
  if (!options || typeof options !== 'object') {
    return false;
  }

  const optionsObj = options as Record<string, unknown>;

  // 检查所有字段都是布尔值
  const booleanFields = ['autoLoad', 'validateOnLoad', 'checkConflicts', 'backupOnApply'];
  
  for (const field of booleanFields) {
    if (optionsObj[field] !== undefined && typeof optionsObj[field] !== 'boolean') {
      return false;
    }
  }

  return true;
}

/**
 * 合并配置
 */
export function mergeModServiceConfig(
  base: ModServiceConfig,
  updates: Partial<ModServiceConfig>
): ModServiceConfig {
  return {
    ...base,
    ...updates
  };
}

/**
 * 合并选项
 */
export function mergeModServiceOptions(
  base: ModServiceOptions,
  updates: Partial<ModServiceOptions>
): ModServiceOptions {
  return {
    ...base,
    ...updates
  };
}

/**
 * 创建配置工厂
 */
export function createModServiceConfigFactory() {
  return {
    createDefault(): ModServiceConfig {
      return { ...DEFAULT_MOD_SERVICE_CONFIG };
    },
    
    createFromPartial(partial: Partial<ModServiceConfig>): ModServiceConfig {
      return mergeModServiceConfig(DEFAULT_MOD_SERVICE_CONFIG, partial);
    },
    
    validate(config: unknown): config is ModServiceConfig {
      return validateModServiceConfig(config);
    }
  };
}

/**
 * 创建选项工厂
 */
export function createModServiceOptionsFactory() {
  return {
    createDefault(): ModServiceOptions {
      return { ...DEFAULT_MOD_SERVICE_OPTIONS };
    },
    
    createFromPartial(partial: Partial<ModServiceOptions>): ModServiceOptions {
      return mergeModServiceOptions(DEFAULT_MOD_SERVICE_OPTIONS, partial);
    },
    
    validate(options: unknown): options is ModServiceOptions {
      return validateModServiceOptions(options);
    }
  };
}
