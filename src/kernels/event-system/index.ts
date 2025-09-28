/**
 * 事件系统 Kernel 模块
 * 提供与业务解耦的事件系统能力
 */

export { EventEmitter } from './event-emitter';
export { EventType } from './types';
export type { 
  EventSystem, 
  EventListener, 
  EventListenerOptions, 
  EventListenerInfo 
} from './types';

