/**
 * 插件管理器
 * 提供插件管理的核心功能
 */

import type { 
  PluginInfo, 
  PluginConfig, 
  PluginLoadOptions,
  PluginServiceState,
  PluginServiceOptions,
  PluginServiceEventType,
  PluginEventData,
  PluginValidationResult,
  PluginLoadResult,
  PluginStatistics,
  PluginSearchOptions,
  PluginSearchResult,
  PluginDependencyGraph,
  PluginError
} from './types';
import { PluginStatus, PluginType, DEFAULT_PLUGIN_SERVICE_OPTIONS } from './types';
import type { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';
import { 
  validatePlugin,
  loadPlugin,
  unloadPlugin,
  loadPlugins,
  checkPluginCompatibility
} from '@/kernels/plugin';
import { PluginValidator } from './plugin-validator';

// 插件服务类
export class PluginService {
  private state: PluginServiceState;
  private options: PluginServiceOptions;
  private eventEmitter: EventEmitter;
  private pluginValidator: PluginValidator;

  constructor(options: PluginServiceOptions = DEFAULT_PLUGIN_SERVICE_OPTIONS) {
    this.options = { ...DEFAULT_PLUGIN_SERVICE_OPTIONS, ...options };
    this.eventEmitter = new EventEmitter();
    
    this.state = {
      plugins: new Map(),
      enabledPlugins: new Set(),
      disabledPlugins: new Set(),
      loadingPlugins: new Set(),
      errorPlugins: new Set(),
      isInitialized: false,
      lastUpdated: new Date().toISOString()
    };

    // 初始化子组件
    this.pluginValidator = new PluginValidator(this.eventEmitter);
  }

  /**
   * 初始化插件服务
   */
  async initialize(): Promise<Result<void, KernelError>> {
    try {
      this.state.isInitialized = true;
      this.state.lastUpdated = new Date().toISOString();
      
      // 如果启用自动加载，则加载所有插件
      if (this.options.autoLoad) {
        await this.loadAllPlugins();
      }

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      const kernelError = new KernelError(
        'Failed to initialize plugin service',
        'PLUGIN_INIT_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      this.emitError('PLUGIN_INIT_ERROR', kernelError.message, kernelError.details);
      
      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 加载所有插件
   */
  private async loadAllPlugins(): Promise<void> {
    // 这里需要根据具体的插件发现逻辑来实现
    // 暂时留空，等待具体实现
  }

  /**
   * 加载插件
   */
  async loadPlugin(
    pluginId: string,
    options: PluginLoadOptions = {}
  ): Promise<Result<PluginLoadResult, KernelError>> {
    try {
      // 验证插件
      if (options.validate !== false && this.options.validateOnLoad) {
        const validation = await this.pluginValidator.validatePlugin(pluginId);
        if (!validation.success) {
          this.state.loadingPlugins.delete(pluginId);
          this.state.errorPlugins.add(pluginId);
          return {
            success: false,
            error: new KernelError(
              'Plugin validation failed',
              'PLUGIN_VALIDATION_ERROR',
              { pluginId, errors: validation.data.errors }
            )
          };
        }
      }

      // 检查依赖
      if (options.checkDependencies !== false && this.options.checkDependencies) {
        const dependencyCheck = await this.pluginValidator.checkDependencies(pluginId);
        if (!dependencyCheck.success) {
          this.state.loadingPlugins.delete(pluginId);
          this.state.errorPlugins.add(pluginId);
          return dependencyCheck;
        }
      }

      // 检查冲突
      if (options.checkConflicts !== false && this.options.checkConflicts) {
        const conflictCheck = await this.pluginValidator.checkConflicts(pluginId);
        if (!conflictCheck.success) {
          this.state.loadingPlugins.delete(pluginId);
          this.state.errorPlugins.add(pluginId);
          return conflictCheck;
        }
      }

      // 获取插件信息
      const pluginInfo = this.state.plugins.get(pluginId);
      if (!pluginInfo) {
        return {
          success: false,
          error: new KernelError(
            'Plugin not found',
            'PLUGIN_NOT_FOUND',
            { pluginId }
          )
        };
      }

      // 设置加载状态
      this.state.loadingPlugins.add(pluginId);
      this.state.errorPlugins.delete(pluginId);

      try {
        // 创建插件环境
        const environment = this.createPluginEnvironment();
        
        // 使用 Kernel 层纯函数加载插件
        const result = await loadPlugin(pluginInfo, environment, options);
        
        if (result.success) {
          // 更新插件状态
          this.state.enabledPlugins.add(pluginId);
          this.state.disabledPlugins.delete(pluginId);
          this.state.loadingPlugins.delete(pluginId);
          
          // 更新插件信息
          pluginInfo.status = PluginStatus.ENABLED;
          pluginInfo.loadTime = result.data.loadTime;
          pluginInfo.error = undefined;
          
          // 发射事件
          this.eventEmitter.emit(PluginServiceEventType.PLUGIN_LOADED, {
            pluginId,
            loadTime: result.data.loadTime
          });
        } else {
          this.state.loadingPlugins.delete(pluginId);
          this.state.errorPlugins.add(pluginId);
          pluginInfo.status = PluginStatus.ERROR;
          pluginInfo.error = result.error.message;
        }
        
        return result;
      } catch (error) {
        this.state.loadingPlugins.delete(pluginId);
        this.state.errorPlugins.add(pluginId);
        pluginInfo.status = PluginStatus.ERROR;
        pluginInfo.error = error instanceof Error ? error.message : String(error);
        
        return {
          success: false,
          error: new KernelError(
            `Failed to load plugin: ${pluginId}`,
            'PLUGIN_LOAD_ERROR',
            { pluginId, error: error instanceof Error ? error.message : String(error) }
          )
        };
      }
    } catch (error) {
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
      const pluginInfo = this.state.plugins.get(pluginId);
      if (!pluginInfo) {
        return {
          success: false,
          error: new KernelError(
            'Plugin not found',
            'PLUGIN_NOT_FOUND',
            { pluginId }
          )
        };
      }

      // 使用 Kernel 层纯函数卸载插件
      const result = unloadPlugin(pluginInfo);
      
      if (result.success) {
        // 更新插件状态
        this.state.enabledPlugins.delete(pluginId);
        this.state.disabledPlugins.add(pluginId);
        this.state.loadingPlugins.delete(pluginId);
        this.state.errorPlugins.delete(pluginId);
        
        // 更新插件信息
        pluginInfo.status = PluginStatus.UNLOADED;
        pluginInfo.enabled = false;
        pluginInfo.loadTime = undefined;
        pluginInfo.error = undefined;
        
        // 发射事件
        this.eventEmitter.emit(PluginServiceEventType.PLUGIN_UNLOADED, {
          pluginId
        });
      } else {
        pluginInfo.status = PluginStatus.ERROR;
        pluginInfo.error = result.error.message;
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to unload plugin: ${pluginId}`,
          'PLUGIN_UNLOAD_ERROR',
          { pluginId, error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 启用插件
   */
  async enablePlugin(pluginId: string): Promise<Result<void, KernelError>> {
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

      if (plugin.enabled) {
        return {
          success: false,
          error: new KernelError(
            'Plugin is already enabled',
            'PLUGIN_ALREADY_ENABLED',
            { pluginId }
          )
        };
      }

      // 更新插件状态
      plugin.enabled = true;
      plugin.status = PluginStatus.ENABLED;
      this.state.enabledPlugins.add(pluginId);
      this.state.disabledPlugins.delete(pluginId);
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(PluginServiceEventType.PLUGIN_ENABLED, {
        pluginId,
        pluginInfo: plugin,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      const kernelError = new KernelError(
        `Failed to enable plugin: ${pluginId}`,
        'PLUGIN_ENABLE_ERROR',
        { pluginId, error: error instanceof Error ? error.message : String(error) }
      );
      
      this.emitError('PLUGIN_ENABLE_ERROR', kernelError.message, { pluginId, ...kernelError.details });
      
      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 禁用插件
   */
  async disablePlugin(pluginId: string): Promise<Result<void, KernelError>> {
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

      if (!plugin.enabled) {
        return {
          success: false,
          error: new KernelError(
            'Plugin is already disabled',
            'PLUGIN_ALREADY_DISABLED',
            { pluginId }
          )
        };
      }

      // 更新插件状态
      plugin.enabled = false;
      plugin.status = PluginStatus.DISABLED;
      this.state.enabledPlugins.delete(pluginId);
      this.state.disabledPlugins.add(pluginId);
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(PluginServiceEventType.PLUGIN_DISABLED, {
        pluginId,
        pluginInfo: plugin,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      const kernelError = new KernelError(
        `Failed to disable plugin: ${pluginId}`,
        'PLUGIN_DISABLE_ERROR',
        { pluginId, error: error instanceof Error ? error.message : String(error) }
      );
      
      this.emitError('PLUGIN_DISABLE_ERROR', kernelError.message, { pluginId, ...kernelError.details });
      
      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 搜索插件
   */
  searchPlugins(options: PluginSearchOptions = {}): PluginSearchResult {
    let plugins = Array.from(this.state.plugins.values());

    // 按查询字符串过滤
    if (options.query) {
      const query = options.query.toLowerCase();
      plugins = plugins.filter(plugin =>
        plugin.name.toLowerCase().includes(query) ||
        plugin.description?.toLowerCase().includes(query) ||
        plugin.id.toLowerCase().includes(query)
      );
    }

    // 按类型过滤
    if (options.type) {
      plugins = plugins.filter(plugin => plugin.type === options.type);
    }

    // 按状态过滤
    if (options.status) {
      plugins = plugins.filter(plugin => plugin.status === options.status);
    }

    // 按启用状态过滤
    if (options.enabled !== undefined) {
      plugins = plugins.filter(plugin => plugin.enabled === options.enabled);
    }

    // 分页
    const offset = options.offset || 0;
    const limit = options.limit || plugins.length;
    const paginatedPlugins = plugins.slice(offset, offset + limit);

    return {
      plugins: paginatedPlugins,
      total: plugins.length,
      hasMore: offset + limit < plugins.length,
      query: options.query || ''
    };
  }

  /**
   * 获取插件统计信息
   */
  getStatistics(): PluginStatistics {
    const totalPlugins = this.state.plugins.size;
    const enabledPlugins = this.state.enabledPlugins.size;
    const disabledPlugins = this.state.disabledPlugins.size;
    const loadingPlugins = this.state.loadingPlugins.size;
    const errorPlugins = this.state.errorPlugins.size;
    
    const loadTimes = Array.from(this.state.plugins.values())
      .map(plugin => plugin.loadTime)
      .filter((time): time is number => time !== undefined);
    const averageLoadTime = loadTimes.length > 0 
      ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
      : 0;

    return {
      totalPlugins,
      enabledPlugins,
      disabledPlugins,
      loadingPlugins,
      errorPlugins,
      averageLoadTime: Math.round(averageLoadTime * 100) / 100,
      lastLoadTime: this.state.lastUpdated
    };
  }

  /**
   * 获取插件服务状态
   */
  getState(): PluginServiceState {
    return {
      plugins: new Map(this.state.plugins),
      enabledPlugins: new Set(this.state.enabledPlugins),
      disabledPlugins: new Set(this.state.disabledPlugins),
      loadingPlugins: new Set(this.state.loadingPlugins),
      errorPlugins: new Set(this.state.errorPlugins),
      isInitialized: this.state.isInitialized,
      lastUpdated: this.state.lastUpdated
    };
  }

  /**
   * 监听插件事件
   */
  on(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * 取消监听插件事件
   */
  off(event: PluginServiceEventType, listener: (data: PluginEventData) => void): void {
    this.eventEmitter.off(event, listener);
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

  /**
   * 创建插件环境
   */
  private createPluginEnvironment() {
    return {
      log: {
        info: (message: string, ...args: any[]) => {
          console.log(`[Plugin] ${message}`, ...args);
        },
        warn: (message: string, ...args: any[]) => {
          console.warn(`[Plugin] ${message}`, ...args);
        },
        error: (message: string, ...args: any[]) => {
          console.error(`[Plugin] ${message}`, ...args);
        }
      },
      events: {
        on: <T = any>(event: string, listener: (data: T) => void) => {
          return this.eventEmitter.on(event, listener);
        },
        off: (event: string, listenerId: string) => {
          this.eventEmitter.off(event, listenerId);
        },
        emit: <T = any>(event: string, data: T) => {
          this.eventEmitter.emit(event, data);
        }
      }
    };
  }
}

/**
 * 创建插件服务实例
 */
export function createPluginService(options: PluginServiceOptions = DEFAULT_PLUGIN_SERVICE_OPTIONS): PluginService {
  return new PluginService(options);
}

/**
 * 默认插件服务配置
 */
export const DEFAULT_PLUGIN_SERVICE_CONFIG: PluginServiceOptions = DEFAULT_PLUGIN_SERVICE_OPTIONS;
