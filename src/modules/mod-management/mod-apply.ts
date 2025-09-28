/**
 * Mod 应用模块
 * 提供 Mod 应用、移除、状态检查等纯函数
 */

import { ModMetadata, ModOperationResult, ModApplyOptions, ModStatus } from './types';
import { Result, KernelError } from '@/kernels/types';

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
