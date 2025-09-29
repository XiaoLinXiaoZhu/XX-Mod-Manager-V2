/**
 * 全局配置管理
 * 提供全局配置的加载、保存和管理功能
 */

import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';
import { TauriFileSystem } from '@/kernels/file-system';
import { loadConfigFromFile, saveConfigToFile, validateConfigStructure } from './config-loader';
import { mergeConfig } from './config-loader';
import { join } from '@tauri-apps/api/path';
import type { GlobalConfig } from './types';

/**
 * 默认全局配置
 */
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

/**
 * 全局配置模式
 */
export const GLOBAL_CONFIG_SCHEMA = {
  language: 'string',
  theme: 'string',
  ifStartWithLastPreset: 'boolean',
  modSourceFolders: 'object',
  modTargetFolder: 'string',
  presetFolder: 'string',
  ifUseTraditionalApply: 'boolean',
  ifKeepModNameAsModFolderName: 'boolean',
  firstLoad: 'boolean',
  disabledPlugins: 'object',
  lastUsedGameRepo: 'string',
  checkUpdatesOnStart: 'boolean'
};

/**
 * 加载全局配置
 * @param fileSystem 文件系统实例
 * @param configDir 配置目录
 * @returns 加载结果
 */
export async function loadGlobalConfig(
  fileSystem: TauriFileSystem,
  configDir: string
): Promise<Result<GlobalConfig, KernelError>> {
  const configPath = await join(configDir, 'config.json');
  
  const result = await loadConfigFromFile(fileSystem, configPath, {
    createDefault: true,
    defaultConfig: DEFAULT_GLOBAL_CONFIG,
    validator: (config) => {
      const validation = validateConfigStructure(config, GLOBAL_CONFIG_SCHEMA);
      return validation.success;
    }
  });
  
  if (!result.success) {
    return result;
  }
  
  // 合并默认配置，确保所有字段都存在
  const mergedConfig = mergeConfig(DEFAULT_GLOBAL_CONFIG, result.data.config);
  
  return {
    success: true,
    data: mergedConfig as GlobalConfig
  };
}

/**
 * 保存全局配置
 * @param fileSystem 文件系统实例
 * @param configDir 配置目录
 * @param config 配置数据
 * @returns 保存结果
 */
export async function saveGlobalConfig(
  fileSystem: TauriFileSystem,
  configDir: string,
  config: GlobalConfig
): Promise<Result<void, KernelError>> {
  const configPath = await join(configDir, 'config.json');
  
  // 验证配置
  const validation = validateConfigStructure(config, GLOBAL_CONFIG_SCHEMA);
  if (!validation.success) {
    return validation;
  }
  
  return await saveConfigToFile(fileSystem, configPath, config);
}

/**
 * 创建全局配置
 * @param overrides 覆盖配置
 * @returns 全局配置
 */
export function createGlobalConfig(overrides: Partial<GlobalConfig> = {}): GlobalConfig {
  return mergeConfig(DEFAULT_GLOBAL_CONFIG, overrides) as GlobalConfig;
}

/**
 * 验证全局配置
 * @param config 配置对象
 * @returns 验证结果
 */
export function validateGlobalConfig(config: any): Result<GlobalConfig, KernelError> {
  const validation = validateConfigStructure(config, GLOBAL_CONFIG_SCHEMA);
  if (!validation.success) {
    return validation;
  }
  
  // 合并默认配置确保完整性
  const mergedConfig = mergeConfig(DEFAULT_GLOBAL_CONFIG, config);
  
  return {
    success: true,
    data: mergedConfig as GlobalConfig
  };
}
