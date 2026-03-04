/**
 * 状态管理 Kernel 类型定义
 */

// 状态订阅者
export type StateSubscriber<T> = (state: T) => void;

// 状态更新函数
export type StateUpdater<T> = (currentState: T) => T;

// 状态存储接口
export interface StateStore<T> {
  getState(): T;
  setState(newState: T): void;
  updateState(updater: StateUpdater<T>): void;
  subscribe(listener: StateSubscriber<T>): () => void;
  getSnapshot(): T;
}

// 状态管理器选项
export interface StateManagerOptions<T> {
  initialState: T;
  name?: string;
  persist?: boolean;
  storageKey?: string;
}

// 状态变更信息
export interface StateChangeInfo<T> {
  previousState: T;
  newState: T;
  timestamp: Date;
  source: string;
}

// 状态管理器接口
export interface StateManager<T> extends StateStore<T> {
  readonly name: string;
  readonly isPersisted: boolean;
  reset(): void;
  destroy(): void;
  getChangeHistory(): StateChangeInfo<T>[];
  onStateChange(listener: (info: StateChangeInfo<T>) => void): () => void;
}

// 状态选择器
export type StateSelector<T, R> = (state: T) => R;

// 状态比较函数
export type StateComparator<T> = (a: T, b: T) => boolean;
