/**
 * 业务插件管理模块类型定义
 * 定义与具体业务相关的插件类型和管理逻辑
 */

import type { Plugin, PluginEnvironment, PluginLoadOptions, PluginLoadResult, PluginStatistics } from '@/kernels/plugin';

/**
 * 业务插件作用域
 */
export type BusinessPluginScope = 'global' | 'local' | 'all';

/**
 * 业务插件接口
 * 扩展基础插件接口，添加业务特定的属性
 */
export interface BusinessPlugin<TEnvironment = any> extends Plugin<TEnvironment> {
  /**
   * 插件显示名称，用于多语言支持
   */
  displayName?: string;
  
  /**
   * 插件作用域
   * - global: 全局插件，影响所有项目
   * - local: 局部插件，只影响当前项目
   * - all: 同时影响全局和局部
   */
  scope: BusinessPluginScope;
  
  /**
   * 插件描述
   */
  description?: string;
  
  /**
   * 插件作者
   */
  author?: string;
  
  /**
   * 插件依赖
   */
  dependencies?: string[];
  
  /**
   * 插件配置
   */
  config?: Record<string, any>;
}

/**
 * 业务插件环境接口
 * 扩展基础插件环境，添加业务特定的API
 */
export interface BusinessPluginEnvironment<TEventType extends string = string> extends PluginEnvironment<TEventType> {
  // 文件系统操作
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    createDirectory: (path: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
    deleteFile: (path: string) => Promise<void>;
    copyFile: (from: string, to: string) => Promise<void>;
    moveFile: (from: string, to: string) => Promise<void>;
  };
  
  // 配置管理
  config: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    has: (key: string) => boolean;
    delete: (key: string) => void;
    getAll: () => Record<string, any>;
  };
  
  // 通知系统
  notification: {
    show: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showWarning: (message: string) => void;
    showInfo: (message: string) => void;
  };
}

/**
 * 业务插件加载选项
 */
export interface BusinessPluginLoadOptions extends PluginLoadOptions {
  /**
   * 插件作用域
   */
  scope?: BusinessPluginScope;
  
  /**
   * 插件配置
   */
  config?: Record<string, any>;
  
  /**
   * 是否自动启用
   */
  autoEnable?: boolean;
}

/**
 * 业务插件加载结果
 */
export interface BusinessPluginLoadResult extends PluginLoadResult {
  /**
   * 插件作用域
   */
  scope: BusinessPluginScope;
  
  /**
   * 插件配置
   */
  config?: Record<string, any>;
}

/**
 * 业务插件统计信息
 */
export interface BusinessPluginStatistics extends PluginStatistics {
  /**
   * 按作用域分类
   */
  byScope: {
    global: number;
    local: number;
    all: number;
  };
  
  /**
   * 按状态分类
   */
  byStatus: {
    enabled: number;
    disabled: number;
    loading: number;
    error: number;
  };
}

/**
 * 插件作用域上下文
 */
export interface PluginScopeContext {
  /**
   * 当前页面
   */
  currentPage: string;
  
  /**
   * 全局禁用的插件列表
   */
  globalDisabledPlugins: string[];
  
  /**
   * 局部禁用的插件列表
   */
  localDisabledPlugins: string[];
}

/**
 * 业务插件管理器接口
 */
export interface BusinessPluginManager<TPlugin extends BusinessPlugin<TEnvironment>, TEnvironment extends BusinessPluginEnvironment = BusinessPluginEnvironment> {
  /**
   * 加载插件
   */
  loadPlugin(plugin: TPlugin, options?: BusinessPluginLoadOptions): Promise<PluginLoadResult>;
  
  /**
   * 卸载插件
   */
  unloadPlugin(pluginName: string): Promise<boolean>;
  
  /**
   * 启用插件
   */
  enablePlugin(pluginName: string): boolean;
  
  /**
   * 禁用插件
   */
  disablePlugin(pluginName: string): boolean;
  
  /**
   * 获取插件
   */
  getPlugin(pluginName: string): TPlugin | undefined;
  
  /**
   * 获取所有插件
   */
  getAllPlugins(): TPlugin[];
  
  /**
   * 获取插件状态
   */
  getPluginStatus(pluginName: string): string | undefined;
  
  /**
   * 获取插件统计信息
   */
  getStatistics(): BusinessPluginStatistics;
  
  /**
   * 检查插件是否可以启用
   */
  canPluginBeEnabled(pluginName: string, context: PluginScopeContext): boolean;
  
  /**
   * 验证插件作用域
   */
  validatePluginScope(plugin: TPlugin, context: PluginScopeContext): boolean;
}
