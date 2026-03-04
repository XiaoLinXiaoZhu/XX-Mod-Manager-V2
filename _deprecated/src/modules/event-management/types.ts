/**
 * 事件管理模块类型定义
 * 定义业务相关的事件类型和接口
 */

// 重新导出业务事件类型
export type {
  BusinessEventType,
  AppEventType,
  ConfigEventType,
  ModEventType,
  PresetEventType,
  CharacterEventType,
  PluginEventType,
  FileSystemEventType,
  WindowEventType,
  RouteEventType
} from './business-events';

// 导入 BusinessEventType 用于类型定义
import type { BusinessEventType } from './business-events';

// 为了向后兼容，保留 BusinessEvent 类型别名
export type BusinessEvent = BusinessEventType;

/**
 * 事件数据接口
 */
export interface EventData {
  [key: string]: any;
}

/**
 * 事件监听器接口
 */
export interface EventListener<T = any> {
  (data: T): void | Promise<void>;
}

/**
 * 事件管理器接口
 * 支持泛型事件类型，让使用者可以定义自己的事件类型
 */
export interface EventManager<TEventType extends string = BusinessEventType> {
  /**
   * 注册事件监听器
   */
  on<T = any>(event: TEventType, listener: EventListener<T>): string;
  
  /**
   * 移除事件监听器
   */
  off(event: TEventType, listenerId: string): void;
  
  /**
   * 发射事件
   */
  emit<T = any>(event: TEventType, data: T): void;
  
  /**
   * 异步发射事件
   */
  emitAsync<T = any>(event: TEventType, data: T): Promise<void>;
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: TEventType): void;
  
  /**
   * 获取监听器数量
   */
  getListenerCount(event: TEventType): number;
  
  /**
   * 检查是否有监听器
   */
  hasListeners(event: TEventType): boolean;
}
