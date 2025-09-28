/**
 * 插件加载器
 * 负责插件的加载、卸载和状态管理
 */

import { 
  PluginInfo, 
  PluginLoadOptions,
  PluginLoadResult,
  PluginServiceState,
  PluginServiceEventType,
  PluginEventData
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';

/**
 * 插件加载器类
 */
export class PluginLoader {
  private state: PluginServiceState;
  private eventEmitter: EventEmitter;
  private loadTimes: Map<string, number> = new Map();

  constructor(state: PluginServiceState, eventEmitter: EventEmitter) {
    this.state = state;
    this.eventEmitter = eventEmitter;
  }

  /**
   * 加载插件
   */
  async loadPlugin(
    pluginId: string,
    options: PluginLoadOptions = {}
  ): Promise<Result<PluginLoadResult, KernelError>> {
    try {
      const startTime = Date.now();
      
      // 检查插件是否已加载
      if (this.state.plugins.has(pluginId)) {
        return {
          success: false,
          error: new KernelError(
            'Plugin already loaded',
            'PLUGIN_ALREADY_LOADED',
            { pluginId }
          )
        };
      }

      // 设置加载状态
      this.state.loadingPlugins.add(pluginId);
      this.state.lastUpdated = new Date().toISOString();

      // 这里应该实现实际的插件加载逻辑
      // 目前只是模拟加载
      const pluginInfo: PluginInfo = {
        id: pluginId,
        name: `Plugin ${pluginId}`,
        version: '1.0.0',
        description: `Description for plugin ${pluginId}`,
        type: 'FEATURE' as any,
        status: 'ENABLED' as any,
        dependencies: [],
        conflicts: [],
        loadOrder: 0,
        enabled: true,
        configurable: true,
        filePath: `./plugins/${pluginId}.js`
      };

      const loadTime = Date.now() - startTime;
      this.loadTimes.set(pluginId, loadTime);
      pluginInfo.loadTime = loadTime;

      // 更新状态
      this.state.plugins.set(pluginId, pluginInfo);
      this.state.loadingPlugins.delete(pluginId);
      this.state.enabledPlugins.add(pluginId);
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(PluginServiceEventType.PLUGIN_LOADED, {
        pluginId,
        pluginInfo,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: {
          success: true,
          pluginId,
          loadTime
        }
      };
    } catch (error) {
      this.state.loadingPlugins.delete(pluginId);
      this.state.errorPlugins.add(pluginId);
      
      const kernelError = new KernelError(
        `Failed to load plugin: ${pluginId}`,
        'PLUGIN_LOAD_ERROR',
        { pluginId, error: error instanceof Error ? error.message : String(error) }
      );
      
      this.emitError('PLUGIN_LOAD_ERROR', kernelError.message, { pluginId, ...kernelError.details });
      
      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(pluginId: string): Promise<Result<PluginLoadResult, KernelError>> {
    try {
      const plugin = this.state.plugins.get(pluginId);
      if (!plugin) {
        return {
          success: false,
          error: new KernelError(
            'Plugin not found',
            'PLUGIN_NOT_FOUND',
            { pluginId }
          )
        };
      }

      // 这里应该实现实际的插件卸载逻辑
      // 目前只是模拟卸载

      // 更新状态
      this.state.plugins.delete(pluginId);
      this.state.enabledPlugins.delete(pluginId);
      this.state.disabledPlugins.delete(pluginId);
      this.state.errorPlugins.delete(pluginId);
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(PluginServiceEventType.PLUGIN_UNLOADED, {
        pluginId,
        pluginInfo: plugin,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: {
          success: true,
          pluginId
        }
      };
    } catch (error) {
      const kernelError = new KernelError(
        `Failed to unload plugin: ${pluginId}`,
        'PLUGIN_UNLOAD_ERROR',
        { pluginId, error: error instanceof Error ? error.message : String(error) }
      );
      
      this.emitError('PLUGIN_UNLOAD_ERROR', kernelError.message, { pluginId, ...kernelError.details });
      
      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 加载所有插件
   */
  async loadAllPlugins(): Promise<Result<void, KernelError>> {
    try {
      // 这里应该实现实际的批量加载逻辑
      // 目前只是模拟加载
      
      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to load all plugins',
          'PLUGIN_BULK_LOAD_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 获取加载时间
   */
  getLoadTime(pluginId: string): number | undefined {
    return this.loadTimes.get(pluginId);
  }

  /**
   * 发出错误事件
   */
  private emitError(code: string, message: string, details?: Record<string, unknown>): void {
    this.eventEmitter.emit(PluginServiceEventType.PLUGIN_ERROR, {
      pluginId: '',
      error: message,
      timestamp: new Date().toISOString()
    });
  }
}
