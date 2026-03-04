/**
 * 插件系统 Kernel 模块类型定义
 * 提供与业务完全解耦的通用插件系统类型
 * 支持泛型，让使用者可以定义自己的插件类型和环境
 */

/**
 * 插件兼容性检查函数类型
 */
export type PluginCompatibilityChecker<TEnvironment = any> = (environment: TEnvironment) => boolean;

/**
 * 通用插件接口定义
 * 支持泛型，让使用者可以定义自己的插件类型
 */
export interface Plugin<TEnvironment = any> {
  /**
   * 插件名称
   */
  name: string;
  
  /**
   * 插件版本
   */
  version: string;
  
  /**
   * 插件初始化函数
   * @param environment 插件运行环境
   */
  init: (environment: TEnvironment) => void;
  
  /**
   * 插件销毁函数
   */
  destroy?: () => void;
  
  /**
   * 插件兼容性检查函数（可选）
   * @param environment 目标环境
   * @returns 是否兼容
   */
  checkCompatibility?: PluginCompatibilityChecker<TEnvironment>;
}

/**
 * 通用插件环境接口
 * 支持泛型，让使用者可以定义自己的环境类型
 */
export interface PluginEnvironment<TEventType extends string = string> {
  // 基础日志能力
  log: {
    info: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
  };
  
  // 基础事件能力（使用泛型事件类型）
  events: {
    on: <T = any>(event: TEventType, listener: (data: T) => void) => string;
    off: (event: TEventType, listenerId: string) => void;
    emit: <T = any>(event: TEventType, data: T) => void;
  };
}

/**
 * 通用插件加载选项
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
}