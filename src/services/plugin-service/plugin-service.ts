/**
 * 插件服务实现
 * 提供插件状态管理和业务编排
 */

import type { 
  PluginInfo, 
  PluginLoadOptions,
  PluginLoadResult,
  PluginStatistics,
  PluginSearchOptions,
  PluginSearchResult,
  PluginDependencyGraph,
  PluginValidationResult,
  PluginEnvironmentConfig
} from '@/modules/plugin-management';
import { 
  PluginStatus, 
  convertToKernelPlugin, 
  createPluginEnvironment,
  validatePluginInfo,
  validatePluginCompatibility,
  checkDependencyConflicts,
  canLoadPlugin,
  buildDependencyGraph,
  sortPluginsByDependencies,
  searchPlugins,
  getPluginStatistics
} from '@/modules/plugin-management';
import { 
  loadPlugin, 
  unloadPlugin, 
  loadPlugins 
} from '@/kernels/plugin';
import type { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';
import { ReactiveStore } from '@/kernels/state-manager';
import type { 
  PluginServiceState, 
  PluginServiceOptions, 
  PluginServiceEventType, 
  PluginEventData, 
  IPluginService 
} from './types';
import { DEFAULT_PLUGIN_SERVICE_OPTIONS } from './types';

/**
 * 插件服务实现类
 */
export class PluginService implements IPluginService {
  private stateStore: ReactiveStore<PluginServiceState>;
  private options: PluginServiceOptions;
  private eventEmitter: EventEmitter;
  private dependencyGraph: PluginDependencyGraph = {};

  constructor(options: PluginServiceOptions = DEFAULT_PLUGIN_SERVICE_OPTIONS) {
    this.options = { ...DEFAULT_PLUGIN_SERVICE_OPTIONS, ...options };
    this.eventEmitter = new EventEmitter();
    
    this.stateStore = new ReactiveStore<PluginServiceState>('plugin-service', {
      plugins: new Map(),
      enabledPlugins: new Set(),
      disabledPlugins: new Set(),
      loadingPlugins: new Set(),
      errorPlugins: new Set(),
      isInitialized: false,
      lastUpdated: new Date().toISOString()
    });
  }

  /**
   * 初始化插件服务
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ 
        isInitialized: true, 
        lastUpdated: new Date().toISOString() 
      });
      
      // 如果启用自动加载，则加载所有插件
      if (this.options.autoLoad) {
        await this.loadAllPlugins();
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('PLUGIN_INIT_ERROR', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 销毁插件服务
   */
  async destroy(): Promise<void> {
    // 卸载所有插件
    const plugins = Array.from(this.stateStore.getState().plugins.values());
    for (const plugin of plugins) {
      if (plugin.status === PluginStatus.ENABLED) {
        await this.unloadPlugin(plugin.id);
      }
    }

    // 清理状态
    this.stateStore.destroy();
  }

  /**
   * 加载插件
   */
  async loadPlugin(
    pluginId: string, 
    options: PluginLoadOptions = {}
  ): Promise<{ success: boolean; data?: PluginLoadResult; error?: string }> {
    try {
      const state = this.stateStore.getState();
      const pluginInfo = state.plugins.get(pluginId);
      
      if (!pluginInfo) {
        return { success: false, error: 'Plugin not found' };
      }

      // 验证插件
      if (options.validate !== false && this.options.validateOnLoad) {
        const validation = validatePluginInfo(pluginInfo);
        if (!validation.valid) {
          this.emitError('PLUGIN_VALIDATION_FAILED', `Validation failed: ${validation.errors.join(', ')}`);
          return { success: false, error: 'Plugin validation failed' };
        }
      }

      // 检查依赖和冲突
      if (options.checkDependencies !== false && this.options.checkDependencies) {
        const canLoad = canLoadPlugin(pluginInfo, this.createEnvironment(), this.dependencyGraph);
        if (!canLoad.success) {
          this.emitError('PLUGIN_DEPENDENCY_ERROR', canLoad.message);
          return { success: false, error: canLoad.message };
        }
      }

      // 设置加载状态
      this.updateState({
        loadingPlugins: new Set([...state.loadingPlugins, pluginId]),
        errorPlugins: new Set([...state.errorPlugins].filter(id => id !== pluginId))
      });

      try {
        // 创建插件环境
        const environment = this.createEnvironment();
        
        // 转换为 Kernel 层插件
        const kernelPlugin = convertToKernelPlugin(pluginInfo);
        
        // 使用 Kernel 层纯函数加载插件
        const result = await loadPlugin(kernelPlugin, environment, options);
        
        if (result.success) {
          // 更新插件状态
          this.updatePluginStatus(pluginId, {
            status: PluginStatus.ENABLED,
            loadTime: result.data.loadTime,
            error: undefined
          });

          this.updateState({
            enabledPlugins: new Set([...state.enabledPlugins, pluginId]),
            disabledPlugins: new Set([...state.disabledPlugins].filter(id => id !== pluginId)),
            loadingPlugins: new Set([...state.loadingPlugins].filter(id => id !== pluginId))
          });

          // 发射事件
          this.emitEvent(PluginServiceEventType.PLUGIN_LOADED, {
            pluginId,
            loadTime: result.data.loadTime,
            timestamp: new Date().toISOString()
          });

          return { 
            success: true, 
            data: {
              pluginId,
              name: pluginInfo.name,
              success: true,
              loadTime: result.data.loadTime
            }
          };
        } else {
          this.updatePluginStatus(pluginId, {
            status: PluginStatus.ERROR,
            error: result.error.message
          });

          this.updateState({
            errorPlugins: new Set([...state.errorPlugins, pluginId]),
            loadingPlugins: new Set([...state.loadingPlugins].filter(id => id !== pluginId))
          });

          return { success: false, error: result.error.message };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.updatePluginStatus(pluginId, {
          status: PluginStatus.ERROR,
          error: errorMessage
        });

        this.updateState({
          errorPlugins: new Set([...state.errorPlugins, pluginId]),
          loadingPlugins: new Set([...state.loadingPlugins].filter(id => id !== pluginId))
        });

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('PLUGIN_LOAD_ERROR', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<{ success: boolean; data?: PluginLoadResult; error?: string }> {
    try {
      const state = this.stateStore.getState();
      const pluginInfo = state.plugins.get(pluginId);
      
      if (!pluginInfo) {
        return { success: false, error: 'Plugin not found' };
      }

      // 转换为 Kernel 层插件
      const kernelPlugin = convertToKernelPlugin(pluginInfo);
      
      // 使用 Kernel 层纯函数卸载插件
      const result = unloadPlugin(kernelPlugin);
      
      if (result.success) {
        // 更新插件状态
        this.updatePluginStatus(pluginId, {
          status: PluginStatus.UNLOADED,
          enabled: false,
          loadTime: undefined,
          error: undefined
        });

        this.updateState({
          enabledPlugins: new Set([...state.enabledPlugins].filter(id => id !== pluginId)),
          disabledPlugins: new Set([...state.disabledPlugins, pluginId]),
          loadingPlugins: new Set([...state.loadingPlugins].filter(id => id !== pluginId)),
          errorPlugins: new Set([...state.errorPlugins].filter(id => id !== pluginId))
        });

        // 发射事件
        this.emitEvent(PluginServiceEventType.PLUGIN_UNLOADED, {
          pluginId,
          timestamp: new Date().toISOString()
        });

        return { 
          success: true, 
          data: {
            pluginId,
            name: pluginInfo.name,
            success: true,
            loadTime: 0
          }
        };
      } else {
        this.updatePluginStatus(pluginId, {
          status: PluginStatus.ERROR,
          error: result.error.message
        });

        return { success: false, error: result.error.message };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('PLUGIN_UNLOAD_ERROR', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const state = this.stateStore.getState();
      const plugin = state.plugins.get(pluginId);
      
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (plugin.enabled) {
        return { success: false, error: 'Plugin is already enabled' };
      }

      // 更新插件状态
      this.updatePluginStatus(pluginId, {
        enabled: true,
        status: PluginStatus.ENABLED
      });

      this.updateState({
        enabledPlugins: new Set([...state.enabledPlugins, pluginId]),
        disabledPlugins: new Set([...state.disabledPlugins].filter(id => id !== pluginId)),
        lastUpdated: new Date().toISOString()
      });

      // 发射事件
      this.emitEvent(PluginServiceEventType.PLUGIN_ENABLED, {
        pluginId,
        pluginInfo: plugin,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('PLUGIN_ENABLE_ERROR', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const state = this.stateStore.getState();
      const plugin = state.plugins.get(pluginId);
      
      if (!plugin) {
        return { success: false, error: 'Plugin not found' };
      }

      if (!plugin.enabled) {
        return { success: false, error: 'Plugin is already disabled' };
      }

      // 更新插件状态
      this.updatePluginStatus(pluginId, {
        enabled: false,
        status: PluginStatus.DISABLED
      });

      this.updateState({
        enabledPlugins: new Set([...state.enabledPlugins].filter(id => id !== pluginId)),
        disabledPlugins: new Set([...state.disabledPlugins, pluginId]),
        lastUpdated: new Date().toISOString()
      });

      // 发射事件
      this.emitEvent(PluginServiceEventType.PLUGIN_DISABLED, {
        pluginId,
        pluginInfo: plugin,
        timestamp: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emitError('PLUGIN_DISABLE_ERROR', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): PluginInfo | undefined {
    return this.stateStore.getState().plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginInfo[] {
    return Array.from(this.stateStore.getState().plugins.values());
  }

  /**
   * 搜索插件
   */
  searchPlugins(options: PluginSearchOptions = {}): PluginSearchResult {
    const plugins = this.getAllPlugins();
    return searchPlugins(plugins, options);
  }

  /**
   * 获取插件统计信息
   */
  getStatistics(): PluginStatistics {
    const plugins = this.getAllPlugins();
    const stats = getPluginStatistics(plugins);
    const state = this.stateStore.getState();
    
    return {
      ...stats,
      lastLoadTime: state.lastUpdated
    };
  }

  /**
   * 获取服务状态
   */
  getState(): PluginServiceState {
    return this.stateStore.getState();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: PluginServiceState) => void): () => void {
    return this.stateStore.subscribe(listener);
  }

  /**
   * 监听事件
   */
  on(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 取消监听事件
   */
  off(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void {
    this.eventEmitter.off(event, listener);
  }

  // 私有方法

  /**
   * 加载所有插件
   */
  private async loadAllPlugins(): Promise<void> {
    // 这里需要根据具体的插件发现逻辑来实现
    // 暂时留空，等待具体实现
  }

  /**
   * 创建插件环境
   */
  private createEnvironment() {
    const config: PluginEnvironmentConfig = {
      logLevel: this.options.logLevel,
      enableEvents: this.options.enableEvents,
      enableLogging: this.options.enableLogging
    };
    
    return createPluginEnvironment(config);
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<PluginServiceState>): void {
    const currentState = this.stateStore.getState();
    const newState = { ...currentState, ...updates };
    this.stateStore.setState(newState);
  }

  /**
   * 更新插件状态
   */
  private updatePluginStatus(pluginId: string, updates: Partial<PluginInfo>): void {
    const state = this.stateStore.getState();
    const plugin = state.plugins.get(pluginId);
    if (plugin) {
      const updatedPlugin = { ...plugin, ...updates };
      const newPlugins = new Map(state.plugins);
      newPlugins.set(pluginId, updatedPlugin);
      this.updateState({ plugins: newPlugins });
    }
  }

  /**
   * 发射事件
   */
  private emitEvent(event: PluginServiceEventType, data: PluginEventData): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * 发射错误事件
   */
  private emitError(code: string, message: string): void {
    this.emitEvent(PluginServiceEventType.PLUGIN_ERROR, {
      pluginId: '',
      error: message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * 创建插件服务实例
 */
export function createPluginService(options: PluginServiceOptions = DEFAULT_PLUGIN_SERVICE_OPTIONS): PluginService {
  return new PluginService(options);
}
