/**
 * 插件环境实现
 * 提供插件运行所需的基础环境
 */

import { PluginEnvironment } from './types';
import { TauriFileSystem } from '@/kernels/file-system';
import { EventEmitter } from '@/kernels/event-system';

/**
 * 创建插件环境
 * @param fileSystem 文件系统实例
 * @param eventEmitter 事件发射器实例
 * @param configManager 配置管理器实例
 * @returns 插件环境
 */
export function createPluginEnvironment(
  fileSystem: TauriFileSystem,
  eventEmitter: EventEmitter,
  configManager: {
    get: (key: string) => any;
    set: (key: string, value: any) => void;
    has: (key: string) => boolean;
  }
): PluginEnvironment {
  return {
    fs: {
      readFile: (path: string) => fileSystem.readFile(path),
      writeFile: (path: string, content: string) => fileSystem.writeFile(path, content),
      exists: (path: string) => fileSystem.exists(path),
      createDirectory: (path: string) => fileSystem.createDirectory(path),
      listDirectory: (path: string) => fileSystem.listDirectory(path),
    },
    
    events: {
      on: (event: string, listener: (...args: any[]) => void) => {
        return eventEmitter.on(event, listener);
      },
      off: (event: string, listenerId: string) => {
        eventEmitter.off(event, listenerId);
      },
      emit: (event: string, data: any) => {
        eventEmitter.emit(event, data);
      },
    },
    
    config: {
      get: (key: string) => configManager.get(key),
      set: (key: string, value: any) => configManager.set(key, value),
      has: (key: string) => configManager.has(key),
    },
    
    log: {
      info: (message: string, ...args: any[]) => {
        console.log(`[Plugin] ${message}`, ...args);
      },
      warn: (message: string, ...args: any[]) => {
        console.warn(`[Plugin] ${message}`, ...args);
      },
      error: (message: string, ...args: any[]) => {
        console.error(`[Plugin] ${message}`, ...args);
      },
    },
  };
}
