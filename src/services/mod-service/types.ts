/**
 * Mod 服务类型定义
 * 定义 Mod 服务相关的类型和接口
 */

import { ModInfo, ModStatus, ModOperationResult } from '@/modules/mod-management';

// Mod 服务状态
export interface ModServiceState {
  mods: ModInfo[];
  loading: boolean;
  error: string | null;
  lastOperation: ModOperationResult | null;
}

// Mod 服务配置
export interface ModServiceConfig {
  modSourceFolders: string[];
  modTargetFolder: string;
  keepModNameAsModFolderName: boolean;
  traditionalApply: boolean;
}

// Mod 服务选项
export interface ModServiceOptions {
  autoLoad: boolean;
  validateOnLoad: boolean;
  checkConflicts: boolean;
  backupOnApply: boolean;
}

// Mod 服务事件
export enum ModServiceEvent {
  MODS_LOADED = 'mods:loaded',
  MOD_ADDED = 'mod:added',
  MOD_REMOVED = 'mod:removed',
  MOD_APPLIED = 'mod:applied',
  MOD_STATUS_CHANGED = 'mod:status_changed',
  CONFLICTS_DETECTED = 'mods:conflicts_detected',
  ERROR_OCCURRED = 'mod:error_occurred'
}

// Mod 服务接口
export interface ModService {
  // 状态管理
  getState(): ModServiceState;
  subscribe(listener: (state: ModServiceState) => void): () => void;
  
  // Mod 管理
  loadMods(): Promise<void>;
  addMod(location: string): Promise<ModOperationResult>;
  removeMod(modId: string): Promise<ModOperationResult>;
  refreshMod(modId: string): Promise<ModOperationResult>;
  
  // Mod 操作
  applyMod(modId: string): Promise<ModOperationResult>;
  removeModFromGame(modId: string): Promise<ModOperationResult>;
  toggleMod(modId: string): Promise<ModOperationResult>;
  
  // 查询和过滤
  getMod(modId: string): ModInfo | null;
  getModsByStatus(status: ModStatus): ModInfo[];
  searchMods(query: string): ModInfo[];
  
  // 冲突检测
  detectConflicts(): Promise<void>;
  resolveConflict(modId: string, resolution: 'keep' | 'replace'): Promise<ModOperationResult>;
  
  // 配置管理
  updateConfig(config: Partial<ModServiceConfig>): void;
  getConfig(): ModServiceConfig;
  
  // 事件管理
  on(event: ModServiceEvent, listener: (...args: any[]) => void): () => void;
  off(event: ModServiceEvent, listener: (...args: any[]) => void): void;
  emit(event: ModServiceEvent, ...args: any[]): void;
}

// Mod 服务工厂
export interface ModServiceFactory {
  create(config: ModServiceConfig, options?: ModServiceOptions): ModService;
}
