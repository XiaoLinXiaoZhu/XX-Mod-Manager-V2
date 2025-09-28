/**
 * 插件加载器
 * 提供插件加载、管理和验证功能
 */

import { 
  Plugin, 
  PluginStatus, 
  PluginLoadOptions, 
  PluginLoadResult, 
  PluginStatistics,
  PluginEnvironment 
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { TauriFileSystem } from '@/kernels/file-system';
import { EventEmitter } from '@/kernels/event-system';
import { createPluginEnvironment } from './plugin-environment';

/**
 * 插件加载器类
 */
export class PluginLoader {
  private plugins = new Map<string, Plugin>();
  private pluginStatus = new Map<string, PluginStatus>();
  private pluginConfig = new Map<string, Record<string, any>>();
  private disabledPlugins = new Set<string>();
  private fileSystem: TauriFileSystem;
  private eventEmitter: EventEmitter;
  private environment: PluginEnvironment;

  constructor(
    fileSystem: TauriFileSystem,
    eventEmitter: EventEmitter,
    configManager: {
      get: (key: string) => any;
      set: (key: string, value: any) => void;
      has: (key: string) => boolean;
    }
  ) {
    this.fileSystem = fileSystem;
    this.eventEmitter = eventEmitter;
    this.environment = createPluginEnvironment(fileSystem, eventEmitter, configManager);
  }

  /**
   * 加载插件
   * @param plugin 插件定义
   * @param options 加载选项
   * @returns 加载结果
   */
  async loadPlugin(plugin: Plugin, options: PluginLoadOptions = {}): Promise<Result<PluginLoadResult, KernelError>> {
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
      
      // 保存配置
      if (options.config) {
        this.pluginConfig.set(plugin.name, options.config);
      }

      const loadTime = Date.now() - startTime;
      const result: PluginLoadResult = {
        name: plugin.name,
        success: true,
        loadTime
      };

      // 触发插件加载事件
      this.eventEmitter.emit('plugin:loaded', result);

      return { success: true, data: result };

    } catch (error) {
      this.pluginStatus.set(plugin.name, 'error');
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
   * 从文件加载插件
   * @param filePath 插件文件路径
   * @param options 加载选项
   * @returns 加载结果
   */
  async loadPluginFromFile(filePath: string, options: PluginLoadOptions = {}): Promise<Result<PluginLoadResult, KernelError>> {
    try {
      // 检查文件是否存在
      if (!await this.fileSystem.exists(filePath)) {
        return {
          success: false,
          error: new KernelError(
            `Plugin file not found: ${filePath}`,
            'PLUGIN_FILE_NOT_FOUND',
            { filePath }
          )
        };
      }

      // 动态导入插件
      const pluginModule = await import(filePath);
      const plugin = pluginModule.default || pluginModule;

      // 验证插件结构
      if (!plugin || typeof plugin !== 'object' || !plugin.name || !plugin.init) {
        return {
          success: false,
          error: new KernelError(
            `Invalid plugin structure in file: ${filePath}`,
            'PLUGIN_INVALID_STRUCTURE',
            { filePath }
          )
        };
      }

      return await this.loadPlugin(plugin, options);

    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to load plugin from file: ${filePath}`,
          'PLUGIN_FILE_LOAD_ERROR',
          { 
            filePath, 
            error: error instanceof Error ? error.message : String(error) 
          }
        )
      };
    }
  }

  /**
   * 从目录加载所有插件
   * @param directory 插件目录
   * @param options 加载选项
   * @returns 加载结果列表
   */
  async loadPluginsFromDirectory(directory: string, options: PluginLoadOptions = {}): Promise<Result<PluginLoadResult[], KernelError>> {
    try {
      // 检查目录是否存在
      if (!await this.fileSystem.exists(directory)) {
        await this.fileSystem.createDirectory(directory);
      }

      // 列出目录中的文件
      const files = await this.fileSystem.listDirectory(directory);
      const jsFiles = files.filter(file => file.endsWith('.js'));

      const results: PluginLoadResult[] = [];
      const errors: KernelError[] = [];

      // 并行加载所有插件
      const loadPromises = jsFiles.map(async (file) => {
        const filePath = `${directory}/${file}`;
        const result = await this.loadPluginFromFile(filePath, options);
        
        if (result.success) {
          results.push(result.data);
        } else {
          errors.push(result.error);
        }
      });

      await Promise.all(loadPromises);

      if (errors.length > 0) {
        return {
          success: false,
          error: new KernelError(
            `Failed to load some plugins from directory: ${directory}`,
            'PLUGIN_DIRECTORY_LOAD_ERROR',
            { directory, errors: errors.map(e => e.message) }
          )
        };
      }

      return { success: true, data: results };

    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          `Failed to load plugins from directory: ${directory}`,
          'PLUGIN_DIRECTORY_LOAD_ERROR',
          { 
            directory, 
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
  async unloadPlugin(pluginName: string): Promise<Result<void, KernelError>> {
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

    try {
      // 触发插件卸载事件
      this.eventEmitter.emit('plugin:unloading', { name: pluginName });

      // 移除插件
      this.plugins.delete(pluginName);
      this.pluginStatus.delete(pluginName);
      this.pluginConfig.delete(pluginName);

      // 触发插件卸载完成事件
      this.eventEmitter.emit('plugin:unloaded', { name: pluginName });

      return { success: true, data: undefined };

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
  async enablePlugin(pluginName: string): Promise<Result<void, KernelError>> {
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

    // 触发插件启用事件
    this.eventEmitter.emit('plugin:enabled', { name: pluginName });

    return { success: true, data: undefined };
  }

  /**
   * 禁用插件
   * @param pluginName 插件名称
   * @returns 禁用结果
   */
  async disablePlugin(pluginName: string): Promise<Result<void, KernelError>> {
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

    // 触发插件禁用事件
    this.eventEmitter.emit('plugin:disabled', { name: pluginName });

    return { success: true, data: undefined };
  }

  /**
   * 获取插件
   * @param pluginName 插件名称
   * @returns 插件实例
   */
  getPlugin(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  /**
   * 获取所有插件
   * @returns 插件列表
   */
  getAllPlugins(): Plugin[] {
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
    const enabled = Array.from(this.pluginStatus.values()).filter(status => status === 'enabled').length;
    const disabled = Array.from(this.pluginStatus.values()).filter(status => status === 'disabled').length;
    const error = Array.from(this.pluginStatus.values()).filter(status => status === 'error').length;

    const byScope = {
      global: 0,
      local: 0,
      all: 0
    };

    for (const plugin of this.plugins.values()) {
      byScope[plugin.scope]++;
    }

    return {
      total,
      enabled,
      disabled,
      error,
      byScope
    };
  }

  /**
   * 验证插件
   * @param plugin 插件定义
   * @returns 验证结果
   */
  private validatePlugin(plugin: Plugin): Result<void, KernelError> {
    if (!plugin.name || typeof plugin.name !== 'string') {
      return {
        success: false,
        error: new KernelError(
          'Plugin name is required and must be a string',
          'PLUGIN_INVALID_NAME',
          { plugin }
        )
      };
    }

    if (!plugin.scope || !['global', 'local', 'all'].includes(plugin.scope)) {
      return {
        success: false,
        error: new KernelError(
          'Plugin scope must be one of: global, local, all',
          'PLUGIN_INVALID_SCOPE',
          { plugin }
        )
      };
    }

    if (!plugin.init || typeof plugin.init !== 'function') {
      return {
        success: false,
        error: new KernelError(
          'Plugin init function is required',
          'PLUGIN_INVALID_INIT',
          { plugin }
        )
      };
    }

    return { success: true, data: undefined };
  }
}
