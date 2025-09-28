/**
 * Mod 搜索管理器
 * 负责 Mod 的搜索、过滤和冲突检测
 */

import { ModInfo } from '@/modules/mod-management';
import { ModServiceState } from './types';
import { EventEmitter, ReactiveStore } from '@/kernels';
import { searchModsEffect, detectConflictsEffect } from './effect';

/**
 * Mod 搜索管理器类
 */
export class ModSearch {
  private stateStore: ReactiveStore<ModServiceState>;
  private eventSystem: EventEmitter;

  constructor(
    stateStore: ReactiveStore<ModServiceState>,
    eventSystem: EventEmitter
  ) {
    this.stateStore = stateStore;
    this.eventSystem = eventSystem;
  }

  /**
   * 搜索 Mod
   */
  searchMods(query: string): ModInfo[] {
    return searchModsEffect(this.getState().mods, { query });
  }

  /**
   * 检测冲突
   */
  async detectConflicts(): Promise<void> {
    try {
      await detectConflictsEffect(this.getState().mods, this.eventSystem);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(modId: string, _resolution: 'keep' | 'replace'): Promise<{
    success: boolean;
    message: string;
    modId: string;
  }> {
    // 这里应该实现冲突解决逻辑
    // 目前返回一个占位符结果
    return {
      success: true,
      message: `Conflict resolved for mod: ${modId}`,
      modId
    };
  }

  /**
   * 获取当前状态
   */
  private getState(): ModServiceState {
    return this.stateStore.getState();
  }
}
