/**
 * Mod 源文件夹管理模块
 * 提供 Mod 源文件夹的增删改查等纯函数
 */

import type { Result, KernelError } from '@/kernels/types';
import type { ExtendedFileSystem } from '@/kernels/file-system';

// 源文件夹信息
export interface ModSourceFolder {
  path: string;
  name: string;
  isValid: boolean;
  modCount: number;
  lastScanned?: string | undefined;
}

// 源文件夹管理选项
export interface SourceFolderOptions {
  validateOnAdd?: boolean;
  scanOnAdd?: boolean;
  recursive?: boolean;
}

// 默认选项
const DEFAULT_SOURCE_FOLDER_OPTIONS: Required<SourceFolderOptions> = {
  validateOnAdd: true,
  scanOnAdd: true,
  recursive: true
};

/**
 * 验证源文件夹路径
 */
export function validateSourceFolderPath(
  path: string,
  fileSystem: { exists: (path: string) => Promise<boolean>; checkDirectoryExists: (path: string) => Promise<boolean> }
): Promise<Result<boolean, KernelError>> {
  return fileSystem.checkDirectoryExists(path)
    .then(exists => ({
      success: true as const,
      data: exists
    }))
    .catch(error => ({
      success: false as const,
      error: new KernelError(
        `Failed to validate source folder: ${path}`,
        'SOURCE_FOLDER_VALIDATION_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 创建源文件夹信息
 */
export function createSourceFolderInfo(
  path: string,
  isValid: boolean = true,
  modCount: number = 0
): ModSourceFolder {
  const { basename } = require('@tauri-apps/api/path');
  
  return {
    path,
    name: basename(path),
    isValid,
    modCount,
    lastScanned: isValid ? new Date().toISOString() : undefined
  };
}

/**
 * 添加源文件夹
 */
export async function addSourceFolder(
  path: string,
  existingFolders: ModSourceFolder[],
  fileSystem: ExtendedFileSystem,
  options: SourceFolderOptions = {}
): Promise<Result<ModSourceFolder, KernelError>> {
  const opts = { ...DEFAULT_SOURCE_FOLDER_OPTIONS, ...options };

  // 检查路径是否已存在
  if (existingFolders.some(folder => folder.path === path)) {
    return {
      success: false,
      error: new KernelError(
        `Source folder already exists: ${path}`,
        'SOURCE_FOLDER_ALREADY_EXISTS',
        { path }
      )
    };
  }

  // 验证路径
  if (opts.validateOnAdd) {
    const validation = await validateSourceFolderPath(path, fileSystem);
    if (!validation.success) {
      return validation;
    }
    if (!validation.data) {
      return {
        success: false,
        error: new KernelError(
          `Source folder does not exist: ${path}`,
          'SOURCE_FOLDER_NOT_EXISTS',
          { path }
        )
      };
    }
  }

  // 扫描Mod数量
  let modCount = 0;
  if (opts.scanOnAdd) {
    try {
      const files = await fileSystem.listDirectory(path);
      modCount = files.filter(file => 
        file.endsWith('.json') || 
        file.includes('mod') || 
        file.includes('Mod')
      ).length;
    } catch (error) {
      console.warn(`Failed to scan mods in source folder: ${path}`, error);
    }
  }

  const sourceFolder = createSourceFolderInfo(path, true, modCount);
  
  return {
    success: true,
    data: sourceFolder
  };
}

/**
 * 移除源文件夹
 */
export function removeSourceFolder(
  path: string,
  existingFolders: ModSourceFolder[]
): Result<ModSourceFolder[], KernelError> {
  const folderIndex = existingFolders.findIndex(folder => folder.path === path);
  
  if (folderIndex === -1) {
    return {
      success: false,
      error: new KernelError(
        `Source folder not found: ${path}`,
        'SOURCE_FOLDER_NOT_FOUND',
        { path }
      )
    };
  }

  const updatedFolders = [...existingFolders];
  updatedFolders.splice(folderIndex, 1);

  return {
    success: true,
    data: updatedFolders
  };
}

/**
 * 更新源文件夹信息
 */
export function updateSourceFolderInfo(
  path: string,
  updates: Partial<ModSourceFolder>,
  existingFolders: ModSourceFolder[]
): Result<ModSourceFolder[], KernelError> {
  const folderIndex = existingFolders.findIndex(folder => folder.path === path);
  
  if (folderIndex === -1) {
    return {
      success: false,
      error: new KernelError(
        `Source folder not found: ${path}`,
        'SOURCE_FOLDER_NOT_FOUND',
        { path }
      )
    };
  }

  const updatedFolders = [...existingFolders];
  updatedFolders[folderIndex] = {
    ...updatedFolders[folderIndex],
    ...updates
  };

  return {
    success: true,
    data: updatedFolders
  };
}

/**
 * 获取源文件夹列表
 */
export function getSourceFolderList(
  existingFolders: ModSourceFolder[],
  filter?: {
    isValid?: boolean;
    minModCount?: number;
    maxModCount?: number;
  }
): ModSourceFolder[] {
  if (!filter) {
    return existingFolders;
  }

  return existingFolders.filter(folder => {
    if (filter.isValid !== undefined && folder.isValid !== filter.isValid) {
      return false;
    }
    if (filter.minModCount !== undefined && folder.modCount < filter.minModCount) {
      return false;
    }
    if (filter.maxModCount !== undefined && folder.modCount > filter.maxModCount) {
      return false;
    }
    return true;
  });
}

/**
 * 验证所有源文件夹
 */
export async function validateAllSourceFolders(
  folders: ModSourceFolder[],
  fileSystem: ExtendedFileSystem
): Promise<Result<ModSourceFolder[], KernelError>> {
  try {
    const validatedFolders: ModSourceFolder[] = [];

    for (const folder of folders) {
      const validation = await validateSourceFolderPath(folder.path, fileSystem);
      const isValid = validation.success && validation.data;
      
      validatedFolders.push({
        ...folder,
        isValid,
        lastScanned: isValid ? new Date().toISOString() : folder.lastScanned
      });
    }

    return {
      success: true,
      data: validatedFolders
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        'Failed to validate source folders',
        'SOURCE_FOLDERS_VALIDATION_ERROR',
        { 
          folderCount: folders.length,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 扫描源文件夹中的Mod数量
 */
export async function scanSourceFolderMods(
  folder: ModSourceFolder,
  fileSystem: ExtendedFileSystem
): Promise<Result<number, KernelError>> {
  try {
    if (!folder.isValid) {
      return {
        success: true,
        data: 0
      };
    }

    const files = await fileSystem.listDirectory(folder.path);
    const modCount = files.filter(file => 
      file.endsWith('.json') || 
      file.includes('mod') || 
      file.includes('Mod')
    ).length;

    return {
      success: true,
      data: modCount
    };
  } catch (error) {
    return {
      success: false,
      error: new KernelError(
        `Failed to scan mods in source folder: ${folder.path}`,
        'SOURCE_FOLDER_SCAN_ERROR',
        { 
          folderPath: folder.path,
          error: error instanceof Error ? error.message : String(error) 
        }
      )
    };
  }
}

/**
 * 获取源文件夹统计信息
 */
export function getSourceFolderStatistics(
  folders: ModSourceFolder[]
): {
  totalFolders: number;
  validFolders: number;
  invalidFolders: number;
  totalMods: number;
  averageModsPerFolder: number;
} {
  const validFolders = folders.filter(folder => folder.isValid);
  const invalidFolders = folders.filter(folder => !folder.isValid);
  const totalMods = folders.reduce((sum, folder) => sum + folder.modCount, 0);
  const averageModsPerFolder = validFolders.length > 0 ? totalMods / validFolders.length : 0;

  return {
    totalFolders: folders.length,
    validFolders: validFolders.length,
    invalidFolders: invalidFolders.length,
    totalMods,
    averageModsPerFolder: Math.round(averageModsPerFolder * 100) / 100
  };
}
