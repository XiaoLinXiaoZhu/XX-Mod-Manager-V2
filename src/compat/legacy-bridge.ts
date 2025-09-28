/**
 * 旧代码兼容桥接层
 * 提供旧架构代码的兼容接口，逐步迁移到新架构
 */

import { createUiService, DEFAULT_UI_SERVICE_CONFIG, DEFAULT_UI_SERVICE_OPTIONS } from '@/services';
import { EventEmitter } from '@/kernels';

// 创建全局事件系统实例
const globalEventSystem = new EventEmitter();

// 创建全局 UI 服务实例
const globalUiService = createUiService(
  DEFAULT_UI_SERVICE_CONFIG,
  DEFAULT_UI_SERVICE_OPTIONS,
  globalEventSystem
);

/**
 * 兼容的通知函数
 * 替代 $t_snack
 */
export function $t_snack(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
  globalUiService.showNotification(message, type);
}

/**
 * 兼容的路由函数
 * 替代直接的路由操作
 */
export function navigateToRoute(route: string): void {
  globalUiService.navigateToRoute(route);
}

/**
 * 获取全局 UI 服务实例
 */
export function getGlobalUiService() {
  return globalUiService;
}

/**
 * 获取全局事件系统实例
 */
export function getGlobalEventSystem() {
  return globalEventSystem;
}
