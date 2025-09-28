/**
 * 事件系统 Kernel 模块
 * 提供与业务解耦的通用事件系统能力
 * 支持泛型事件类型，让使用者可以定义自己的事件类型
 */

export { EventEmitter } from './event-emitter';
export { SYSTEM_EVENTS } from './types';
export type { 
  EventSystem,
  EventListener, 
  EventListenerOptions, 
  EventListenerInfo,
  SystemEventType
} from './types';

// 为了向后兼容，导出 EventType 作为 SystemEventType 的别名
import { SYSTEM_EVENTS } from './types';
export type EventType = typeof SYSTEM_EVENTS[keyof typeof SYSTEM_EVENTS];

