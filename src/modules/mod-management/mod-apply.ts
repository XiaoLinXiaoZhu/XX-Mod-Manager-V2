/**
 * Mod 应用模块
 * 提供 Mod 应用、移除、状态检查等纯函数
 */

import { ModMetadata } from './types';
import type { ModOperationResult, ModApplyOptions, ModStatus } from './types';
import type { Result, KernelError } from '@/kernels/types';
import type { ExtendedFileSystem } from '@/kernels/file-system';

// Mod 应用状态
export interface ModApplyStatus {
  isApplied: boolean;
  appliedFiles: string[];
  conflicts: string[];
  lastApplied?: string;
}

// Mod 应用结果
export interface ModApplyResult extends ModOperationResult {
  appliedFiles?: string[];
  conflicts?: string[];
  backupPath?: string;
}

/**
 * 检查 Mod 是否已应用
 */
export function checkModAppliedStatus(
  mod: ModMetadata,
  targetDir: string,
  appliedMods: ModMetadata[]
): ModApplyStatus {
  const isApplied = appliedMods.some(appliedMod => appliedMod.id === mod.id);
  
  return {
    isApplied,
    appliedFiles: [], // 这里应该从文件系统获取实际文件列表
    conflicts: [], // 这里应该检查文件冲突
    lastApplied: isApplied ? new Date().toISOString() : undefined
  };
}

/**
 * 验证 Mod 应用条件
 */
export function validateModApplyConditions(
  mod: ModMetadata,
  targetDir: string,
  options: ModApplyOptions = {}
): Result<boolean, KernelError> {
  // 检查 Mod 元数据完整性
  if (!mod.id || !mod.name || !mod.location) {
    return {
      success: false,
      error: new KernelError(
        'Mod metadata is incomplete',
        'INCOMPLETE_MOD_METADATA',
        { modId: mod.id, missingFields: ['id', 'name', 'location'] }
      )
    };
  }

  // 检查目标目录
  if (!targetDir || targetDir.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Target directory is empty',
        'EMPTY_TARGET_DIR',
        { targetDir }
      )
    };
  }

  // 检查 Mod 位置
  if (!mod.location || mod.location.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Mod location is empty',
        'EMPTY_MOD_LOCATION',
        { modId: mod.id }
      )
    };
  }

  return {
    success: true,
    data: true
  };
}

/**
 * 检查 Mod 应用冲突
 */
export function checkModApplyConflicts(
  mod: ModMetadata,
  targetDir: string,
  existingMods: ModMetadata[]
): string[] {
  const conflicts: string[] = [];
  
  // 这里应该实现实际的文件冲突检测逻辑
  // 目前返回空数组作为占位符
  
  return conflicts;
}

/**
 * 生成 Mod 应用计划
 */
export function generateModApplyPlan(
  mod: ModMetadata,
  targetDir: string,
  options: ModApplyOptions = {}
): Result<{
  filesToApply: string[];
  conflicts: string[];
  backupRequired: boolean;
  estimatedTime: number;
}, KernelError> {
  const validation = validateModApplyConditions(mod, targetDir, options);
  if (!validation.success) {
    return validation;
  }

  // 这里应该实现实际的文件列表生成逻辑
  const filesToApply: string[] = []; // 从 mod.location 获取文件列表
  const conflicts: string[] = []; // 检查文件冲突
  const backupRequired = options.backup || false;
  const estimatedTime = filesToApply.length * 100; // 估算时间（毫秒）

  return {
    success: true,
    data: {
      filesToApply,
      conflicts,
      backupRequired,
      estimatedTime
    }
  };
}

/**
 * 生成 Mod 移除计划
 */
export function generateModRemovePlan(
  mod: ModMetadata,
  targetDir: string
): Result<{
  filesToRemove: string[];
  estimatedTime: number;
}, KernelError> {
  if (!mod.id || !mod.name) {
    return {
      success: false,
      error: new KernelError(
        'Mod metadata is incomplete',
        'INCOMPLETE_MOD_METADATA',
        { modId: mod.id }
      )
    };
  }

  // 这里应该实现实际的文件列表生成逻辑
  const filesToRemove: string[] = []; // 从目标目录获取需要移除的文件
  const estimatedTime = filesToRemove.length * 50; // 估算时间（毫秒）

  return {
    success: true,
    data: {
      filesToRemove,
      estimatedTime
    }
  };
}

/**
 * 计算 Mod 应用进度
 */
export function calculateModApplyProgress(
  totalFiles: number,
  processedFiles: number
): number {
  if (totalFiles === 0) {
    return 100;
  }
  
  return Math.min(100, Math.round((processedFiles / totalFiles) * 100));
}

/**
 * 检查 Mod 应用是否完成
 */
export function isModApplyComplete(
  totalFiles: number,
  processedFiles: number
): boolean {
  return processedFiles >= totalFiles;
}

/**
 * 生成 Mod 应用日志
 */
export function generateModApplyLog(
  mod: ModMetadata,
  operation: 'apply' | 'remove',
  result: ModApplyResult,
  startTime: number,
  endTime: number
): string {
  const duration = endTime - startTime;
  const timestamp = new Date(startTime).toISOString();
  
  const log = [
    `[${timestamp}] Mod ${operation} operation`,
    `Mod: ${mod.name} (${mod.id})`,
    `Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    `Duration: ${duration}ms`,
    result.message ? `Message: ${result.message}` : '',
    result.error ? `Error: ${result.error}` : '',
    result.appliedFiles ? `Files: ${result.appliedFiles.length}` : '',
    result.conflicts ? `Conflicts: ${result.conflicts.length}` : '',
    result.backupPath ? `Backup: ${result.backupPath}` : ''
  ].filter(line => line.length > 0).join('\n');

  return log;
}

/**
 * 验证 Mod 移除条件
 */
export function validateModRemoveConditions(
  mod: ModMetadata,
  targetDir: string
): Result<boolean, KernelError> {
  if (!mod.id || !mod.name) {
    return {
      success: false,
      error: new KernelError(
        'Mod metadata is incomplete',
        'INCOMPLETE_MOD_METADATA',
        { modId: mod.id }
      )
    };
  }

  if (!targetDir || targetDir.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Target directory is empty',
        'EMPTY_TARGET_DIR',
        { targetDir }
      )
    };
  }

  return {
    success: true,
    data: true
  };
}

/**
 * 检查 Mod 是否可以安全移除
 */
export function canSafelyRemoveMod(
  mod: ModMetadata,
  targetDir: string,
  otherAppliedMods: ModMetadata[]
): Result<boolean, KernelError> {
  const validation = validateModRemoveConditions(mod, targetDir);
  if (!validation.success) {
    return validation;
  }

  // 检查是否有其他 Mod 依赖此 Mod
  const dependentMods = otherAppliedMods.filter(otherMod => {
    // 这里应该检查依赖关系
    return false; // 占位符
  });

  if (dependentMods.length > 0) {
    return {
      success: false,
      error: new KernelError(
        'Cannot remove mod: other mods depend on it',
        'MOD_HAS_DEPENDENCIES',
        { 
          modId: mod.id, 
          dependentMods: dependentMods.map(m => m.id) 
        }
      )
    };
  }

  return {
    success: true,
    data: true
  };
}

/**
 * 获取 Mod 应用统计信息
 */
export function getModApplyStatistics(
  mods: ModMetadata[],
  appliedMods: ModMetadata[]
): {
  totalMods: number;
  appliedMods: number;
  inactiveMods: number;
  applyRate: number;
} {
  const totalMods = mods.length;
  const appliedModsCount = appliedMods.length;
  const inactiveMods = totalMods - appliedModsCount;
  const applyRate = totalMods > 0 ? (appliedModsCount / totalMods) * 100 : 0;

  return {
    totalMods,
    appliedMods: appliedModsCount,
    inactiveMods,
    applyRate: Math.round(applyRate * 100) / 100
  };
}

/**
 * 检查 Mod 应用状态一致性
 */
export function checkModApplyConsistency(
  mod: ModMetadata,
  targetDir: string,
  expectedFiles: string[]
): Result<{
  isConsistent: boolean;
  missingFiles: string[];
  extraFiles: string[];
}, KernelError> {
  // 这里应该实现实际的文件系统检查逻辑
  const actualFiles: string[] = []; // 从文件系统获取实际文件列表
  
  const missingFiles = expectedFiles.filter(file => !actualFiles.includes(file));
  const extraFiles = actualFiles.filter(file => !expectedFiles.includes(file));
  const isConsistent = missingFiles.length === 0 && extraFiles.length === 0;

  return {
    success: true,
    data: {
      isConsistent,
      missingFiles,
      extraFiles
    }
  };
}

/**
 * 生成 Mod 应用报告
 */
export function generateModApplyReport(
  mod: ModMetadata,
  operation: 'apply' | 'remove',
  result: ModApplyResult,
  statistics: {
    totalFiles: number;
    processedFiles: number;
    errors: number;
    warnings: number;
  }
): string {
  const report = [
    `Mod ${operation} Report`,
    `====================`,
    `Mod: ${mod.name} (${mod.id})`,
    `Operation: ${operation.toUpperCase()}`,
    `Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
    `Files: ${statistics.processedFiles}/${statistics.totalFiles}`,
    `Errors: ${statistics.errors}`,
    `Warnings: ${statistics.warnings}`,
    result.message ? `Message: ${result.message}` : '',
    result.error ? `Error: ${result.error}` : '',
    result.appliedFiles ? `Applied Files: ${result.appliedFiles.length}` : '',
    result.conflicts ? `Conflicts: ${result.conflicts.length}` : '',
    result.backupPath ? `Backup Path: ${result.backupPath}` : ''
  ].filter(line => line.length > 0).join('\n');

  return report;
}

/**
 * 应用 Mod（软链接模式）
 */
export async function applyModBySymlink(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: ExtendedFileSystem,
  options: ModApplyOptions = {}
): Promise<Result<ModApplyResult, KernelError>> {
  try {
    const { join, dirname, basename } = await import('@tauri-apps/api/path');
    
    // 检查目标目录是否存在
    if (!(await fileSystem.exists(targetDir))) {
      return {
        success: false,
        error: new KernelError(
          `Target directory does not exist: ${targetDir}`,
          'TARGET_DIR_NOT_EXISTS',
          { targetDir }
        )
      };
    }

    // 检查是否支持软链接
    if (!(await fileSystem.isSymlinkSupported(targetDir))) {
      return {
        success: false,
        error: new KernelError(
          `Symlink not supported in target directory: ${targetDir}`,
          'SYMLINK_NOT_SUPPORTED',
          { targetDir }
        )
      };
    }

    // 检查源目录和目标目录是否在同一位置
    const sourceParent = await dirname(mod.location);
    if (sourceParent === targetDir) {
      return {
        success: false,
        error: new KernelError(
          'Source and target directories cannot be the same',
          'SAME_SOURCE_TARGET_DIR',
          { sourceDir: mod.location, targetDir }
        )
      };
    }

    // 创建软链接
    const symlinkPath = await join(targetDir, basename(mod.location));
    await fileSystem.createSymlink(mod.location, symlinkPath);

    return {
      success: true,
      data: {
        success: true,
        message: `Mod applied successfully via symlink: ${mod.name}`,
        modId: mod.id,
        appliedFiles: [symlinkPath]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to apply mod by symlink: ${mod.name}`,
        'MOD_APPLY_SYMLINK_ERROR',
        { 
          modId: mod.id, 
          modName: mod.name, 
          targetDir,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 应用 Mod（传统模式）
 */
export async function applyModTraditionally(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: ExtendedFileSystem,
  options: ModApplyOptions = {}
): Promise<Result<ModApplyResult, KernelError>> {
  try {
    const { join, basename } = await import('@tauri-apps/api/path');
    
    // 检查目标目录是否存在
    if (!(await fileSystem.exists(targetDir))) {
      return {
        success: false,
        error: new KernelError(
          `Target directory does not exist: ${targetDir}`,
          'TARGET_DIR_NOT_EXISTS',
          { targetDir }
        )
      };
    }

    // 传统模式：通过重命名文件夹来启用/禁用Mod
    const modFolderName = basename(mod.location);
    const enabledPath = await join(targetDir, modFolderName);
    const disabledPath = await join(targetDir, `disable_${modFolderName}`);

    // 检查是否已经存在启用或禁用的版本
    const enabledExists = await fileSystem.exists(enabledPath);
    const disabledExists = await fileSystem.exists(disabledPath);

    if (enabledExists) {
      // 已经启用，无需操作
      return {
        success: true,
        data: {
          success: true,
          message: `Mod already enabled: ${mod.name}`,
          modId: mod.id,
          appliedFiles: [enabledPath]
        }
      };
    }

    if (disabledExists) {
      // 从禁用状态启用
      await fileSystem.renameDirectory(disabledPath, enabledPath);
    } else {
      // 复制Mod文件夹到目标目录
      await fileSystem.createDirectory(enabledPath);
      // 这里应该实现文件夹复制逻辑
      // await copyDirectory(mod.location, enabledPath, fileSystem);
    }

    return {
      success: true,
      data: {
        success: true,
        message: `Mod applied successfully via traditional method: ${mod.name}`,
        modId: mod.id,
        appliedFiles: [enabledPath]
      }
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to apply mod traditionally: ${mod.name}`,
        'MOD_APPLY_TRADITIONAL_ERROR',
        { 
          modId: mod.id, 
          modName: mod.name, 
          targetDir,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 移除 Mod（软链接模式）
 */
export async function removeModBySymlink(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: ExtendedFileSystem
): Promise<Result<ModApplyResult, KernelError>> {
  try {
    const { join, basename } = await import('@tauri-apps/api/path');
    
    const symlinkPath = await join(targetDir, basename(mod.location));
    
    // 检查软链接是否存在
    if (await fileSystem.checkSymlinkExists(symlinkPath)) {
      await fileSystem.removeSymlink(symlinkPath);
    }

    return {
      success: true,
      data: {
        success: true,
        message: `Mod removed successfully via symlink: ${mod.name}`,
        modId: mod.id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to remove mod by symlink: ${mod.name}`,
        'MOD_REMOVE_SYMLINK_ERROR',
        { 
          modId: mod.id, 
          modName: mod.name, 
          targetDir,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 移除 Mod（传统模式）
 */
export async function removeModTraditionally(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: ExtendedFileSystem
): Promise<Result<ModApplyResult, KernelError>> {
  try {
    const { join, basename } = await import('@tauri-apps/api/path');
    
    const modFolderName = basename(mod.location);
    const enabledPath = await join(targetDir, modFolderName);
    const disabledPath = await join(targetDir, `disable_${modFolderName}`);

    // 检查是否存在启用的版本
    if (await fileSystem.exists(enabledPath)) {
      // 重命名为禁用状态
      await fileSystem.renameDirectory(enabledPath, disabledPath);
    }

    return {
      success: true,
      data: {
        success: true,
        message: `Mod disabled successfully via traditional method: ${mod.name}`,
        modId: mod.id
      }
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to remove mod traditionally: ${mod.name}`,
        'MOD_REMOVE_TRADITIONAL_ERROR',
        { 
          modId: mod.id, 
          modName: mod.name, 
          targetDir,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 批量应用 Mods
 */
export async function applyModsBatch(
  mods: ModMetadata[],
  targetDir: string,
  fileSystem: ExtendedFileSystem,
  useSymlink: boolean = true,
  options: ModApplyOptions = {}
): Promise<Result<ModApplyResult[], KernelError>> {
  try {
    const results: ModApplyResult[] = [];
    
    for (const mod of mods) {
      const result = useSymlink 
        ? await applyModBySymlink(mod, targetDir, fileSystem, options)
        : await applyModTraditionally(mod, targetDir, fileSystem, options);
        
      if (result.success) {
        results.push(result.data);
      } else {
        results.push({
          success: false,
          error: result.error.message,
          modId: mod.id
        });
      }
    }

    return {
      success: true,
      data: results
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Failed to apply mods batch',
        'MODS_BATCH_APPLY_ERROR',
        { 
          modCount: mods.length,
          targetDir,
          useSymlink,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}
