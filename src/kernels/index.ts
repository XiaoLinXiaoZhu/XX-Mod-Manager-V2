/**
 * Kernel 层主入口
 * 提供与业务完全解耦的通用能力
 */

// 文件系统
export * from './file-system';

// 事件系统
export { EventEmitter, EventType, eventSystem } from './event-system';
export type { EventSystem, EventListener, EventListenerOptions, EventListenerInfo } from './event-system';

// 状态管理
export { ReactiveStore } from './state-manager';
export type { StateManager, StateStore, StateSubscriber, StateUpdater, StateChangeInfo, StateManagerOptions, StateSelector, StateComparator } from './state-manager';

// 配置存储
export * from './config-storage';

// 通用类型
export * from './types';

// 创建默认实例
import { fileSystem } from './file-system';
import { eventSystem } from './event-system';

/**
 * 默认文件系统实例
 */
export const defaultFileSystem = fileSystem;

/**
 * 默认事件系统实例
 */
export const defaultEventSystem = eventSystem;
