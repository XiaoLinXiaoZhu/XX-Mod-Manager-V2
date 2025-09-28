/**
 * 插件转换器
 * 负责在业务层和 Kernel 层之间转换插件数据
 */

import type { Plugin, PluginEnvironment } from '@/kernels/plugin';
import type { PluginInfo, PluginEnvironmentConfig } from './types';

/**
 * 将业务层插件信息转换为 Kernel 层插件
 * @param pluginInfo 业务层插件信息
 * @returns Kernel 层插件
 */
export function convertToKernelPlugin(pluginInfo: PluginInfo): Plugin {
  return {
    name: pluginInfo.name,
    version: pluginInfo.version,
    init: (environment: PluginEnvironment) => {
      // 这里应该调用插件的实际初始化逻辑
      // 暂时使用空实现
      console.log(`Initializing plugin: ${pluginInfo.name}`);
    },
    destroy: () => {
      // 这里应该调用插件的实际销毁逻辑
      // 暂时使用空实现
      console.log(`Destroying plugin: ${pluginInfo.name}`);
    },
    checkCompatibility: (environment: PluginEnvironment) => {
      // 检查插件兼容性
      return true;
    }
  };
}

/**
 * 创建插件环境
 * @param config 环境配置
 * @returns 插件环境
 */
export function createPluginEnvironment(config: PluginEnvironmentConfig = {}): PluginEnvironment {
  const {
    logLevel = 'info',
    enableEvents = true,
    enableLogging = true
  } = config;

  return {
    log: {
      info: (message: string, ...args: any[]) => {
        if (enableLogging && (logLevel === 'info' || logLevel === 'debug')) {
          console.log(`[Plugin] ${message}`, ...args);
        }
      },
      warn: (message: string, ...args: any[]) => {
        if (enableLogging && (logLevel === 'warn' || logLevel === 'info' || logLevel === 'debug')) {
          console.warn(`[Plugin] ${message}`, ...args);
        }
      },
      error: (message: string, ...args: any[]) => {
        if (enableLogging) {
          console.error(`[Plugin] ${message}`, ...args);
        }
      }
    },
    events: {
      on: <T = any>(event: string, listener: (data: T) => void) => {
        if (enableEvents) {
          // 这里应该集成实际的事件系统
          // 暂时返回空字符串作为监听器ID
          return '';
        }
        return '';
      },
      off: (event: string, listenerId: string) => {
        if (enableEvents) {
          // 这里应该取消事件监听
        }
      },
      emit: <T = any>(event: string, data: T) => {
        if (enableEvents) {
          // 这里应该发射事件
        }
      }
    }
  };
}
