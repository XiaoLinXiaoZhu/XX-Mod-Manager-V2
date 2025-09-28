/**
 * 事件系统 Kernel 类型定义
 */

// 事件监听器类型
export type EventListener<T = any> = (data: T) => void;

// 事件监听器选项
export interface EventListenerOptions {
  once?: boolean;
  priority?: number;
}

// 事件监听器信息
export interface EventListenerInfo<T = any> {
  listener: EventListener<T>;
  options: EventListenerOptions;
  id: string;
}

// 事件系统接口
export interface EventSystem {
  on<T = any>(event: string, listener: EventListener<T>, options?: EventListenerOptions): string;
  off(event: string, listenerId: string): void;
  emit<T = any>(event: string, data: T): void;
  once<T = any>(event: string, listener: EventListener<T>): string;
  removeAllListeners(event?: string): void;
  getListenerCount(event: string): number;
  getEventNames(): string[];
}

// 事件类型枚举
export enum EventType {
  // 应用生命周期事件
  APP_START = 'app:start',
  APP_READY = 'app:ready',
  APP_SHUTDOWN = 'app:shutdown',
  
  // 旧系统兼容事件
  WAKE_UP = 'wakeUp',
  INIT_DONE = 'initDone',
  START_DONE = 'startDone',
  
  // 配置相关事件
  CONFIG_LOADED = 'config:loaded',
  CONFIG_CHANGED = 'config:changed',
  CONFIG_SAVED = 'config:saved',
  THEME_CHANGE = 'themeChange',
  LANGUAGE_CHANGE = 'languageChange',
  
  // Mod 相关事件
  MOD_LOADED = 'mod:loaded',
  MOD_APPLIED = 'mod:applied',
  MOD_REMOVED = 'mod:removed',
  MOD_CHANGED = 'mod:changed',
  MODS_APPLIED = 'modsApplied',
  ADD_MOD = 'addMod',
  TOGGLED_MOD = 'toggledMod',
  LAST_CLICKED_MOD_CHANGED = 'lastClickedModChanged',
  MOD_INFO_CHANGED = 'modInfoChanged',
  CURRENT_MOD_CHANGED = 'currentModChanged',
  MOD_LIST_CHANGED = 'modListChanged',
  
  // 预设相关事件
  ADD_PRESET = 'addPreset',
  CURRENT_PRESET_CHANGED = 'currentPresetChanged',
  
  // 角色相关事件
  CURRENT_CHARACTER_CHANGED = 'currentCharacterChanged',
  
  // 插件相关事件
  PLUGIN_LOADED = 'plugin:loaded',
  PLUGIN_UNLOADED = 'plugin:unloaded',
  PLUGIN_ERROR = 'plugin:error',
  PLUGIN_ENABLED = 'pluginEnabled',
  PLUGIN_DISABLED = 'pluginDisabled',
  
  // 文件系统相关事件
  FILE_CHANGED = 'file:changed',
  DIRECTORY_CHANGED = 'directory:changed',
  
  // 窗口相关事件
  WINDOW_BLUR = 'windowBlur',
  WINDOW_FOCUS = 'windowFocus',
  WINDOW_SLEEP = 'windowSleep',
  WINDOW_WAKE = 'windowWake',
  
  // 路由相关事件
  ROUTE_CHANGED = 'routeChanged',
  CURRENT_TAB_CHANGED = 'currentTabChanged',
  
  // 错误相关事件
  ERROR_OCCURRED = 'error:occurred',
  WARNING_OCCURRED = 'warning:occurred',
}
