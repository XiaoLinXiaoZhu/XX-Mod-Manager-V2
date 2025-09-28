/**
 * Mod 文件操作模块
 * 提供 Mod 文件操作的纯函数
 */

import { ModMetadata, ModOperationResult, ModApplyOptions } from './types';
import { Result, KernelError } from '@/kernels/types';

/**
 * 检查 Mod 文件是否存在
 */
export function checkModFilesExist(
  mod: ModMetadata,
  fileSystem: { exists: (path: string) => Promise<boolean> }
): Promise<Result<boolean, KernelError>> {
  return fileSystem.exists(mod.location)
    .then(exists => ({
      success: true,
      data: exists
    }))
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to check mod files: ${mod.location}`,
        'MOD_FILE_CHECK_ERROR',
        { modId: mod.id, location: mod.location, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 获取 Mod 文件列表
 */
export function getModFileList(
  mod: ModMetadata,
  fileSystem: { listDirectory: (path: string) => Promise<string[]> }
): Promise<Result<string[], KernelError>> {
  return fileSystem.listDirectory(mod.location)
    .then(files => ({
      success: true,
      data: files
    }))
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to get mod file list: ${mod.location}`,
        'MOD_FILE_LIST_ERROR',
        { modId: mod.id, location: mod.location, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 计算 Mod 大小
 */
export function calculateModSize(
  mod: ModMetadata,
  fileSystem: { 
    listDirectory: (path: string) => Promise<string[]>;
    getFileInfo: (path: string) => Promise<{ size: number }>;
  }
): Promise<Result<number, KernelError>> {
  return getModFileList(mod, fileSystem)
    .then(result => {
      if (!result.success) {
        return result;
      }
      
      const files = result.data;
      const sizePromises = files.map(file => 
        fileSystem.getFileInfo(file)
          .then(info => info.size)
          .catch(() => 0)
      );
      
      return Promise.all(sizePromises)
        .then(sizes => ({
          success: true,
          data: sizes.reduce((total, size) => total + size, 0)
        }));
    })
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to calculate mod size: ${mod.location}`,
        'MOD_SIZE_CALCULATION_ERROR',
        { modId: mod.id, location: mod.location, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 验证 Mod 文件完整性
 */
export function validateModFiles(
  mod: ModMetadata,
  fileSystem: { 
    exists: (path: string) => Promise<boolean>;
    listDirectory: (path: string) => Promise<string[]>;
  }
): Promise<Result<boolean, KernelError>> {
  return checkModFilesExist(mod, fileSystem)
    .then(result => {
      if (!result.success || !result.data) {
        return {
          success: false,
          error: new KernelError(
            `Mod files do not exist: ${mod.location}`,
            'MOD_FILES_NOT_FOUND',
            { modId: mod.id, location: mod.location }
          )
        };
      }
      
      return getModFileList(mod, fileSystem)
        .then(listResult => {
          if (!listResult.success) {
            return listResult;
          }
          
          const files = listResult.data;
          if (files.length === 0) {
            return {
              success: false,
              error: new KernelError(
                `Mod directory is empty: ${mod.location}`,
                'MOD_DIRECTORY_EMPTY',
                { modId: mod.id, location: mod.location }
              )
            };
          }
          
          return {
            success: true,
            data: true
          };
        });
    });
}

/**
 * 生成 Mod 备份路径
 */
export function generateModBackupPath(
  mod: ModMetadata,
  backupDir: string
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const modName = mod.name.replace(/[^a-zA-Z0-9-_]/g, '_');
  return `${backupDir}/${modName}_${timestamp}`;
}

/**
 * 创建 Mod 备份
 */
export function createModBackup(
  mod: ModMetadata,
  backupPath: string,
  fileSystem: {
    createDirectory: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    copyFile: (from: string, to: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
  }
): Promise<Result<string, KernelError>> {
  return fileSystem.createDirectory(backupPath, { recursive: true })
    .then(() => getModFileList(mod, fileSystem))
    .then(result => {
      if (!result.success) {
        return result;
      }
      
      const files = result.data;
      const copyPromises = files.map(file => {
        const fileName = file.split('/').pop() || file;
        const targetPath = `${backupPath}/${fileName}`;
        return fileSystem.copyFile(file, targetPath);
      });
      
      return Promise.all(copyPromises)
        .then(() => ({
          success: true,
          data: backupPath
        }));
    })
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to create mod backup: ${mod.location}`,
        'MOD_BACKUP_ERROR',
        { modId: mod.id, location: mod.location, backupPath, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 应用 Mod（创建符号链接）
 */
export function applyMod(
  mod: ModMetadata,
  targetDir: string,
  options: ModApplyOptions = {},
  fileSystem: {
    createDirectory: (path: string, options?: { recursive?: boolean }) => Promise<void>;
    createSymlink: (from: string, to: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
  }
): Promise<Result<ModOperationResult, KernelError>> {
  return fileSystem.createDirectory(targetDir, { recursive: true })
    .then(() => getModFileList(mod, fileSystem))
    .then(result => {
      if (!result.success) {
        return {
          success: false,
          error: new KernelError(
            `Failed to get mod file list: ${mod.location}`,
            'MOD_APPLY_ERROR',
            { modId: mod.id, location: mod.location, error: result.error.message }
          )
        };
      }
      
      const files = result.data;
      const symlinkPromises = files.map(file => {
        const fileName = file.split('/').pop() || file;
        const targetPath = `${targetDir}/${fileName}`;
        
        // 检查目标文件是否已存在
        return fileSystem.exists(targetPath)
          .then(exists => {
            if (exists && !options.force) {
              throw new Error(`Target file already exists: ${targetPath}`);
            }
            return fileSystem.createSymlink(file, targetPath);
          });
      });
      
      return Promise.all(symlinkPromises)
        .then(() => ({
          success: true,
          data: {
            success: true,
            message: `Mod applied successfully: ${mod.name}`,
            modId: mod.id
          }
        }));
    })
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to apply mod: ${mod.location}`,
        'MOD_APPLY_ERROR',
        { modId: mod.id, location: mod.location, targetDir, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 移除 Mod（删除符号链接）
 */
export function removeMod(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: {
    deleteFile: (path: string) => Promise<void>;
    listDirectory: (path: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
  }
): Promise<Result<ModOperationResult, KernelError>> {
  return getModFileList(mod, fileSystem)
    .then(result => {
      if (!result.success) {
        return {
          success: false,
          error: new KernelError(
            `Failed to get mod file list: ${mod.location}`,
            'MOD_REMOVE_ERROR',
            { modId: mod.id, location: mod.location, error: result.error.message }
          )
        };
      }
      
      const files = result.data;
      const deletePromises = files.map(file => {
        const fileName = file.split('/').pop() || file;
        const targetPath = `${targetDir}/${fileName}`;
        
        return fileSystem.exists(targetPath)
          .then(exists => {
            if (exists) {
              return fileSystem.deleteFile(targetPath);
            }
          });
      });
      
      return Promise.all(deletePromises)
        .then(() => ({
          success: true,
          data: {
            success: true,
            message: `Mod removed successfully: ${mod.name}`,
            modId: mod.id
          }
        }));
    })
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to remove mod: ${mod.location}`,
        'MOD_REMOVE_ERROR',
        { modId: mod.id, location: mod.location, targetDir, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}

/**
 * 检查 Mod 是否已应用
 */
export function isModApplied(
  mod: ModMetadata,
  targetDir: string,
  fileSystem: {
    listDirectory: (path: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
  }
): Promise<Result<boolean, KernelError>> {
  return getModFileList(mod, fileSystem)
    .then(result => {
      if (!result.success) {
        return result;
      }
      
      const files = result.data;
      if (files.length === 0) {
        return {
          success: true,
          data: false
        };
      }
      
      const checkPromises = files.map(file => {
        const fileName = file.split('/').pop() || file;
        const targetPath = `${targetDir}/${fileName}`;
        return fileSystem.exists(targetPath);
      });
      
      return Promise.all(checkPromises)
        .then(exists => ({
          success: true,
          data: exists.every(exists => exists)
        }));
    })
    .catch(error => ({
      success: false,
      error: new KernelError(
        `Failed to check if mod is applied: ${mod.location}`,
        'MOD_APPLIED_CHECK_ERROR',
        { modId: mod.id, location: mod.location, targetDir, error: error instanceof Error ? error.message : String(error) }
      )
    }));
}
