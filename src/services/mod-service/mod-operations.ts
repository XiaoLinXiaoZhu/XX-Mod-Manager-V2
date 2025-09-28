/**
 * Mod 操作管理器
 * 负责 Mod 的增删改查等基本操作
 */

import { ModStatus } from '@/modules/mod-management';
import type { ModInfo, ModOperationResult } from '@/modules/mod-management';
import { ModServiceEvent } from './types';
import type { ModServiceState, ModServiceConfig } from './types';
import { TauriFileSystem, EventEmitter } from '@/kernels';
import { ReactiveStore } from '@/kernels';

import { applyModEffect, removeModEffect, refreshModEffect, addModToListEffect, removeModFromListEffect } from './effect';
import { updateModStatusEffect } from './effect';


/**
 * Mod 操作管理器类
 */
export class ModOperations {
  private stateStore: ReactiveStore<ModServiceState>;
  private config: ModServiceConfig;
  private fileSystem: TauriFileSystem;
  private eventSystem: EventEmitter;
  private eventListeners = new Map<ModServiceEvent, Set<(...args: any[]) => void>>();

  constructor(
    stateStore: ReactiveStore<ModServiceState>,
    config: ModServiceConfig,
    fileSystem: TauriFileSystem,
    eventSystem: EventEmitter
  ) {
    this.stateStore = stateStore;
    this.config = config;
    this.fileSystem = fileSystem;
    this.eventSystem = eventSystem;
  }

  /**
   * 添加 Mod
   */
  async addMod(location: string): Promise<ModOperationResult> {
    try {
      // 这里应该实现添加 Mod 的逻辑
      // 目前返回一个占位符结果
      const result: ModOperationResult = {
        success: true,
        message: `Mod added: ${location}`,
        modId: 'temp-id'
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.MOD_ADDED, result);
      return result;
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 移除 Mod
   */
  async removeMod(modId: string): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      const result = await removeModEffect(mod, this.config, this.fileSystem, this.eventSystem);
      
      if (result.success) {
        this.updateState({
          mods: removeModFromListEffect(this.getState().mods, modId),
          lastOperation: result.data
        });
      } else {
        this.updateState({
          lastOperation: {
            success: false,
            error: result.error.message
          }
        });
      }

      return result.success ? result.data : {
        success: false,
        error: result.error.message
      };
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 刷新 Mod
   */
  async refreshMod(modId: string): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      const result = await refreshModEffect(mod, this.config);
      
      if (result.success) {
        this.updateState({
          mods: addModToListEffect(this.getState().mods, result.data),
          lastOperation: {
            success: true,
            message: `Mod refreshed: ${mod.name}`,
            modId: mod.id
          }
        });
      }

      return result.success ? {
        success: true,
        message: `Mod refreshed: ${mod.name}`,
        modId: mod.id
      } : {
        success: false,
        error: result.error.message
      };
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 应用 Mod
   */
  async applyMod(modId: string, options: { backup?: boolean } = {}): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      const result = await applyModEffect(mod, this.config, this.fileSystem, this.eventSystem, options);
      
      if (result.success) {
        this.updateState({
          mods: updateModStatusEffect(this.getState().mods, modId, ModStatus.ACTIVE),
          lastOperation: result.data
        });
      } else {
        this.updateState({
          lastOperation: {
            success: false,
            error: result.error.message
          }
        });
      }

      return result.success ? result.data : {
        success: false,
        error: result.error.message
      };
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 从游戏中移除 Mod
   */
  async removeModFromGame(modId: string): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      const result = await removeModEffect(mod, this.config, this.fileSystem, this.eventSystem);
      
      if (result.success) {
        this.updateState({
          mods: updateModStatusEffect(this.getState().mods, modId, ModStatus.INACTIVE),
          lastOperation: result.data
        });
      } else {
        this.updateState({
          lastOperation: {
            success: false,
            error: result.error.message
          }
        });
      }

      return result.success ? result.data : {
        success: false,
        error: result.error.message
      };
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 切换 Mod 状态
   */
  async toggleMod(modId: string): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      if (mod.status === ModStatus.ACTIVE) {
        return await this.removeModFromGame(modId);
      } else {
        return await this.applyMod(modId);
      }
    } catch (error) {
      const result: ModOperationResult = {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      this.updateState({
        lastOperation: result
      });

      this.emit(ModServiceEvent.ERROR_OCCURRED, result);
      return result;
    }
  }

  /**
   * 获取 Mod
   */
  getMod(modId: string): ModInfo | null {
    return this.getState().mods.find(mod => mod.id === modId) || null;
  }

  /**
   * 根据状态获取 Mod 列表
   */
  getModsByStatus(status: ModStatus): ModInfo[] {
    return this.getState().mods.filter(mod => mod.status === status);
  }

  /**
   * 获取当前状态
   */
  private getState(): ModServiceState {
    return this.stateStore.getState();
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<ModServiceState>): void {
    const currentState = this.getState();
    this.stateStore.setState({
      ...currentState,
      ...updates
    });
  }

  /**
   * 发射事件
   */
  private emit(event: ModServiceEvent, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}
