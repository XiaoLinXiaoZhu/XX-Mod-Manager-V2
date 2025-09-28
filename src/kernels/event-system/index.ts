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

