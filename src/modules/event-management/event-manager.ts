/**
 * 事件管理器实现
 * 提供业务事件的管理功能
 */

import { 
  BusinessEvent, 
  EventData, 
  EventListener, 
  EventManager,
  AppLifecycleEvent,
  PluginEvent,
  StateChangeEvent,
  ModOperationEvent,
  WindowEvent,
  RouteEvent
} from './types';
import { EventEmitter } from '@/kernels/event-system';

/**
 * 业务事件管理器实现
 */
export class BusinessEventManager implements EventManager {
  private eventEmitter: EventEmitter;
  private listenerMap = new Map<string, string>(); // 业务事件名 -> 监听器ID的映射

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * 注册事件监听器
   */
  on<T = any>(event: BusinessEvent, listener: EventListener<T>): string {
    const listenerId = this.eventEmitter.on(event, listener);
    this.listenerMap.set(event, listenerId);
    return listenerId;
  }

  /**
   * 移除事件监听器
   */
  off(event: BusinessEvent, listenerId: string): void {
    this.eventEmitter.off(event, listenerId);
    this.listenerMap.delete(event);
  }

  /**
   * 发射事件
   */
  emit<T = any>(event: BusinessEvent, data: T): void {
    this.eventEmitter.emit(event, data);
  }

  /**
   * 异步发射事件
   */
  async emitAsync<T = any>(event: BusinessEvent, data: T): Promise<void> {
    // 对于异步事件，我们需要特殊处理
    // 这里先使用同步方式，后续可以扩展为真正的异步处理
    this.eventEmitter.emit(event, data);
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: BusinessEvent): void {
    if (event) {
      this.eventEmitter.removeAllListeners(event);
      this.listenerMap.delete(event);
    } else {
      this.eventEmitter.removeAllListeners();
      this.listenerMap.clear();
    }
  }

  /**
   * 获取监听器数量
   */
  getListenerCount(event: BusinessEvent): number {
    return this.eventEmitter.getListenerCount(event);
  }

  /**
   * 检查是否有监听器
   */
  hasListeners(event: BusinessEvent): boolean {
    return this.eventEmitter.hasListeners(event);
  }
}

/**
 * 创建业务事件管理器
 * @param eventEmitter 底层事件发射器
 * @returns 业务事件管理器实例
 */
export function createBusinessEventManager(eventEmitter: EventEmitter): BusinessEventManager {
  return new BusinessEventManager(eventEmitter);
}
