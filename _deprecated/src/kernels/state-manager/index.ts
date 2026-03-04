/**
 * 状态管理 Kernel 模块
 * 提供与业务解耦的状态管理能力
 */

export { ReactiveStore } from './reactive-store';
export type { 
  StateManager, 
  StateStore, 
  StateSubscriber, 
  StateUpdater,
  StateChangeInfo,
  StateManagerOptions,
  StateSelector,
  StateComparator
} from './types';
