/**
 * 事件系统兼容桥接层
 * 提供旧事件系统的兼容接口
 */

import { EventEmitter } from '@/kernels';

// 创建全局事件系统实例
const globalEventSystem = new EventEmitter();

/**
 * 兼容的EventType枚举
 * 保持与旧系统相同的值
 */
export const EventType = {
  // 生命周期
  wakeUp: 'wakeUp',
  initDone: 'initDone',
  startDone: 'startDone',
  
  // 插件加载相关
  pluginLoaded: 'pluginLoaded',
  
  // 状态变更
  themeChange: 'themeChange',
  languageChange: 'languageChange',
  lastClickedModChanged: 'lastClickedModChanged',
  modInfoChanged: 'modInfoChanged',
  currentCharacterChanged: 'currentCharacterChanged',
  currentPresetChanged: 'currentPresetChanged',
  currentModChanged: 'currentModChanged',
  modListChanged: 'modListChanged',
  
  // 事件节点
  modsApplied: 'modsApplied',
  addMod: 'addMod',
  addPreset: 'addPreset',
  toggledMod: 'toggledMod',
  
  // 插件相关
  pluginEnabled: 'pluginEnabled',
  pluginDisabled: 'pluginDisabled',
  currentTabChanged: 'currentTabChanged',
  
  // 窗口相关
  windowBlur: 'windowBlur',
  windowFocus: 'windowFocus',
  windowSleep: 'windowSleep',
  windowWake: 'windowWake',
  
  // 路由相关
  routeChanged: 'routeChanged',
} as const;

/**
 * 兼容的EventSystem类
 * 提供与旧系统相同的API，但使用新的事件系统
 */
export class EventSystem {
  private static devMode = false;

  static async on(event: string, callback: Function) {
    // 验证事件类型
    if (!Object.values(EventType).includes(event as any)) {
      console.warn(`EventSystem.on: event ${event} is not a valid EventType`);
    }
    
    globalEventSystem.on(event, (data: any) => {
      if (Array.isArray(data)) {
        callback(...data);
      } else {
        callback(data);
      }
    });
  }

  static async off(_event: string, _callback: Function) {
    // 由于新的事件系统使用ID而不是回调函数来移除监听器
    // 这里需要特殊处理，暂时保留所有监听器
    console.warn('EventSystem.off: 新架构中请使用返回的ID来移除监听器');
  }

  static async trigger(event: string, ...args: any[]) {
    // 验证事件类型
    if (!Object.values(EventType).includes(event as any)) {
      console.warn(`EventSystem.trigger: event ${event} is not a valid EventType`);
    }
    
    if (this.devMode) {
      console.log('trigger:', event, args, new Error());
    }
    
    globalEventSystem.emit(event, args.length === 1 ? args[0] : args);
  }

  static async triggerSync(event: string, ...args: any[]) {
    // 验证事件类型
    if (!Object.values(EventType).includes(event as any)) {
      console.warn(`EventSystem.triggerSync: event ${event} is not a valid EventType`);
    }
    
    // 同步触发事件
    globalEventSystem.emit(event, args.length === 1 ? args[0] : args);
  }

  static async clearAllEvents() {
    globalEventSystem.removeAllListeners();
  }

  static setDevMode(enabled: boolean) {
    this.devMode = enabled;
  }
}

/**
 * 获取全局事件系统实例
 */
export function getGlobalEventSystem() {
  return globalEventSystem;
}
