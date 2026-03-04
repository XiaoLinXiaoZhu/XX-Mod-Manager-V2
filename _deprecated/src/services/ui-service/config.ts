/**
 * UI 服务配置
 */

import type { UiServiceConfig, UiServiceOptions } from './types';

/**
 * 默认 UI 服务配置
 */
export const DEFAULT_UI_SERVICE_CONFIG: UiServiceConfig = {
  maxNotifications: 5,
  defaultNotificationDuration: 3000,
  enableRouteHistory: true,
  maxRouteHistory: 50
};

/**
 * 默认 UI 服务选项
 */
export const DEFAULT_UI_SERVICE_OPTIONS: UiServiceOptions = {
  enableLogging: true,
  enableDebugMode: false,
  autoClearNotifications: true,
  clearNotificationDelay: 5000
};

/**
 * 合并 UI 服务配置
 */
export function mergeUiServiceConfig(
  current: UiServiceConfig,
  updates: Partial<UiServiceConfig>
): UiServiceConfig {
  return {
    ...current,
    ...updates
  };
}

/**
 * 合并 UI 服务选项
 */
export function mergeUiServiceOptions(
  current: UiServiceOptions,
  updates: Partial<UiServiceOptions>
): UiServiceOptions {
  return {
    ...current,
    ...updates
  };
}
