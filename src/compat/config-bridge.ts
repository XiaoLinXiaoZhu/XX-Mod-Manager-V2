/**
 * 配置系统兼容桥接层
 * 提供旧配置系统的兼容接口
 */

import { createConfigService, DEFAULT_CONFIG_SERVICE_OPTIONS } from '@/services';
import { ref } from 'vue';
import { EventSystem, EventType } from './event-bridge';
import { currentPage } from './state-bridge';

// 创建全局配置服务实例
const globalConfigService = createConfigService(DEFAULT_CONFIG_SERVICE_OPTIONS);

/**
 * 兼容的SubConfig类
 * 提供与旧系统相同的API，但使用新的配置服务
 */
export class SubConfig {
  // 创建响应式引用
  language = ref('zh-CN');
  theme = ref('dark');
  ifStartWithLastPreset = ref(false);
  modSourceFolders = ref<string[]>([]);
  modTargetFolder = ref('');
  presetFolder = ref('');
  ifUseTraditionalApply = ref(false);
  ifKeepModNameAsModFolderName = ref(false);
  firstLoad = ref(true);
  disabledPlugins = ref<string[]>([]);

  constructor() {
    console.log('SubConfig 初始化');
    
    // 监听路由变化事件
    EventSystem.on(EventType.routeChanged, (changeInfo: { to: string, from: string }) => {
      if (changeInfo.to === 'ModList') {
        console.log('SubConfig: 监听到路由变化事件，刷新状态');
        this.refreshStates();
      }
    });
  }

  async loadFrom(filePath: string): Promise<void> {
    console.log(`从 ${filePath} 读取本地配置`);
    // 这里应该从新架构的配置服务加载配置
    // 暂时保持空实现
  }

  async saveTo(filePath: string): Promise<void> {
    console.log(`保存本地配置到 ${filePath}`);
    // 这里应该保存到新架构的配置服务
    // 暂时保持空实现
  }

  refreshStates(): void {
    // 刷新状态逻辑
    console.log('SubConfig: 刷新状态');
  }
}

/**
 * 兼容的GlobalConfig类
 * 提供与旧系统相同的API，但使用新的配置服务
 */
export class GlobalConfig {
  // 创建响应式引用
  language = ref('zh-CN');
  theme = ref('dark');
  ifStartWithLastPreset = ref(false);
  modSourceFolders = ref<string[]>([]);
  modTargetFolder = ref('');
  presetFolder = ref('');
  ifUseTraditionalApply = ref(false);
  ifKeepModNameAsModFolderName = ref(false);
  firstLoad = ref(true);
  disabledPlugins = ref<string[]>([]);
  lastUsedGameRepo = ref('');
  checkUpdatesOnStart = ref(true);

  constructor() {
    console.log('GlobalConfig 初始化');
    
    // 监听路由变化事件
    EventSystem.on(EventType.routeChanged, (changeInfo: { to: string, from: string }) => {
      if (changeInfo.to === 'Main') {
        console.log('GlobalConfig: 监听到路由变化事件，刷新状态');
        this.refreshStates();
      }
    });
  }

  async loadFrom(filePath: string): Promise<void> {
    console.log(`从 ${filePath} 读取全局配置`);
    // 这里应该从新架构的配置服务加载配置
    // 暂时保持空实现
  }

  async loadDefaultConfig(): Promise<void> {
    console.log('加载默认全局配置');
    // 这里应该从新架构的配置服务加载默认配置
    // 暂时保持空实现
  }

  async saveTo(filePath: string): Promise<void> {
    console.log(`保存全局配置到 ${filePath}`);
    // 这里应该保存到新架构的配置服务
    // 暂时保持空实现
  }

  refreshStates(): void {
    // 刷新状态逻辑
    console.log('GlobalConfig: 刷新状态');
  }
}

// 创建全局实例
export const SubConfigInstance = new SubConfig();
export const GlobalConfigInstance = new GlobalConfig();

/**
 * 兼容的useConfig函数
 * 提供与旧系统相同的API
 */
export function useConfig<T>(_key: string, defaultValue: T) {
  // 这里应该从新架构的配置服务获取配置
  // 暂时返回默认值
  return { value: defaultValue, refImpl: ref(defaultValue) };
}

/**
 * 兼容的useGlobalConfig函数
 * 提供与旧系统相同的API
 */
export function useGlobalConfig<T>(_key: string, defaultValue: T) {
  // 这里应该从新架构的配置服务获取配置
  // 暂时返回默认值
  return { value: defaultValue, refImpl: ref(defaultValue) };
}

/**
 * 获取全局配置服务实例
 */
export function getGlobalConfigService() {
  return globalConfigService;
}
