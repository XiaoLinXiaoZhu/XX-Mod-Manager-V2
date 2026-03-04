/**
 * 事件系统 Kernel 类型定义
 */

// 事件监听器类型
export type EventListener<T = any> = (data: T) => void;

// 事件监听器选项
export interface EventListenerOptions {
  once?: boolean;
  priority?: number;
}

// 事件监听器信息
export interface EventListenerInfo<T = any> {
  listener: EventListener<T>;
  options: EventListenerOptions;
  id: string;
}

// 通用事件系统接口 - 支持泛型事件类型
export interface EventSystem<TEventType extends string = string> {
  on<T = any>(event: TEventType, listener: EventListener<T>, options?: EventListenerOptions): string;
  off(event: TEventType, listenerId: string): void;
  emit<T = any>(event: TEventType, data: T): void;
  once<T = any>(event: TEventType, listener: EventListener<T>): string;
  removeAllListeners(event?: TEventType): void;
  getListenerCount(event: TEventType): number;
  getEventNames(): TEventType[];
}

// 系统级事件类型（仅用于 Kernel 内部）
export const SYSTEM_EVENTS = {
  SYSTEM_START: 'system:start',
  SYSTEM_READY: 'system:ready',
  SYSTEM_SHUTDOWN: 'system:shutdown',
  ERROR_OCCURRED: 'error:occurred',
  WARNING_OCCURRED: 'warning:occurred',
} as const;

export type SystemEventType = typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS];
