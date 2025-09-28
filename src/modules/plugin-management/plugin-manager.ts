/**
 * 业务插件管理器实现
 * 提供与具体业务相关的插件管理功能
 */

import type { 
  BusinessPlugin, 
  BusinessPluginEnvironment, 
  BusinessPluginLoadOptions, 
  BusinessPluginLoadResult, 
  BusinessPluginStatistics,
  BusinessPluginManager,
  PluginScopeContext,
  BusinessPluginScope
} from './types';
import { PluginLoader } from '@/kernels/plugin';
import type { KernelError } from '@/kernels/types';

/**
 * 业务插件管理器实现
 * 支持泛型，让使用者可以定义自己的插件类型和环境
 */
export class BusinessPluginManagerImpl<TPlugin extends BusinessPlugin<TEnvironment>, TEnvironment extends BusinessPluginEnvironment = BusinessPluginEnvironment> 
  implements BusinessPluginManager<TPlugin, TEnvironment> {
  
  private pluginLoader: PluginLoader<TPlugin, TEnvironment>;
  private pluginConfig = new Map<string, Record<string, any>>();
  private pluginScope = new Map<string, BusinessPluginScope>();
  private disabledPlugins = new Set<string>();

  constructor(environment: TEnvironment) {
    this.pluginLoader = new PluginLoader(environment);
  }

  /**
   * 加载插件
   */
  async loadPlugin(plugin: TPlugin, options: BusinessPluginLoadOptions = {}): Promise<BusinessPluginLoadResult> {
    // 验证插件作用域
    const context: PluginScopeContext = {
      currentPage: 'unknown', // 这里应该从实际的应用状态获取
      globalDisabledPlugins: [], // 这里应该从实际的配置获取
      localDisabledPlugins: [] // 这里应该从实际的配置获取
    };

    if (!this.validatePluginScope(plugin, context)) {
      throw new KernelError(
        `Plugin ${plugin.name} cannot be loaded in current context`,
        'PLUGIN_SCOPE_INVALID',
        { pluginName: plugin.name, scope: plugin.scope, context }
      );
    }

    // 保存插件配置和作用域
    if (options.config) {
      this.pluginConfig.set(plugin.name, options.config);
    }
    this.pluginScope.set(plugin.name, plugin.scope);

    // 使用基础插件加载器加载插件
    const result = await this.pluginLoader.loadPlugin(plugin, options);
    
    if (!result.success) {
      throw result.error;
    }

    // 转换为业务插件加载结果
    const businessResult: BusinessPluginLoadResult = {
      ...result.data,
      scope: plugin.scope,
      config: options.config
    };

    return businessResult;
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginName: string): Promise<boolean> {
    const result = await this.pluginLoader.unloadPlugin(pluginName);
    
    if (!result.success) {
      throw result.error;
    }

    // 清理业务特定的数据
    this.pluginConfig.delete(pluginName);
    this.pluginScope.delete(pluginName);
    this.disabledPlugins.delete(pluginName);

    return result.data;
  }

  /**
   * 启用插件
   */
  enablePlugin(pluginName: string): boolean {
    const result = this.pluginLoader.enablePlugin(pluginName);
    
    if (!result.success) {
      throw result.error;
    }

    this.disabledPlugins.delete(pluginName);
    return result.data;
  }

  /**
   * 禁用插件
   */
  disablePlugin(pluginName: string): boolean {
    const result = this.pluginLoader.disablePlugin(pluginName);
    
    if (!result.success) {
      throw result.error;
    }

    this.disabledPlugins.add(pluginName);
    return result.data;
  }

  /**
   * 获取插件
   */
  getPlugin(pluginName: string): TPlugin | undefined {
    return this.pluginLoader.getPlugin(pluginName);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): TPlugin[] {
    return this.pluginLoader.getAllPlugins();
  }

  /**
   * 获取插件状态
   */
  getPluginStatus(pluginName: string): string | undefined {
    return this.pluginLoader.getPluginStatus(pluginName);
  }

  /**
   * 获取插件统计信息
   */
  getStatistics(): BusinessPluginStatistics {
    const baseStats = this.pluginLoader.getStatistics();
    
    // 按作用域分类
    const byScope = {
      global: 0,
      local: 0,
      all: 0
    };

    for (const [pluginName, scope] of this.pluginScope) {
      byScope[scope]++;
    }

    // 按状态分类
    const byStatus = {
      enabled: 0,
      disabled: 0,
      loading: 0,
      error: 0
    };

    for (const pluginName of this.pluginLoader.getAllPlugins().map(p => p.name)) {
      const status = this.pluginLoader.getPluginStatus(pluginName);
      if (status) {
        byStatus[status as keyof typeof byStatus]++;
      }
    }

    return {
      ...baseStats,
      byScope,
      byStatus
    };
  }

  /**
   * 检查插件是否可以启用
   */
  canPluginBeEnabled(pluginName: string, context: PluginScopeContext): boolean {
    const plugin = this.getPlugin(pluginName);
    if (!plugin) {
      return false;
    }

    return this.validatePluginScope(plugin, context);
  }

  /**
   * 验证插件作用域
   */
  validatePluginScope(plugin: TPlugin, context: PluginScopeContext): boolean {
    const { currentPage, globalDisabledPlugins, localDisabledPlugins } = context;
    
    // 检查是否被全局禁用
    if (globalDisabledPlugins.includes(plugin.name)) {
      return false;
    }

    // 检查是否被局部禁用
    if (localDisabledPlugins.includes(plugin.name)) {
      return false;
    }

    // 根据作用域和当前页面判断
    switch (plugin.scope) {
      case 'all':
        return true; // all 作用域的插件总是可以启用
      
      case 'local':
        return currentPage === 'modListPage'; // 局部插件只在 mod 列表页面启用
      
      case 'global':
        return currentPage === 'gamePage'; // 全局插件只在游戏页面启用
      
      default:
        return false;
    }
  }

  /**
   * 获取插件配置
   */
  getPluginConfig(pluginName: string): Record<string, any> | undefined {
    return this.pluginConfig.get(pluginName);
  }

  /**
   * 设置插件配置
   */
  setPluginConfig(pluginName: string, config: Record<string, any>): void {
    this.pluginConfig.set(pluginName, config);
  }

  /**
   * 获取插件作用域
   */
  getPluginScope(pluginName: string): BusinessPluginScope | undefined {
    return this.pluginScope.get(pluginName);
  }
}

/**
 * 创建业务插件管理器
 * @param environment 插件环境
 * @returns 业务插件管理器实例
 */
export function createBusinessPluginManager<TPlugin extends BusinessPlugin<TEnvironment>, TEnvironment extends BusinessPluginEnvironment = BusinessPluginEnvironment>(
  environment: TEnvironment
): BusinessPluginManagerImpl<TPlugin, TEnvironment> {
  return new BusinessPluginManagerImpl(environment);
}
