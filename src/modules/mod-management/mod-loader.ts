/**
 * Mod 加载模块
 * 提供 Mod 加载、验证、冲突检测等纯函数
 */

import { 
  ModMetadata, 
  ModInfo, 
  ModStatus, 
  ModLoadOptions, 
  ModConflict,
  ModOperationResult 
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { 
  createModMetadata, 
  validateModMetadata, 
  metadataToModInfo 
} from './mod-metadata';

/**
 * 加载 Mod 元数据
 */
export function loadModMetadata(
  location: string,
  config: { keepModNameAsModFolderName: boolean },
  options: ModLoadOptions = {}
): Result<ModMetadata, KernelError> {
  try {
    // 创建基础元数据
    const metadata = createModMetadata(location, config);
    
    // 如果需要验证元数据
    if (options.validateMetadata) {
      const validation = validateModMetadata(metadata);
      if (!validation.success) {
        return validation;
      }
    }
    
    return {
      success: true,
      data: metadata
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to load mod metadata: ${location}`,
        'MOD_LOAD_ERROR',
        { location, error: error instanceof Error ? error.message : String(error) }
      )
    };
  }
}

/**
 * 加载多个 Mod
 */
export function loadMods(
  locations: string[],
  config: { keepModNameAsModFolderName: boolean },
  options: ModLoadOptions = {}
): Result<ModInfo[], KernelError> {
  const mods: ModInfo[] = [];
  const errors: string[] = [];
  
  for (const location of locations) {
    const result = loadModMetadata(location, config, options);
    if (result.success) {
      const modInfo = metadataToModInfo(result.data, ModStatus.INACTIVE);
      mods.push(modInfo);
    } else {
      errors.push(`Failed to load mod at ${location}: ${result.error.message}`);
    }
  }
  
  if (errors.length > 0 && mods.length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Failed to load any mods',
        'MODS_LOAD_ERROR',
        { errors }
      )
    };
  }
  
  return {
    success: true,
    data: mods
  };
}

/**
 * 检测 Mod 冲突
 */
export function detectModConflicts(mods: ModInfo[]): ModConflict[] {
  const conflicts: ModConflict[] = [];
  
  for (let i = 0; i < mods.length; i++) {
    for (let j = i + 1; j < mods.length; j++) {
      const modA = mods[i];
      const modB = mods[j];
      
      // 检查文件冲突
      const fileConflicts = detectFileConflicts(modA, modB);
      if (fileConflicts.length > 0) {
        conflicts.push({
          modId: modA.id,
          conflictingMods: [modB.id],
          conflictType: 'file',
          description: `File conflicts with ${modB.name}: ${fileConflicts.join(', ')}`
        });
      }
      
      // 检查依赖冲突
      const dependencyConflicts = detectDependencyConflicts(modA, modB);
      if (dependencyConflicts.length > 0) {
        conflicts.push({
          modId: modA.id,
          conflictingMods: [modB.id],
          conflictType: 'dependency',
          description: `Dependency conflicts with ${modB.name}: ${dependencyConflicts.join(', ')}`
        });
      }
    }
  }
  
  return conflicts;
}

/**
 * 检测文件冲突
 */
function detectFileConflicts(modA: ModInfo, modB: ModInfo): string[] {
  // 这里应该实现实际的文件冲突检测逻辑
  // 目前返回空数组作为占位符
  return [];
}

/**
 * 检测依赖冲突
 */
function detectDependencyConflicts(modA: ModInfo, modB: ModInfo): string[] {
  // 这里应该实现实际的依赖冲突检测逻辑
  // 目前返回空数组作为占位符
  return [];
}

/**
 * 验证 Mod 完整性
 */
export function validateModIntegrity(mod: ModInfo): Result<boolean, KernelError> {
  try {
    // 检查必需字段
    if (!mod.id || !mod.name || !mod.location) {
      return {
        success: false,
        error: new KernelError(
          'Mod is missing required fields',
          'MOD_INTEGRITY_ERROR',
          { modId: mod.id, missingFields: ['id', 'name', 'location'] }
        )
      };
    }
    
    // 检查状态有效性
    if (!Object.values(ModStatus).includes(mod.status)) {
      return {
        success: false,
        error: new KernelError(
          'Mod has invalid status',
          'MOD_INVALID_STATUS',
          { modId: mod.id, status: mod.status }
        )
      };
    }
    
    return {
      success: true,
      data: true
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Failed to validate mod integrity',
        'MOD_VALIDATION_ERROR',
        { modId: mod.id, error: error instanceof Error ? error.message : String(error) }
      )
    };
  }
}

/**
 * 过滤 Mod 列表
 */
export function filterMods(
  mods: ModInfo[],
  filters: {
    status?: ModStatus[];
    category?: string;
    tags?: string[];
    searchQuery?: string;
  }
): ModInfo[] {
  return mods.filter(mod => {
    // 状态过滤
    if (filters.status && filters.status.length > 0) {
      if (!filters.status.includes(mod.status)) {
        return false;
      }
    }
    
    // 分类过滤
    if (filters.category && mod.category !== filters.category) {
      return false;
    }
    
    // 标签过滤
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => mod.tags.includes(tag));
      if (!hasMatchingTag) {
        return false;
      }
    }
    
    // 搜索查询过滤
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        mod.name,
        mod.description || '',
        mod.category || '',
        ...mod.tags
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * 排序 Mod 列表
 */
export function sortMods(
  mods: ModInfo[],
  sortBy: 'name' | 'addDate' | 'status' | 'category' = 'name',
  order: 'asc' | 'desc' = 'asc'
): ModInfo[] {
  const sortedMods = [...mods].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'addDate':
        comparison = new Date(a.addDate).getTime() - new Date(b.addDate).getTime();
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'category':
        comparison = (a.category || '').localeCompare(b.category || '');
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });
  
  return sortedMods;
}

/**
 * 获取 Mod 统计信息
 */
export function getModStatistics(mods: ModInfo[]): {
  total: number;
  active: number;
  inactive: number;
  conflicted: number;
  error: number;
  categories: Record<string, number>;
  tags: Record<string, number>;
} {
  const stats = {
    total: mods.length,
    active: 0,
    inactive: 0,
    conflicted: 0,
    error: 0,
    categories: {} as Record<string, number>,
    tags: {} as Record<string, number>
  };
  
  for (const mod of mods) {
    // 状态统计
    switch (mod.status) {
      case ModStatus.ACTIVE:
        stats.active++;
        break;
      case ModStatus.INACTIVE:
        stats.inactive++;
        break;
      case ModStatus.CONFLICTED:
        stats.conflicted++;
        break;
      case ModStatus.ERROR:
        stats.error++;
        break;
    }
    
    // 分类统计
    if (mod.category) {
      stats.categories[mod.category] = (stats.categories[mod.category] || 0) + 1;
    }
    
    // 标签统计
    for (const tag of mod.tags) {
      stats.tags[tag] = (stats.tags[tag] || 0) + 1;
    }
  }
  
  return stats;
}
