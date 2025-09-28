/**
 * 文件系统兼容桥接层
 * 提供旧文件系统的兼容接口
 */

import { TauriFileSystem } from '@/kernels/file-system';
import type { IFileSystem } from "@/shared/types/filesystem";

// 创建全局文件系统实例
const globalFileSystem = new TauriFileSystem();

/**
 * 兼容的文件系统类
 * 提供与旧系统相同的API，但使用新的文件系统
 */
export class RustFileSystem implements IFileSystem {
  // 基础文件操作
  async readFile(path: string, ifCreate: boolean = false): Promise<string> {
    try {
      return await globalFileSystem.readFile(path);
    } catch (error) {
      console.error('Error reading file:', error);
      return '';
    }
  }

  async writeFile(path: string, content: string, ifCreate: boolean = false): Promise<void> {
    try {
      await globalFileSystem.writeFile(path, content);
    } catch (error) {
      console.error('Error writing file:', error);
    }
  }

  async deleteFile(path: string): Promise<void> {
    try {
      await globalFileSystem.deleteFile(path);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async createDirectory(path: string): Promise<void> {
    try {
      await globalFileSystem.createDirectory(path);
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    try {
      await globalFileSystem.deleteDirectory(path);
    } catch (error) {
      console.error('Error deleting directory:', error);
    }
  }

  async listDirectory(path: string): Promise<string[]> {
    try {
      return await globalFileSystem.listDirectory(path);
    } catch (error) {
      console.error('Error listing directory:', error);
      return [];
    }
  }

  async checkDirectoryExists(path: string): Promise<boolean> {
    try {
      return await globalFileSystem.exists(path);
    } catch (error) {
      console.error('Error checking directory exists:', error);
      return false;
    }
  }

  async getFullPath(path: string): Promise<string> {
    try {
      return await globalFileSystem.getFullPath(path);
    } catch (error) {
      console.error('Error getting full path:', error);
      return path;
    }
  }

  async copyFile(source: string, destination: string): Promise<void> {
    try {
      await globalFileSystem.copyFile(source, destination);
    } catch (error) {
      console.error('Error copying file:', error);
    }
  }

  async moveFile(source: string, destination: string): Promise<void> {
    try {
      await globalFileSystem.moveFile(source, destination);
    } catch (error) {
      console.error('Error moving file:', error);
    }
  }

  async getFileInfo(path: string): Promise<any> {
    try {
      return await globalFileSystem.getFileInfo(path);
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
}

// 创建全局实例
export const rustFileSystem = new RustFileSystem();

/**
 * 兼容的服务容器类
 */
export class ServiceContainer {
  private _fs: IFileSystem;
  
  public get fs(): IFileSystem {
    return this._fs;
  }
  
  public setFileSystem(ifs: IFileSystem): void {
    this._fs = ifs;
    // 通知所有监听器
    this._fsListeners.forEach(listener => listener(ifs));
  }

  constructor() {
    this._fs = rustFileSystem;
  }

  private _fsListeners: Array<(fs: IFileSystem) => void> = [];
  
  // 可选：提供监听接口（通常用于测试或特殊场景）
  public onFileSystemChange(listener: (fs: IFileSystem) => void): () => void {
    this._fsListeners.push(listener);
    return () => {
      const index = this._fsListeners.indexOf(listener);
      if (index > -1) this._fsListeners.splice(index, 1);
    };
  }
}

export const globalServiceContainer = new ServiceContainer();
