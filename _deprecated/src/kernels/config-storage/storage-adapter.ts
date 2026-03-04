/**
 * 配置存储适配器实现
 * 基于文件系统的配置存储实现
 */

import type { FileSystem } from '../types';
import type { ConfigStorage, ConfigStorageOptions } from './types';
import { ConfigStorageError } from './types';
import { join } from '@tauri-apps/api/path';

/**
 * 文件系统配置存储实现
 * 提供基于文件系统的配置存储能力
 */
export class FileSystemConfigStorage<T = any> implements ConfigStorage<T> {
  private backupDir: string;

  constructor(
    private fileSystem: FileSystem,
    private options: ConfigStorageOptions
  ) {
    this.backupDir = '';
  }

  private async initializeBackupDir(): Promise<void> {
    if (!this.backupDir) {
      this.backupDir = await this.getBackupDir();
    }
  }

  /**
   * 加载配置
   */
  async load(): Promise<T> {
    try {
      if (!(await this.exists())) {
        if (this.options.createIfNotExists) {
          return {} as T;
        }
        throw new ConfigStorageError(
          `Config file does not exist: ${this.options.filePath}`,
          'CONFIG_NOT_FOUND',
          { filePath: this.options.filePath }
        );
      }

      const content = await this.fileSystem.readFile(this.options.filePath);
      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof ConfigStorageError) {
        throw error;
      }
      
      throw new ConfigStorageError(
        `Failed to load config: ${this.options.filePath}`,
        'CONFIG_LOAD_ERROR',
        { 
          filePath: this.options.filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 保存配置
   */
  async save(data: T): Promise<void> {
    try {
      // 创建备份
      if (this.options.backupOnSave && await this.exists()) {
        await this.backup();
      }

      const content = JSON.stringify(data, null, 2);
      await this.fileSystem.writeFile(this.options.filePath, content);
    } catch (error) {
      throw new ConfigStorageError(
        `Failed to save config: ${this.options.filePath}`,
        'CONFIG_SAVE_ERROR',
        { 
          filePath: this.options.filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 检查配置是否存在
   */
  async exists(): Promise<boolean> {
    return await this.fileSystem.exists(this.options.filePath);
  }

  /**
   * 删除配置
   */
  async delete(): Promise<void> {
    try {
      if (await this.exists()) {
        await this.fileSystem.deleteFile(this.options.filePath);
      }
    } catch (error) {
      throw new ConfigStorageError(
        `Failed to delete config: ${this.options.filePath}`,
        'CONFIG_DELETE_ERROR',
        { 
          filePath: this.options.filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 创建备份
   */
  async backup(): Promise<string> {
    try {
      await this.initializeBackupDir();
      
      if (!(await this.exists())) {
        throw new ConfigStorageError(
          'Cannot backup non-existent config file',
          'CONFIG_BACKUP_ERROR',
          { filePath: this.options.filePath }
        );
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `config_backup_${timestamp}.json`;
      const backupPath = await join(this.backupDir, backupFileName);

      // 确保备份目录存在
      if (!(await this.fileSystem.checkDirectoryExists(this.backupDir))) {
        await this.fileSystem.createDirectory(this.backupDir);
      }

      // 复制文件到备份目录
      const content = await this.fileSystem.readFile(this.options.filePath);
      await this.fileSystem.writeFile(backupPath, content);

      // 清理旧备份
      await this.cleanupOldBackups();

      return backupPath;
    } catch (error) {
      if (error instanceof ConfigStorageError) {
        throw error;
      }
      
      throw new ConfigStorageError(
        `Failed to create backup: ${this.options.filePath}`,
        'CONFIG_BACKUP_ERROR',
        { 
          filePath: this.options.filePath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 恢复备份
   */
  async restore(backupPath: string): Promise<void> {
    try {
      if (!(await this.fileSystem.exists(backupPath))) {
        throw new ConfigStorageError(
          `Backup file does not exist: ${backupPath}`,
          'BACKUP_NOT_FOUND',
          { backupPath }
        );
      }

      const content = await this.fileSystem.readFile(backupPath);
      await this.fileSystem.writeFile(this.options.filePath, content);
    } catch (error) {
      if (error instanceof ConfigStorageError) {
        throw error;
      }
      
      throw new ConfigStorageError(
        `Failed to restore backup: ${backupPath}`,
        'CONFIG_RESTORE_ERROR',
        { 
          backupPath, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 获取备份列表
   */
  async getBackups(): Promise<string[]> {
    try {
      await this.initializeBackupDir();
      
      if (!(await this.fileSystem.checkDirectoryExists(this.backupDir))) {
        return [];
      }

      const files = await this.fileSystem.listDirectory(this.backupDir);
      const filteredFiles = files
        .filter(file => file.startsWith('config_backup_') && file.endsWith('.json'))
        .map(file => join(this.backupDir, file));
      
      return Promise.all(filteredFiles);
    } catch (error) {
      throw new ConfigStorageError(
        `Failed to get backups: ${this.backupDir}`,
        'CONFIG_BACKUP_LIST_ERROR',
        { 
          backupDir: this.backupDir, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 清理备份
   */
  async clearBackups(): Promise<void> {
    try {
      const backups = await this.getBackups();
      for (const backup of backups) {
        await this.fileSystem.deleteFile(backup);
      }
    } catch (error) {
      throw new ConfigStorageError(
        `Failed to clear backups: ${this.backupDir}`,
        'CONFIG_BACKUP_CLEAR_ERROR',
        { 
          backupDir: this.backupDir, 
          error: error instanceof Error ? error.message : String(error) 
        }
      );
    }
  }

  /**
   * 获取备份目录路径
   */
  private async getBackupDir(): Promise<string> {
    const configDir = this.options.filePath.split('/').slice(0, -1).join('/');
    return await join(configDir, 'backups');
  }

  /**
   * 清理旧备份
   */
  private async cleanupOldBackups(): Promise<void> {
    const maxBackups = this.options.maxBackups || 10;
    const backups = await this.getBackups();
    
    if (backups.length > maxBackups) {
      // 按文件名排序（包含时间戳）
      const sortedBackups = backups.sort();
      const toDelete = sortedBackups.slice(0, backups.length - maxBackups);
      
      for (const backup of toDelete) {
        await this.fileSystem.deleteFile(backup);
      }
    }
  }
}
