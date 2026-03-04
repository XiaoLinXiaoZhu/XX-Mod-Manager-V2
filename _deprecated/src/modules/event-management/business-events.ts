/**
 * 业务事件类型定义
 * 包含所有与具体业务逻辑相关的事件类型
 */

// 应用生命周期事件
export const APP_EVENTS = {
  APP_START: 'app:start',
  APP_READY: 'app:ready',
  APP_SHUTDOWN: 'app:shutdown',
  
  // 旧系统兼容事件
  WAKE_UP: 'wakeUp',
  INIT_DONE: 'initDone',
  START_DONE: 'startDone',
} as const;

// 配置相关事件
export const CONFIG_EVENTS = {
  CONFIG_LOADED: 'config:loaded',
  CONFIG_CHANGED: 'config:changed',
  CONFIG_SAVED: 'config:saved',
  THEME_CHANGE: 'themeChange',
  LANGUAGE_CHANGE: 'languageChange',
} as const;

// Mod 相关事件
export const MOD_EVENTS = {
  MOD_LOADED: 'mod:loaded',
  MOD_APPLIED: 'mod:applied',
  MOD_REMOVED: 'mod:removed',
  MOD_CHANGED: 'mod:changed',
  MODS_APPLIED: 'modsApplied',
  ADD_MOD: 'addMod',
  TOGGLED_MOD: 'toggledMod',
  LAST_CLICKED_MOD_CHANGED: 'lastClickedModChanged',
  MOD_INFO_CHANGED: 'modInfoChanged',
  CURRENT_MOD_CHANGED: 'currentModChanged',
  MOD_LIST_CHANGED: 'modListChanged',
} as const;

// 预设相关事件
export const PRESET_EVENTS = {
  ADD_PRESET: 'addPreset',
  CURRENT_PRESET_CHANGED: 'currentPresetChanged',
} as const;

// 角色相关事件
export const CHARACTER_EVENTS = {
  CURRENT_CHARACTER_CHANGED: 'currentCharacterChanged',
} as const;

// 插件相关事件
export const PLUGIN_EVENTS = {
  PLUGIN_LOADED: 'plugin:loaded',
  PLUGIN_UNLOADED: 'plugin:unloaded',
  PLUGIN_ERROR: 'plugin:error',
  PLUGIN_ENABLED: 'pluginEnabled',
  PLUGIN_DISABLED: 'pluginDisabled',
} as const;

// 文件系统相关事件
export const FILE_SYSTEM_EVENTS = {
  FILE_CHANGED: 'file:changed',
  DIRECTORY_CHANGED: 'directory:changed',
} as const;

// 窗口相关事件
export const WINDOW_EVENTS = {
  WINDOW_BLUR: 'windowBlur',
  WINDOW_FOCUS: 'windowFocus',
  WINDOW_SLEEP: 'windowSleep',
  WINDOW_WAKE: 'windowWake',
} as const;

// 路由相关事件
export const ROUTE_EVENTS = {
  ROUTE_CHANGED: 'routeChanged',
  CURRENT_TAB_CHANGED: 'currentTabChanged',
} as const;

// 所有业务事件类型
export const BUSINESS_EVENTS = {
  ...APP_EVENTS,
  ...CONFIG_EVENTS,
  ...MOD_EVENTS,
  ...PRESET_EVENTS,
  ...CHARACTER_EVENTS,
  ...PLUGIN_EVENTS,
  ...FILE_SYSTEM_EVENTS,
  ...WINDOW_EVENTS,
  ...ROUTE_EVENTS,
} as const;

// 业务事件类型
export type BusinessEventType = typeof BUSINESS_EVENTS[keyof typeof BUSINESS_EVENTS];

// 应用事件类型
export type AppEventType = typeof APP_EVENTS[keyof typeof APP_EVENTS];

// 配置事件类型
export type ConfigEventType = typeof CONFIG_EVENTS[keyof typeof CONFIG_EVENTS];

// Mod 事件类型
export type ModEventType = typeof MOD_EVENTS[keyof typeof MOD_EVENTS];

// 预设事件类型
export type PresetEventType = typeof PRESET_EVENTS[keyof typeof PRESET_EVENTS];

// 角色事件类型
export type CharacterEventType = typeof CHARACTER_EVENTS[keyof typeof CHARACTER_EVENTS];

// 插件事件类型
export type PluginEventType = typeof PLUGIN_EVENTS[keyof typeof PLUGIN_EVENTS];

// 文件系统事件类型
export type FileSystemEventType = typeof FILE_SYSTEM_EVENTS[keyof typeof FILE_SYSTEM_EVENTS];

// 窗口事件类型
export type WindowEventType = typeof WINDOW_EVENTS[keyof typeof WINDOW_EVENTS];

// 路由事件类型
export type RouteEventType = typeof ROUTE_EVENTS[keyof typeof ROUTE_EVENTS];
