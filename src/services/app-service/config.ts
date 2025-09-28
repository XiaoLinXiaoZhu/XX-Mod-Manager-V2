/**
 * 应用服务配置
 * 定义应用服务的默认配置和配置验证
 */

import { AppConfig } from './types';

/**
 * 默认应用配置
 */
export const DEFAULT_APP_CONFIG: AppConfig = {
  version: '2.0.0',
  environment: 'development',
  debug: true,
  autoUpdate: true,
  checkUpdatesOnStart: true
};

/**
 * 验证应用配置
 */
export function validateAppConfig(config: unknown): config is AppConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const configObj = config as Record<string, unknown>;

  // 检查必需字段
  if (typeof configObj.version !== 'string') {
    return false;
  }

  if (!['development', 'production', 'test'].includes(configObj.environment as string)) {
    return false;
  }

  if (typeof configObj.debug !== 'boolean') {
    return false;
  }

  if (typeof configObj.autoUpdate !== 'boolean') {
    return false;
  }

  if (typeof configObj.checkUpdatesOnStart !== 'boolean') {
    return false;
  }

  return true;
}

/**
 * 合并配置
 */
export function mergeAppConfig(
  base: AppConfig,
  updates: Partial<AppConfig>
): AppConfig {
  return {
    ...base,
    ...updates
  };
}

/**
 * 创建配置工厂
 */
export function createAppConfigFactory() {
  return {
    createDefault(): AppConfig {
      return { ...DEFAULT_APP_CONFIG };
    },
    
    createFromPartial(partial: Partial<AppConfig>): AppConfig {
      return mergeAppConfig(DEFAULT_APP_CONFIG, partial);
    },
    
    validate(config: unknown): config is AppConfig {
      return validateAppConfig(config);
    }
  };
}
