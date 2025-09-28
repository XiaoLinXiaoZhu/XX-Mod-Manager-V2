/**
 * 事件管理模块类型定义
 * 定义业务相关的事件类型和接口
 */

/**
 * 应用生命周期事件
 */
export enum AppLifecycleEvent {
  WAKE_UP = 'wakeUp',
  INIT_DONE = 'initDone',
  START_DONE = 'startDone',
}

/**
 * 插件相关事件
 */
export enum PluginEvent {
  PLUGIN_LOADED = 'pluginLoaded',
  PLUGIN_ENABLED = 'pluginEnabled',
  PLUGIN_DISABLED = 'pluginDisabled',
}

/**
 * 状态变更事件
 */
export enum StateChangeEvent {
  THEME_CHANGE = 'themeChange',
  LANGUAGE_CHANGE = 'languageChange',
  LAST_CLICKED_MOD_CHANGED = 'lastClickedModChanged',
  MOD_INFO_CHANGED = 'modInfoChanged',
  CURRENT_CHARACTER_CHANGED = 'currentCharacterChanged',
  CURRENT_PRESET_CHANGED = 'currentPresetChanged',
  CURRENT_MOD_CHANGED = 'currentModChanged',
  MOD_LIST_CHANGED = 'modListChanged',
  CURRENT_TAB_CHANGED = 'currentTabChanged',
}

/**
 * Mod操作事件
 */
export enum ModOperationEvent {
  MODS_APPLIED = 'modsApplied',
  ADD_MOD = 'addMod',
  ADD_PRESET = 'addPreset',
  TOGGLED_MOD = 'toggledMod',
}

/**
 * 窗口相关事件
 */
export enum WindowEvent {
  WINDOW_BLUR = 'windowBlur',
  WINDOW_FOCUS = 'windowFocus',
  WINDOW_SLEEP = 'windowSleep',
  WINDOW_WAKE = 'windowWake',
}

/**
 * 路由相关事件
 */
export enum RouteEvent {
  ROUTE_CHANGED = 'routeChanged',
}

/**
 * 所有业务事件类型的联合类型
 */
export type BusinessEvent = 
  | AppLifecycleEvent
  | PluginEvent
  | StateChangeEvent
  | ModOperationEvent
  | WindowEvent
  | RouteEvent;

/**
 * 事件数据接口
 */
export interface EventData {
  [key: string]: any;
}

/**
 * 事件监听器接口
 */
export interface EventListener<T = any> {
  (data: T): void | Promise<void>;
}

/**
 * 事件管理器接口
 */
export interface EventManager {
  /**
   * 注册事件监听器
   */
  on<T = any>(event: BusinessEvent, listener: EventListener<T>): string;
  
  /**
   * 移除事件监听器
   */
  off(event: BusinessEvent, listenerId: string): void;
  
  /**
   * 发射事件
   */
  emit<T = any>(event: BusinessEvent, data: T): void;
  
  /**
   * 异步发射事件
   */
  emitAsync<T = any>(event: BusinessEvent, data: T): Promise<void>;
  
  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: BusinessEvent): void;
  
  /**
   * 获取监听器数量
   */
  getListenerCount(event: BusinessEvent): number;
  
  /**
   * 检查是否有监听器
   */
  hasListeners(event: BusinessEvent): boolean;
}
