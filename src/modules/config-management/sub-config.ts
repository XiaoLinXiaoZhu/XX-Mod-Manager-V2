/**
 * 子配置管理
 * 提供项目特定配置的加载、保存和管理功能
 */

import { Result, KernelError } from '@/kernels/types';
import { TauriFileSystem } from '@/kernels/file-system';
import { loadConfigFromFile, saveConfigToFile, mergeConfig, validateConfigStructure } from './config-loader';
import { join, dirname } from '@tauri-apps/api/path';

/**
 * 子配置接口
 */
export interface SubConfig {
  /**
   * 语言设置
   */
  language: string;
  
  /**
   * 主题设置
   */
  theme: string;
  
  /**
   * 是否在启动时使用最后一个预设
   */
  ifStartWithLastPreset: boolean;
  
  /**
   * Mod源文件夹列表
   */
  modSourceFolders: string[];
  
  /**
   * Mod目标文件夹
   */
  modTargetFolder: string;
  
  /**
   * 预设文件夹
   */
  presetFolder: string;
  
  /**
   * 是否使用传统应用方式
   */
  ifUseTraditionalApply: boolean;
  
  /**
   * 是否保持Mod名称作为文件夹名称
   */
  ifKeepModNameAsModFolderName: boolean;
  
  /**
   * 是否首次加载
   */
  firstLoad: boolean;
  
  /**
   * 禁用的插件列表
   */
  disabledPlugins: string[];
}

/**
 * 默认子配置
 */
export const DEFAULT_SUB_CONFIG: SubConfig = {
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

/**
 * 子配置模式
 */
export const SUB_CONFIG_SCHEMA = {
  language: 'string',
  theme: 'string',
  ifStartWithLastPreset: 'boolean',
  modSourceFolders: 'object',
  modTargetFolder: 'string',
  presetFolder: 'string',
  ifUseTraditionalApply: 'boolean',
  ifKeepModNameAsModFolderName: 'boolean',
  firstLoad: 'boolean',
  disabledPlugins: 'object'
};

/**
 * 加载子配置
 * @param fileSystem 文件系统实例
 * @param configPath 配置文件路径
 * @returns 加载结果
 */
export async function loadSubConfig(
  fileSystem: TauriFileSystem,
  configPath: string
): Promise<Result<SubConfig, KernelError>> {
  const result = await loadConfigFromFile(fileSystem, configPath, {
    createDefault: true,
    defaultConfig: DEFAULT_SUB_CONFIG,
    validator: (config) => {
      const validation = validateConfigStructure(config, SUB_CONFIG_SCHEMA);
      return validation.success;
    }
  });
  
  if (!result.success) {
    return result;
  }
  
  // 合并默认配置，确保所有字段都存在
  const mergedConfig = mergeConfig(DEFAULT_SUB_CONFIG, result.data.config);
  
  // 如果预设文件夹没有设置，则使用配置文件目录下的presets文件夹
  if (!mergedConfig['presetFolder'] || mergedConfig['presetFolder'] === '') {
    const dirPath = await dirname(configPath);
    mergedConfig['presetFolder'] = await join(dirPath, 'presets');
  }
  
  return {
    success: true,
    data: mergedConfig as SubConfig
  };
}

/**
 * 保存子配置
 * @param fileSystem 文件系统实例
 * @param configPath 配置文件路径
 * @param config 配置数据
 * @returns 保存结果
 */
export async function saveSubConfig(
  fileSystem: TauriFileSystem,
  configPath: string,
  config: SubConfig
): Promise<Result<void, KernelError>> {
  // 验证配置
  const validation = validateConfigStructure(config, SUB_CONFIG_SCHEMA);
  if (!validation.success) {
    return validation;
  }
  
  return await saveConfigToFile(fileSystem, configPath, config);
}

/**
 * 创建子配置
 * @param overrides 覆盖配置
 * @returns 子配置
 */
export function createSubConfig(overrides: Partial<SubConfig> = {}): SubConfig {
  return mergeConfig(DEFAULT_SUB_CONFIG, overrides) as SubConfig;
}

/**
 * 验证子配置
 * @param config 配置对象
 * @returns 验证结果
 */
export function validateSubConfig(config: any): Result<SubConfig, KernelError> {
  const validation = validateConfigStructure(config, SUB_CONFIG_SCHEMA);
  if (!validation.success) {
    return validation;
  }
  
  // 合并默认配置确保完整性
  const mergedConfig = mergeConfig(DEFAULT_SUB_CONFIG, config);
  
  return {
    success: true,
    data: mergedConfig as SubConfig
  };
}
