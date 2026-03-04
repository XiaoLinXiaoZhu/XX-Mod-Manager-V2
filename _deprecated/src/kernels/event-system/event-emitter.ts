/**
 * 事件发射器实现
 * 提供类型安全的事件系统
 */

import type { EventSystem, EventListener, EventListenerInfo, EventListenerOptions } from './types';

/**
 * 事件发射器实现类
 * 提供类型安全、高性能的事件系统
 * 支持泛型事件类型，让使用者可以定义自己的事件类型
 */
export class EventEmitter<TEventType extends string = string> implements EventSystem<TEventType> {
  private listeners = new Map<string, Map<string, EventListenerInfo>>();
  private listenerCounter = 0;

  /**
   * 注册事件监听器
   */
  on<T = any>(
    event: TEventType, 
    listener: EventListener<T>, 
    options: EventListenerOptions = {}
  ): string {
    const listenerId = this.generateListenerId();
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    
    const eventListeners = this.listeners.get(event)!;
    eventListeners.set(listenerId, {
      listener: listener as EventListener,
      options: { priority: 0, ...options },
      id: listenerId
    });
    
    return listenerId;
  }

  /**
   * 移除事件监听器
   */
  off(event: TEventType, listenerId: string): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listenerId);
      if (eventListeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * 发射事件
   */
  emit<T = any>(event: TEventType, data: T): void {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return;
    }

    // 按优先级排序监听器
    const sortedListeners = Array.from(eventListeners.values())
      .sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    for (const listenerInfo of sortedListeners) {
      try {
        listenerInfo.listener(data);
        
        // 如果是一次性监听器，则移除
        if (listenerInfo.options.once) {
          this.off(event, listenerInfo.id);
        }
      } catch (error) {
        // 发射错误事件，但不中断其他监听器的执行
        // 使用类型断言来处理泛型约束
        this.emit('error:occurred' as TEventType, {
          event,
          listenerId: listenerInfo.id,
          error: error instanceof Error ? error : new Error(String(error))
        });
      }
    }
  }

  /**
   * 注册一次性事件监听器
   */
  once<T = any>(event: TEventType, listener: EventListener<T>): string {
    return this.on(event, listener, { once: true });
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: TEventType): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取指定事件的监听器数量
   */
  getListenerCount(event: TEventType): number {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? eventListeners.size : 0;
  }

  /**
   * 获取所有事件名称
   */
  getEventNames(): TEventType[] {
    return Array.from(this.listeners.keys()) as TEventType[];
  }

  /**
   * 生成唯一的监听器 ID
   */
  private generateListenerId(): string {
    return `listener_${++this.listenerCounter}_${Date.now()}`;
  }

  /**
   * 获取指定事件的所有监听器信息
   */
  getListeners(event: TEventType): EventListenerInfo[] {
    const eventListeners = this.listeners.get(event);
    return eventListeners ? Array.from(eventListeners.values()) : [];
  }

  /**
   * 检查是否有指定事件的监听器
   */
  hasListeners(event: TEventType): boolean {
    return this.getListenerCount(event) > 0;
  }
}
