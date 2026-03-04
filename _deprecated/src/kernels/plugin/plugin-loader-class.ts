/**
 * 插件加载器类
 * 提供插件管理的面向对象接口
 */

import type { 
  Plugin, 
  PluginLoadOptions, 
  PluginEnvironment 
} from './types';
import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';
import { 
  validatePlugin, 
  loadPlugin, 
  unloadPlugin, 
  loadPlugins, 
  checkPluginCompatibility,
  type PluginLoadResult,
  type PluginValidationResult
} from './plugin-loader';

/**
 * 插件加载器类
 * 提供插件管理的面向对象接口
 */
export class PluginLoader<TEnvironment extends PluginEnvironment = PluginEnvironment> {
  private plugins: Map<string, Plugin<TEnvironment>> = new Map();
  private loadedPlugins: Set<string> = new Set();
  private environment: TEnvironment;

  constructor(environment: TEnvironment) {
    this.environment = environment;
  }

  /**
   * 注册插件
   * @param plugin 插件定义
   * @returns 注册结果
   */
  registerPlugin(plugin: Plugin<TEnvironment>): Result<boolean, KernelError> {
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

      this.plugins.set(plugin.name, plugin);
      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to register plugin ${plugin.name}`,
          'PLUGIN_REGISTER_ERROR',
          { 
            pluginName: plugin.name, 
            error: error instanceof Error ? error.message : String(error) 
          }
        )
      };
    }
  }

  /**
   * 加载插件
   * @param pluginName 插件名称
   * @param options 加载选项
   * @returns 加载结果
   */
  async loadPlugin(pluginName: string, options: PluginLoadOptions = {}): Promise<Result<PluginLoadResult, KernelError>> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new KernelError(
          `Plugin ${pluginName} not found`,
          'PLUGIN_NOT_FOUND',
          { pluginName }
        )
      };
    }

    const result = await loadPlugin(plugin, this.environment, options);
    if (result.success) {
      this.loadedPlugins.add(pluginName);
    }
    return result;
  }

  /**
   * 卸载插件
   * @param pluginName 插件名称
   * @returns 卸载结果
   */
  unloadPlugin(pluginName: string): Result<boolean, KernelError> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new KernelError(
          `Plugin ${pluginName} not found`,
          'PLUGIN_NOT_FOUND',
          { pluginName }
        )
      };
    }

    const result = unloadPlugin(plugin);
    if (result.success) {
      this.loadedPlugins.delete(pluginName);
    }
    return result;
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getAllPlugins(): Plugin<TEnvironment>[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取已加载的插件
   * @returns 已加载插件名称列表
   */
  getLoadedPlugins(): string[] {
    return Array.from(this.loadedPlugins);
  }

  /**
   * 检查插件是否已加载
   * @param pluginName 插件名称
   * @returns 是否已加载
   */
  isPluginLoaded(pluginName: string): boolean {
    return this.loadedPlugins.has(pluginName);
  }

  /**
   * 检查插件兼容性
   * @param pluginName 插件名称
   * @returns 兼容性检查结果
   */
  checkCompatibility(pluginName: string): Result<boolean, KernelError> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      return {
        success: false,
        error: new KernelError(
          `Plugin ${pluginName} not found`,
          'PLUGIN_NOT_FOUND',
          { pluginName }
        )
      };
    }

    return checkPluginCompatibility(plugin, this.environment);
  }
}
