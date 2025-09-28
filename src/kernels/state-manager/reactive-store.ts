/**
 * 响应式状态存储实现
 * 基于 Vue 3 的响应式系统，提供类型安全的状态管理
 */

import { ref, computed, watch, type Ref } from 'vue';
import { StateManager, StateChangeInfo, StateSubscriber, StateUpdater } from './types';
import { KernelError } from '../types';

/**
 * 响应式状态存储实现类
 * 提供类型安全、响应式的状态管理
 */
export class ReactiveStore<T> implements StateManager<T> {
  private _state: Ref<T>;
  private _subscribers = new Set<StateSubscriber<T>>();
  private _changeListeners = new Set<(info: StateChangeInfo<T>) => void>();
  private _changeHistory: StateChangeInfo<T>[] = [];
  private _maxHistorySize = 100;

  constructor(
    public readonly name: string,
    initialState: T,
    public readonly isPersisted: boolean = false
  ) {
    this._state = ref(initialState) as Ref<T>;
    
    // 监听状态变化
    watch(
      this._state,
      (newState, oldState) => {
        const changeInfo: StateChangeInfo<T> = {
          previousState: oldState as T,
          newState: newState as T,
          timestamp: new Date(),
          source: 'internal'
        };
        
        this._addToHistory(changeInfo);
        this._notifyChangeListeners(changeInfo);
        this._notifySubscribers(newState as T);
      },
      { deep: true }
    );
  }

  /**
   * 获取当前状态
   */
  getState(): T {
    return this._state.value;
  }

  /**
   * 设置新状态
   */
  setState(newState: T): void {
    this._state.value = newState;
  }

  /**
   * 更新状态
   */
  updateState(updater: StateUpdater<T>): void {
    const newState = updater(this._state.value);
    this.setState(newState);
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: StateSubscriber<T>): () => void {
    this._subscribers.add(listener);
    
    // 立即调用一次监听器
    listener(this._state.value);
    
    // 返回取消订阅函数
    return () => {
      this._subscribers.delete(listener);
    };
  }

  /**
   * 获取状态快照
   */
  getSnapshot(): T {
    return JSON.parse(JSON.stringify(this._state.value));
  }

  /**
   * 重置状态
   */
  reset(): void {
    throw new KernelError(
      'Reset method not implemented. Override in subclass.',
      'METHOD_NOT_IMPLEMENTED',
      { method: 'reset' }
    );
  }

  /**
   * 销毁状态管理器
   */
  destroy(): void {
    this._subscribers.clear();
    this._changeListeners.clear();
    this._changeHistory = [];
  }

  /**
   * 获取状态变更历史
   */
  getChangeHistory(): StateChangeInfo<T>[] {
    return [...this._changeHistory];
  }

  /**
   * 监听状态变更
   */
  onStateChange(listener: (info: StateChangeInfo<T>) => void): () => void {
    this._changeListeners.add(listener);
    
    return () => {
      this._changeListeners.delete(listener);
    };
  }

  /**
   * 创建计算属性
   */
  createComputed<R>(selector: (state: T) => R) {
    return computed(() => selector(this._state.value));
  }

  /**
   * 创建选择器
   */
  createSelector<R>(selector: (state: T) => R) {
    return () => selector(this._state.value);
  }

  /**
   * 通知订阅者
   */
  private _notifySubscribers(state: T): void {
    this._subscribers.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * 通知变更监听器
   */
  private _notifyChangeListeners(changeInfo: StateChangeInfo<T>): void {
    this._changeListeners.forEach(listener => {
      try {
        listener(changeInfo);
      } catch (error) {
        console.error('Error in state change listener:', error);
      }
    });
  }

  /**
   * 添加到变更历史
   */
  private _addToHistory(changeInfo: StateChangeInfo<T>): void {
    this._changeHistory.push(changeInfo);
    
    // 限制历史记录大小
    if (this._changeHistory.length > this._maxHistorySize) {
      this._changeHistory.shift();
    }
  }
}
