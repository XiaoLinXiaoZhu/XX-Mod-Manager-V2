/**
 * Mod 服务主入口
 * 提供 Mod 相关的状态管理和业务逻辑
 */

import { ReactiveStore } from '@/kernels';
import { 
  ModInfo, 
  ModStatus, 
  ModOperationResult
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
  addModToListEffect,
  updateModStatusEffect
} from './effect';
import { 
  DEFAULT_MOD_SERVICE_CONFIG, 
  DEFAULT_MOD_SERVICE_OPTIONS,
  mergeModServiceConfig
} from './config';
import { TauriFileSystem, EventEmitter } from '@/kernels';
import { ModOperations } from './mod-operations';
import { ModSearch } from './mod-search';

/**
 * Mod 服务实现类
 * 管理 Mod 的状态和操作
 */
export class ModService implements IModService {
  private stateStore: ReactiveStore<ModServiceState>;
  private config: ModServiceConfig;
  private options: ModServiceOptions;
  private fileSystem: TauriFileSystem;
  private eventSystem: EventEmitter;
  private eventListeners = new Map<ModServiceEvent, Set<(...args: any[]) => void>>();
  private modOperations: ModOperations;
  private modSearch: ModSearch;

  constructor(
    config: ModServiceConfig = DEFAULT_MOD_SERVICE_CONFIG,
    options: ModServiceOptions = DEFAULT_MOD_SERVICE_OPTIONS,
    fileSystem: TauriFileSystem,
    eventSystem: EventEmitter
  ) {
    this.config = config;
    this.options = options;
    this.fileSystem = fileSystem;
    this.eventSystem = eventSystem;
    
    // 初始化状态
    this.stateStore = new ReactiveStore<ModServiceState>('mod-service', {
      mods: [],
      loading: false,
      error: null,
      lastOperation: null
    });

    // 初始化子组件
    this.modOperations = new ModOperations(this.stateStore, this.config, this.fileSystem, this.eventSystem);
    this.modSearch = new ModSearch(this.stateStore, this.eventSystem);

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
      const result = await loadModsEffect(this.config, this.fileSystem, this.eventSystem, {
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
    return await this.modOperations.addMod(location);
  }

  /**
   * 移除 Mod
   */
  async removeMod(modId: string): Promise<ModOperationResult> {
    return await this.modOperations.removeMod(modId);
  }

  /**
   * 刷新 Mod
   */
  async refreshMod(modId: string): Promise<ModOperationResult> {
    return await this.modOperations.refreshMod(modId);
  }

  /**
   * 应用 Mod
   */
  async applyMod(modId: string): Promise<ModOperationResult> {
    return await this.modOperations.applyMod(modId, {
      backup: this.options.backupOnApply
    });
  }

  /**
   * 从游戏中移除 Mod
   */
  async removeModFromGame(modId: string): Promise<ModOperationResult> {
    return await this.modOperations.removeModFromGame(modId);
  }

  /**
   * 切换 Mod 状态
   */
  async toggleMod(modId: string): Promise<ModOperationResult> {
    return await this.modOperations.toggleMod(modId);
  }

  /**
   * 获取 Mod
   */
  getMod(modId: string): ModInfo | null {
    return this.modOperations.getMod(modId);
  }

  /**
   * 根据状态获取 Mod 列表
   */
  getModsByStatus(status: ModStatus): ModInfo[] {
    return this.modOperations.getModsByStatus(status);
  }

  /**
   * 搜索 Mod
   */
  searchMods(query: string): ModInfo[] {
    return this.modSearch.searchMods(query);
  }

  /**
   * 检测冲突
   */
  async detectConflicts(): Promise<void> {
    return await this.modSearch.detectConflicts();
  }

  /**
   * 解决冲突
   */
  async resolveConflict(modId: string, resolution: 'keep' | 'replace'): Promise<ModOperationResult> {
    return await this.modSearch.resolveConflict(modId, resolution);
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
    this.eventSystem.on('mod:loaded', (mod: ModInfo) => {
      this.updateState({
        mods: addModToListEffect(this.getState().mods, mod)
      });
    });

    this.eventSystem.on('mod:applied', (mod: ModInfo) => {
      this.updateState({
        mods: updateModStatusEffect(this.getState().mods, mod.id, ModStatus.ACTIVE)
      });
    });

    this.eventSystem.on('mod:removed', (mod: ModInfo) => {
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
  options: ModServiceOptions = DEFAULT_MOD_SERVICE_OPTIONS,
  fileSystem: TauriFileSystem,
  eventSystem: EventEmitter
): ModService {
  return new ModService(config, options, fileSystem, eventSystem);
}

// 导出类型
export * from './types';
export * from './config';
