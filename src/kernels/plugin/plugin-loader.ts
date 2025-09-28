/**
 * 插件加载器纯函数集合
 * 提供与业务解耦的插件加载核心能力
 * 所有函数都是纯函数，无状态管理
 */

import type { 
  Plugin, 
  PluginLoadOptions, 
  PluginEnvironment 
} from './types';
import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';

/**
 * 插件加载结果类型
 */
export interface PluginLoadResult {
  readonly name: string;
  readonly success: boolean;
  readonly loadTime: number;
  readonly error?: string;
}

/**
 * 插件验证结果类型
 */
export interface PluginValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
}

/**
 * 验证插件定义
 * @param plugin 插件定义
 * @returns 验证结果
 */
export function validatePlugin<TEnvironment extends PluginEnvironment>(
  plugin: Plugin<TEnvironment>
): PluginValidationResult {
  const errors: string[] = [];

  if (!plugin.name || typeof plugin.name !== 'string') {
    errors.push('Plugin name is required and must be a string');
  }

  if (!plugin.version || typeof plugin.version !== 'string') {
    errors.push('Plugin version is required and must be a string');
  }

  if (typeof plugin.init !== 'function') {
    errors.push('Plugin init function is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 加载单个插件
 * @param plugin 插件定义
 * @param environment 插件环境
 * @param options 加载选项
 * @returns 加载结果
 */
export async function loadPlugin<TEnvironment extends PluginEnvironment>(
  plugin: Plugin<TEnvironment>,
  environment: TEnvironment,
  _options: PluginLoadOptions = {}
): Promise<Result<PluginLoadResult, KernelError>> {
  const startTime = Date.now();
  
  try {
    // 验证插件
    const validation = validatePlugin(plugin);
    if (!validation.valid) {
      return {
        success: false,
        error: new KernelError(
          `Plugin validation failed: ${validation.errors.join(', ')}`,
          'PLUGIN_VALIDATION_ERROR',
          { pluginName: plugin.name, errors: validation.errors }
        )
      };
    }

    // 初始化插件
    try {
      plugin.init(environment);
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to initialize plugin ${plugin.name}`,
          'PLUGIN_INIT_ERROR',
          { 
            pluginName: plugin.name, 
            error: error instanceof Error ? error.message : String(error) 
          }
        )
      };
    }

    const loadTime = Date.now() - startTime;
    const result: PluginLoadResult = {
      name: plugin.name,
      success: true,
      loadTime
    };

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to load plugin ${plugin.name}`,
        'PLUGIN_LOAD_ERROR',
        { 
          pluginName: plugin.name, 
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 卸载单个插件
 * @param plugin 插件实例
 * @returns 卸载结果
 */
export function unloadPlugin<TEnvironment extends PluginEnvironment>(
  plugin: Plugin<TEnvironment>
): Result<boolean, KernelError> {
  try {
    // 调用插件的销毁函数
    if (plugin.destroy) {
      plugin.destroy();
    }
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to unload plugin ${plugin.name}`,
        'PLUGIN_UNLOAD_ERROR',
        { 
          pluginName: plugin.name, 
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 批量加载插件
 * @param plugins 插件列表
 * @param environment 插件环境
 * @param options 加载选项
 * @returns 加载结果列表
 */
export async function loadPlugins<TEnvironment extends PluginEnvironment>(
  plugins: Plugin<TEnvironment>[],
  environment: TEnvironment,
  _options: PluginLoadOptions = {}
): Promise<Result<PluginLoadResult[], KernelError>> {
  const results: PluginLoadResult[] = [];
  const errors: string[] = [];

  for (const plugin of plugins) {
    const result = await loadPlugin(plugin, environment, _options);
    if (result.success) {
      results.push(result.data);
    } else {
      errors.push(`${plugin.name}: ${result.error.message}`);
    }
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: new KernelError(
        `Failed to load some plugins: ${errors.join('; ')}`,
        'BATCH_PLUGIN_LOAD_ERROR',
        { errors, results }
      )
    };
  }

  return { success: true, data: results };
}

/**
 * 检查插件是否兼容环境
 * @param plugin 插件定义
 * @param environment 目标环境
 * @returns 兼容性检查结果
 */
export function checkPluginCompatibility<TEnvironment extends PluginEnvironment>(
  plugin: Plugin<TEnvironment>,
  environment: TEnvironment
): Result<boolean, KernelError> {
  try {
    // 检查插件是否有兼容性检查函数
    if (plugin.checkCompatibility && typeof plugin.checkCompatibility === 'function') {
      const compatible = plugin.checkCompatibility(environment);
      return { success: true, data: compatible };
    }
    
    // 默认认为兼容
    return { success: true, data: true };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to check plugin compatibility for ${plugin.name}`,
        'PLUGIN_COMPATIBILITY_CHECK_ERROR',
        { 
          pluginName: plugin.name, 
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}