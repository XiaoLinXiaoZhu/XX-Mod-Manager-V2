/**
 * Mod 服务副作用处理
 * 处理与外部世界的交互，如文件系统操作、事件发射等
 */

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
  ModServiceEvent 
} from './types';
import { 
  loadMods, 
  detectModConflicts, 
  filterMods, 
  sortMods 
} from '@/modules/mod-management';
import { 
  applyMod, 
  removeMod, 
  isModApplied, 
  createModBackup 
} from '@/modules/mod-management';
import { 
  defaultFileSystem, 
  defaultEventSystem 
} from '@/kernels';
import { Result, KernelError } from '@/kernels/types';

/**
 * 加载 Mod 列表
 */
export async function loadModsEffect(
  config: ModServiceConfig,
  options: ModLoadOptions = {}
): Promise<Result<ModInfo[], KernelError>> {
  try {
    const loadOptions: ModLoadOptions = {
      validateMetadata: true,
      checkConflicts: true,
      loadPreview: true,
      ...options
    };

    const modConfig = {
      keepModNameAsModFolderName: config.keepModNameAsModFolderName,
      traditionalApply: config.traditionalApply
    };

    const result = await loadMods(config.modSourceFolders, modConfig, loadOptions);
    
    if (result.success) {
      // 发射事件
      defaultEventSystem.emit(ModServiceEvent.MODS_LOADED, result.data);
    }
    
    return result;
  } catch (error) {
    const kernelError = new KernelError(
      'Failed to load mods',
      'MODS_LOAD_ERROR',
      { error: error instanceof Error ? error.message : String(error) }
    );
    
    defaultEventSystem.emit(ModServiceEvent.ERROR_OCCURRED, kernelError);
    
    return {
      success: false,
      error: kernelError
    };
  }
}

/**
 * 应用 Mod
 */
export async function applyModEffect(
  mod: ModInfo,
  config: ModServiceConfig,
  options: ModApplyOptions = {}
): Promise<Result<ModOperationResult, KernelError>> {
  try {
    // 检查是否已应用
    const isAppliedResult = await isModApplied(mod, config.modTargetFolder, defaultFileSystem);
    if (isAppliedResult.success && isAppliedResult.data) {
      return {
        success: true,
        data: {
          success: true,
          message: `Mod is already applied: ${mod.name}`,
          modId: mod.id
        }
      };
    }

    // 创建备份（如果需要）
    if (options.backup) {
      const backupDir = await defaultFileSystem.getConfigDir();
      const backupPath = `${backupDir}/mod_backups/${mod.id}`;
      await createModBackup(mod, backupPath, defaultFileSystem);
    }

    // 应用 Mod
    const applyOptions: ModApplyOptions = {
      backup: false, // 已经在上面处理了
      force: options.force,
      dryRun: options.dryRun
    };

    const result = await applyMod(mod, config.modTargetFolder, applyOptions, defaultFileSystem);
    
    if (result.success) {
      // 发射事件
      defaultEventSystem.emit(ModServiceEvent.MOD_APPLIED, mod, result.data);
    }
    
    return result;
  } catch (error) {
    const kernelError = new KernelError(
      `Failed to apply mod: ${mod.name}`,
      'MOD_APPLY_ERROR',
      { modId: mod.id, error: error instanceof Error ? error.message : String(error) }
    );
    
    defaultEventSystem.emit(ModServiceEvent.ERROR_OCCURRED, kernelError);
    
    return {
      success: false,
      error: kernelError
    };
  }
}

/**
 * 移除 Mod
 */
export async function removeModEffect(
  mod: ModInfo,
  config: ModServiceConfig
): Promise<Result<ModOperationResult, KernelError>> {
  try {
    const result = await removeMod(mod, config.modTargetFolder, defaultFileSystem);
    
    if (result.success) {
      // 发射事件
      defaultEventSystem.emit(ModServiceEvent.MOD_REMOVED, mod, result.data);
    }
    
    return result;
  } catch (error) {
    const kernelError = new KernelError(
      `Failed to remove mod: ${mod.name}`,
      'MOD_REMOVE_ERROR',
      { modId: mod.id, error: error instanceof Error ? error.message : String(error) }
    );
    
    defaultEventSystem.emit(ModServiceEvent.ERROR_OCCURRED, kernelError);
    
    return {
      success: false,
      error: kernelError
    };
  }
}

/**
 * 检测 Mod 冲突
 */
export async function detectConflictsEffect(
  mods: ModInfo[]
): Promise<Result<void, KernelError>> {
  try {
    const conflicts = detectModConflicts(mods);
    
    if (conflicts.length > 0) {
      // 发射冲突检测事件
      defaultEventSystem.emit(ModServiceEvent.CONFLICTS_DETECTED, conflicts);
    }
    
    return {
      success: true,
      data: undefined
    };
  } catch (error) {
    const kernelError = new KernelError(
      'Failed to detect conflicts',
      'CONFLICT_DETECTION_ERROR',
      { error: error instanceof Error ? error.message : String(error) }
    );
    
    defaultEventSystem.emit(ModServiceEvent.ERROR_OCCURRED, kernelError);
    
    return {
      success: false,
      error: kernelError
    };
  }
}

/**
 * 搜索 Mod
 */
export function searchModsEffect(
  mods: ModInfo[],
  options: ModSearchOptions
): ModInfo[] {
  try {
    const filters = {
      status: options.status,
      category: options.category,
      tags: options.tags,
      searchQuery: options.query
    };

    let filteredMods = filterMods(mods, filters);
    
    // 排序
    filteredMods = sortMods(filteredMods, 'name', 'asc');
    
    // 分页
    if (options.limit) {
      const offset = options.offset || 0;
      filteredMods = filteredMods.slice(offset, offset + options.limit);
    }
    
    return filteredMods;
  } catch (error) {
    console.error('Failed to search mods:', error);
    return [];
  }
}

/**
 * 更新 Mod 状态
 */
export function updateModStatusEffect(
  mods: ModInfo[],
  modId: string,
  status: ModStatus
): ModInfo[] {
  try {
    return mods.map(mod => 
      mod.id === modId 
        ? { ...mod, status }
        : mod
    );
  } catch (error) {
    console.error('Failed to update mod status:', error);
    return mods;
  }
}

/**
 * 添加 Mod 到列表
 */
export function addModToListEffect(
  mods: ModInfo[],
  newMod: ModInfo
): ModInfo[] {
  try {
    // 检查是否已存在
    const existingIndex = mods.findIndex(mod => mod.id === newMod.id);
    
    if (existingIndex >= 0) {
      // 更新现有 Mod
      return mods.map((mod, index) => 
        index === existingIndex ? newMod : mod
      );
    } else {
      // 添加新 Mod
      return [...mods, newMod];
    }
  } catch (error) {
    console.error('Failed to add mod to list:', error);
    return mods;
  }
}

/**
 * 从列表中移除 Mod
 */
export function removeModFromListEffect(
  mods: ModInfo[],
  modId: string
): ModInfo[] {
  try {
    return mods.filter(mod => mod.id !== modId);
  } catch (error) {
    console.error('Failed to remove mod from list:', error);
    return mods;
  }
}

/**
 * 刷新 Mod 信息
 */
export async function refreshModEffect(
  mod: ModInfo,
  config: ModServiceConfig
): Promise<Result<ModInfo, KernelError>> {
  try {
    // 重新加载 Mod 元数据
    const loadResult = await loadModsEffect(config, {
      validateMetadata: true,
      checkConflicts: false,
      loadPreview: true
    });

    if (!loadResult.success) {
      return {
        success: false,
        error: loadResult.error
      };
    }

    const refreshedMod = loadResult.data.find(m => m.id === mod.id);
    if (!refreshedMod) {
      return {
        success: false,
        error: new KernelError(
          'Mod not found after refresh',
          'MOD_NOT_FOUND',
          { modId: mod.id }
        )
      };
    }

    return {
      success: true,
      data: refreshedMod
    };
  } catch (error) {
    const kernelError = new KernelError(
      `Failed to refresh mod: ${mod.name}`,
      'MOD_REFRESH_ERROR',
      { modId: mod.id, error: error instanceof Error ? error.message : String(error) }
    );
    
    return {
      success: false,
      error: kernelError
    };
  }
}
