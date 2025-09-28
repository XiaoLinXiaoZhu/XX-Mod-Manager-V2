/**
 * 插件系统 Kernel 模块类型定义
 * 提供与业务解耦的插件系统类型
 */

import { TranslatedText } from '@/shared/types/local';
import { SettingBarData } from '@/compat/legacy-bridge';

/**
 * 插件作用域
 */
export type PluginScope = 'global' | 'local' | 'all';

/**
 * 插件状态
 */
export type PluginStatus = 'enabled' | 'disabled' | 'loading' | 'error';

/**
 * 插件配置数据类型
 */
export type PluginData = SettingBarData;

/**
 * 插件接口定义
 */
export interface Plugin {
  /**
   * 插件名称
   */
  name: string;
  
  /**
   * 插件显示名称，用于多语言支持
   */
  displayName?: TranslatedText;
  
  /**
   * 插件作用域
   * - global: 全局插件，影响所有项目
   * - local: 局部插件，只影响当前项目
   * - all: 同时影响全局和局部
   */
  scope: PluginScope;
  
  /**
   * 插件初始化函数
   * @param environment 可以在插件中使用的工具
   */
  init: (environment: PluginEnvironment) => void;
}

/**
 * 插件环境接口
 * 提供给插件使用的工具和API
 */
export interface PluginEnvironment {
  // 文件系统操作
  fs: {
    readFile: (path: string) => Promise<string>;
    writeFile: (path: string, content: string) => Promise<void>;
    exists: (path: string) => Promise<boolean>;
    createDirectory: (path: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
  };
  
  // 事件系统
  events: {
    on: (event: string, listener: (...args: any[]) => void) => string;
    off: (event: string, listenerId: string) => void;
    emit: (event: string, data: any) => void;
  };
  
  // 配置管理
  config: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    has: (key: string) => boolean;
  };
  
  // 日志系统
  log: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
}

/**
 * 插件加载选项
 */
export interface PluginLoadOptions {
  /**
   * 是否启用插件
   */
  enabled?: boolean;
  
  /**
   * 插件优先级
   */
  priority?: number;
  
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
 * 插件加载结果
 */
export interface PluginLoadResult {
  /**
   * 插件名称
   */
  name: string;
  
  /**
   * 加载是否成功
   */
  success: boolean;
  
  /**
   * 错误信息
   */
  error?: string;
  
  /**
   * 加载时间（毫秒）
   */
  loadTime: number;
}

/**
 * 插件统计信息
 */
export interface PluginStatistics {
  /**
   * 总插件数
   */
  total: number;
  
  /**
   * 已启用插件数
   */
  enabled: number;
  
  /**
   * 已禁用插件数
   */
  disabled: number;
  
  /**
   * 错误插件数
   */
  error: number;
  
  /**
   * 按作用域分类
   */
  byScope: {
    global: number;
    local: number;
    all: number;
  };
}
