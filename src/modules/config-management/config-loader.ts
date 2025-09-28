/**
 * 配置加载器
 * 提供配置文件的加载和解析功能
 */

import { Result, KernelError } from '@/kernels/types';
import { TauriFileSystem } from '@/kernels/file-system';
import { dirname } from '@tauri-apps/api/path';

/**
 * 配置加载选项
 */
export interface ConfigLoadOptions {
  /**
   * 是否创建默认配置
   */
  createDefault?: boolean;
  
  /**
   * 默认配置值
   */
  defaultConfig?: Record<string, any>;
  
  /**
   * 配置验证函数
   */
  validator?: (config: any) => boolean;
}

/**
 * 配置加载结果
 */
export interface ConfigLoadResult {
  /**
   * 配置数据
   */
  config: Record<string, any>;
  
  /**
   * 配置文件路径
   */
  filePath: string;
  
  /**
   * 是否为新创建的配置
   */
  isNew: boolean;
}

/**
 * 从文件加载配置
 * @param fileSystem 文件系统实例
 * @param filePath 配置文件路径
 * @param options 加载选项
 * @returns 加载结果
 */
export async function loadConfigFromFile(
  fileSystem: TauriFileSystem,
  filePath: string,
  options: ConfigLoadOptions = {}
): Promise<Result<ConfigLoadResult, KernelError>> {
  try {
    const { createDefault = true, defaultConfig = {}, validator } = options;
    
    // 检查文件是否存在
    const exists = await fileSystem.exists(filePath);
    
    if (!exists) {
      if (createDefault) {
        // 创建默认配置
        const defaultConfigData = JSON.stringify(defaultConfig, null, 2);
        await fileSystem.writeFile(filePath, defaultConfigData);
        
        return {
          success: true,
          data: {
            config: defaultConfig,
            filePath,
            isNew: true
          },
        };
      } else {
        return {
          success: false,
          error: new KernelError(
            `Config file not found: ${filePath}`,
            'CONFIG_FILE_NOT_FOUND',
            { filePath }
          )
        };
      }
    }
    
    // 读取配置文件
    const configContent = await fileSystem.readFile(filePath);
    
    // 解析JSON
    let config: Record<string, any>;
    try {
      config = JSON.parse(configContent);
    } catch (parseError) {
      return {
        success: false,
        error: new KernelError(
          `Failed to parse config file: ${filePath}`,
          'CONFIG_PARSE_ERROR',
          { 
            filePath, 
            error: parseError instanceof Error ? parseError.message : String(parseError) 
          },
        )
      };
    }
    
    // 验证配置
    if (validator && !validator(config)) {
      return {
        success: false,
        error: new KernelError(
          `Config validation failed: ${filePath}`,
          'CONFIG_VALIDATION_ERROR',
          { filePath, config }
        )
      };
    }
    
    return {
      success: true,
      data: {
        config,
        filePath,
        isNew: false
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to load config from file: ${filePath}`,
        'CONFIG_LOAD_ERROR',
        { 
          filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 保存配置到文件
 * @param fileSystem 文件系统实例
 * @param filePath 配置文件路径
 * @param config 配置数据
 * @returns 保存结果
 */
export async function saveConfigToFile(
  fileSystem: TauriFileSystem,
  filePath: string,
  config: Record<string, any>
): Promise<Result<void, KernelError>> {
  try {
    // 确保目录存在
    const dirPath = await dirname(filePath);
    if (!await fileSystem.exists(dirPath)) {
      await fileSystem.createDirectory(dirPath);
    }
    
    // 序列化配置
    const configContent = JSON.stringify(config, null, 2);
    
    // 写入文件
    await fileSystem.writeFile(filePath, configContent);
    
    return { success: true, data: undefined };
    
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to save config to file: ${filePath}`,
        'CONFIG_SAVE_ERROR',
        { 
          filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 合并配置
 * @param baseConfig 基础配置
 * @param overrideConfig 覆盖配置
 * @returns 合并后的配置
 */
export function mergeConfig(
  baseConfig: Record<string, any>,
  overrideConfig: Record<string, any>
): Record<string, any> {
  return { ...baseConfig, ...overrideConfig };
}

/**
 * 验证配置结构
 * @param config 配置对象
 * @param schema 配置模式
 * @returns 验证结果
 */
export function validateConfigStructure(
  config: any,
  schema: Record<string, any>
): Result<boolean, KernelError> {
  try {
    // 简单的配置结构验证
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in config)) {
        return {
          success: false,
          error: new KernelError(
            `Missing required config key: ${key}`,
            'CONFIG_MISSING_KEY',
            { key, config }
          )
        };
      }
      
      const actualType = typeof config[key];
      if (actualType !== expectedType) {
        return {
          success: false,
          error: new KernelError(
            `Invalid config type for key ${key}: expected ${expectedType}, got ${actualType}`,
            'CONFIG_INVALID_TYPE',
            { key, expectedType, actualType, config }
          )
        };
      }
    }
    
    return { success: true, data: true };
    
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Config validation failed',
        'CONFIG_VALIDATION_ERROR',
        { 
          error: error instanceof Error ? error.message : String(error),
          config 
        },
      )
    };
  }
}
