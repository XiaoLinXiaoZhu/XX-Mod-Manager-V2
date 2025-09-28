/**
 * Mod 服务主入口
 * 提供 Mod 相关的状态管理和业务逻辑
 */

import { ReactiveStore } from '@/kernels';
import { 
  ModInfo, 
  ModStatus, 
  ModOperationResult,
  ModLoadOptions,
  ModApplyOptions,
  ModSearchOptions
} from '@/modules/mod-management';
import { 
  ModServiceState, 
  ModServiceConfig, 
  ModServiceOptions, 
  ModServiceEvent,
  ModService as IModService
} from './types';
import { 
  loadModsEffect, 
  applyModEffect, 
  removeModEffect, 
  detectConflictsEffect,
  searchModsEffect,
  updateModStatusEffect,
  addModToListEffect,
  removeModFromListEffect,
  refreshModEffect
} from './effect';
import { 
  DEFAULT_MOD_SERVICE_CONFIG, 
  DEFAULT_MOD_SERVICE_OPTIONS,
  mergeModServiceConfig,
  mergeModServiceOptions
} from './config';
import { defaultEventSystem } from '@/kernels';

/**
 * Mod 服务实现类
 * 管理 Mod 的状态和操作
 */
export class ModService implements IModService {
  private stateStore: ReactiveStore<ModServiceState>;
  private config: ModServiceConfig;
  private options: ModServiceOptions;
  private eventListeners = new Map<ModServiceEvent, Set<(...args: any[]) => void>>();

  constructor(
    config: ModServiceConfig = DEFAULT_MOD_SERVICE_CONFIG,
    options: ModServiceOptions = DEFAULT_MOD_SERVICE_OPTIONS
  ) {
    this.config = config;
    this.options = options;
    
    // 初始化状态
    this.stateStore = new ReactiveStore<ModServiceState>('mod-service', {
      mods: [],
      loading: false,
      error: null,
      lastOperation: null
    });

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 获取当前状态
   */
  getState(): ModServiceState {
    return this.stateStore.getState();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: ModServiceState) => void): () => void {
    return this.stateStore.subscribe(listener);
  }

  /**
   * 加载 Mod 列表
   */
  async loadMods(): Promise<void> {
    this.updateState({ loading: true, error: null });

    try {
      const result = await loadModsEffect(this.config, {
        validateMetadata: this.options.validateOnLoad,
        checkConflicts: this.options.checkConflicts
      });

      if (result.success) {
        this.updateState({
          mods: result.data,
          loading: false,
          error: null
        });
      } else {
        this.updateState({
          loading: false,
          error: result.error.message
        });
      }
    } catch (error) {
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
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

      const result = await removeModEffect(mod, this.config);
      
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

      return result.success ? result.data : result;
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
  async applyMod(modId: string): Promise<ModOperationResult> {
    try {
      const mod = this.getMod(modId);
      if (!mod) {
        return {
          success: false,
          error: `Mod not found: ${modId}`
        };
      }

      const result = await applyModEffect(mod, this.config, {
        backup: this.options.backupOnApply
      });
      
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

      return result.success ? result.data : result;
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

      const result = await removeModEffect(mod, this.config);
      
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

      return result.success ? result.data : result;
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
      await detectConflictsEffect(this.getState().mods);
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
    }
  }

  /**
   * 解决冲突
   */
  async resolveConflict(modId: string, resolution: 'keep' | 'replace'): Promise<ModOperationResult> {
    // 这里应该实现冲突解决逻辑
    // 目前返回一个占位符结果
    return {
      success: true,
      message: `Conflict resolved for mod: ${modId}`,
      modId
    };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ModServiceConfig>): void {
    this.config = mergeModServiceConfig(this.config, config);
  }

  /**
   * 获取配置
   */
  getConfig(): ModServiceConfig {
    return { ...this.config };
  }

  /**
   * 事件管理
   */
  on(event: ModServiceEvent, listener: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    return () => {
      this.off(event, listener);
    };
  }

  off(event: ModServiceEvent, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: ModServiceEvent, ...args: any[]): void {
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
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听内核事件
    defaultEventSystem.on('mod:loaded', (mod: ModInfo) => {
      this.updateState({
        mods: addModToListEffect(this.getState().mods, mod)
      });
    });

    defaultEventSystem.on('mod:applied', (mod: ModInfo) => {
      this.updateState({
        mods: updateModStatusEffect(this.getState().mods, mod.id, ModStatus.ACTIVE)
      });
    });

    defaultEventSystem.on('mod:removed', (mod: ModInfo) => {
      this.updateState({
        mods: updateModStatusEffect(this.getState().mods, mod.id, ModStatus.INACTIVE)
      });
    });
  }
}

/**
 * 创建 Mod 服务工厂
 */
export function createModService(
  config: ModServiceConfig = DEFAULT_MOD_SERVICE_CONFIG,
  options: ModServiceOptions = DEFAULT_MOD_SERVICE_OPTIONS
): ModService {
  return new ModService(config, options);
}

// 导出类型
export * from './types';
export * from './config';
