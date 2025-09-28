/**
 * 通用插件加载器
 * 提供与业务解耦的插件加载和管理功能
 * 支持泛型，让使用者可以定义自己的插件类型和环境
 */

import type { 
  Plugin, 
  PluginStatus, 
  PluginLoadOptions, 
  PluginLoadResult, 
  PluginStatistics,
  PluginEnvironment 
} from './types';
import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';

/**
 * 通用插件加载器类
 * 支持泛型，让使用者可以定义自己的插件类型和环境
 */
export class PluginLoader<TPlugin extends Plugin<TEnvironment>, TEnvironment extends PluginEnvironment = PluginEnvironment> {
  private plugins = new Map<string, TPlugin>();
  private pluginStatus = new Map<string, PluginStatus>();
  private disabledPlugins = new Set<string>();
  private environment: TEnvironment;

  constructor(environment: TEnvironment) {
    this.environment = environment;
  }

  /**
   * 加载插件
   * @param plugin 插件定义
   * @param options 加载选项
   * @returns 加载结果
   */
  async loadPlugin(plugin: TPlugin, _options: PluginLoadOptions = {}): Promise<Result<PluginLoadResult, KernelError>> {
    const startTime = Date.now();
    
    try {
      // 验证插件
      const validation = this.validatePlugin(plugin);
      if (!validation.success) {
        return validation;
      }

      // 检查是否已加载
      if (this.plugins.has(plugin.name)) {
        return {
          success: false,
          error: new KernelError(
            `Plugin ${plugin.name} is already loaded`,
            'PLUGIN_ALREADY_LOADED',
            { pluginName: plugin.name }
          )
        };
      }

      // 检查是否被禁用
      if (this.disabledPlugins.has(plugin.name)) {
        return {
          success: false,
          error: new KernelError(
            `Plugin ${plugin.name} is disabled`,
            'PLUGIN_DISABLED',
            { pluginName: plugin.name }
          )
        };
      }

      // 设置插件状态
      this.pluginStatus.set(plugin.name, 'loading');

      // 初始化插件
      try {
        plugin.init(this.environment);
        this.pluginStatus.set(plugin.name, 'enabled');
      } catch (error) {
        this.pluginStatus.set(plugin.name, 'error');
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

      // 注册插件
      this.plugins.set(plugin.name, plugin);

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
   * 卸载插件
   * @param pluginName 插件名称
   * @returns 卸载结果
   */
  async unloadPlugin(pluginName: string): Promise<Result<boolean, KernelError>> {
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

    try {
      // 调用插件的销毁函数
      if (plugin.destroy) {
        plugin.destroy();
      }

      // 移除插件
      this.plugins.delete(pluginName);
      this.pluginStatus.delete(pluginName);

      return { success: true, data: true };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to unload plugin ${pluginName}`,
          'PLUGIN_UNLOAD_ERROR',
          { 
            pluginName, 
            error: error instanceof Error ? error.message : String(error) 
          }
        )
      };
    }
  }

  /**
   * 启用插件
   * @param pluginName 插件名称
   * @returns 启用结果
   */
  enablePlugin(pluginName: string): Result<boolean, KernelError> {
    if (!this.plugins.has(pluginName)) {
      return {
        success: false,
        error: new KernelError(
          `Plugin ${pluginName} not found`,
          'PLUGIN_NOT_FOUND',
          { pluginName }
        )
      };
    }

    this.disabledPlugins.delete(pluginName);
    this.pluginStatus.set(pluginName, 'enabled');
    return { success: true, data: true };
  }

  /**
   * 禁用插件
   * @param pluginName 插件名称
   * @returns 禁用结果
   */
  disablePlugin(pluginName: string): Result<boolean, KernelError> {
    if (!this.plugins.has(pluginName)) {
      return {
        success: false,
        error: new KernelError(
          `Plugin ${pluginName} not found`,
          'PLUGIN_NOT_FOUND',
          { pluginName }
        )
      };
    }

    this.disabledPlugins.add(pluginName);
    this.pluginStatus.set(pluginName, 'disabled');
    return { success: true, data: true };
  }

  /**
   * 获取插件
   * @param pluginName 插件名称
   * @returns 插件实例
   */
  getPlugin(pluginName: string): TPlugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getAllPlugins(): TPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取插件状态
   * @param pluginName 插件名称
   * @returns 插件状态
   */
  getPluginStatus(pluginName: string): PluginStatus | undefined {
    return this.pluginStatus.get(pluginName);
  }

  /**
   * 获取插件统计信息
   * @returns 统计信息
   */
  getStatistics(): PluginStatistics {
    const total = this.plugins.size;
    let enabled = 0;
    let disabled = 0;
    let error = 0;

    for (const status of this.pluginStatus.values()) {
      switch (status) {
        case 'enabled':
          enabled++;
          break;
        case 'disabled':
          disabled++;
          break;
        case 'error':
          error++;
          break;
      }
    }

    return {
      total,
      enabled,
      disabled,
      error
    };
  }

  /**
   * 验证插件
   * @param plugin 插件定义
   * @returns 验证结果
   */
  private validatePlugin(plugin: TPlugin): Result<boolean, KernelError> {
    if (!plugin.name || typeof plugin.name !== 'string') {
      return {
        success: false,
        error: new KernelError(
          'Plugin name is required and must be a string',
          'INVALID_PLUGIN_NAME',
          { plugin }
        )
      };
    }

    if (!plugin.version || typeof plugin.version !== 'string') {
      return {
        success: false,
        error: new KernelError(
          'Plugin version is required and must be a string',
          'INVALID_PLUGIN_VERSION',
          { plugin }
        )
      };
    }

    if (typeof plugin.init !== 'function') {
      return {
        success: false,
        error: new KernelError(
          'Plugin init function is required',
          'INVALID_PLUGIN_INIT',
          { plugin }
        )
      };
    }

    return { success: true, data: true };
  }
}