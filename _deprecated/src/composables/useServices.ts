/**
 * 服务注入组合式函数
 * 提供在 Vue 组件中使用新架构服务的便捷接口
 */

import { inject, type InjectionKey } from 'vue';
import type { 
  ModService, 
  AppService, 
  ConfigService, 
  PluginService, 
  UiService 
} from '@/services';
import type { TauriFileSystem, EventEmitter } from '@/kernels';

// 定义注入键
export const ModServiceKey: InjectionKey<ModService> = Symbol('modService');
export const AppServiceKey: InjectionKey<AppService> = Symbol('appService');
export const ConfigServiceKey: InjectionKey<ConfigService> = Symbol('configService');
export const PluginServiceKey: InjectionKey<PluginService> = Symbol('pluginService');
export const UiServiceKey: InjectionKey<UiService> = Symbol('uiService');
export const FileSystemKey: InjectionKey<TauriFileSystem> = Symbol('fileSystem');
export const EventSystemKey: InjectionKey<EventEmitter> = Symbol('eventSystem');

/**
 * 使用 Mod 服务
 */
export function useModService() {
  const service = inject(ModServiceKey);
  if (!service) {
    throw new Error('ModService not provided. Make sure the service is injected in main.ts');
  }
  return service;
}

/**
 * 使用应用服务
 */
export function useAppService() {
  const service = inject(AppServiceKey);
  if (!service) {
    throw new Error('AppService not provided. Make sure the service is injected in main.ts');
  }
  return service;
}

/**
 * 使用配置服务
 */
export function useConfigService() {
  const service = inject(ConfigServiceKey);
  if (!service) {
    throw new Error('ConfigService not provided. Make sure the service is injected in main.ts');
  }
  return service;
}

/**
 * 使用插件服务
 */
export function usePluginService() {
  const service = inject(PluginServiceKey);
  if (!service) {
    throw new Error('PluginService not provided. Make sure the service is injected in main.ts');
  }
  return service;
}

/**
 * 使用 UI 服务
 */
export function useUiService() {
  const service = inject(UiServiceKey);
  if (!service) {
    throw new Error('UiService not provided. Make sure the service is injected in main.ts');
  }
  return service;
}

/**
 * 使用文件系统
 */
export function useFileSystem() {
  const fileSystem = inject(FileSystemKey);
  if (!fileSystem) {
    throw new Error('FileSystem not provided. Make sure the service is injected in main.ts');
  }
  return fileSystem;
}

/**
 * 使用事件系统
 */
export function useEventSystem() {
  const eventSystem = inject(EventSystemKey);
  if (!eventSystem) {
    throw new Error('EventSystem not provided. Make sure the service is injected in main.ts');
  }
  return eventSystem;
}

/**
 * 使用所有服务
 */
export function useAllServices() {
  return {
    modService: useModService(),
    appService: useAppService(),
    configService: useConfigService(),
    pluginService: usePluginService(),
    uiService: useUiService(),
    fileSystem: useFileSystem(),
    eventSystem: useEventSystem()
  };
}
