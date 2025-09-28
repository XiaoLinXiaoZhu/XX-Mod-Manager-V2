/**
 * UI 服务类型定义
 */

import { RouteState } from '@/modules/router';
import { NotificationState } from '@/modules/notification';

/**
 * UI 服务状态
 */
export interface UiServiceState {
  routeState: RouteState;
  notificationState: NotificationState;
  loading: boolean;
  error: string | null;
}

/**
 * UI 服务配置
 */
export interface UiServiceConfig {
  maxNotifications: number;
  defaultNotificationDuration: number;
  enableRouteHistory: boolean;
  maxRouteHistory: number;
}

/**
 * UI 服务选项
 */
export interface UiServiceOptions {
  enableLogging: boolean;
  enableDebugMode: boolean;
  autoClearNotifications: boolean;
  clearNotificationDelay: number;
}

/**
 * UI 服务事件类型
 */
export enum UiServiceEvent {
  ROUTE_CHANGED = 'route:changed',
  NOTIFICATION_SHOWN = 'notification:shown',
  NOTIFICATION_REMOVED = 'notification:removed',
  ALL_NOTIFICATIONS_CLEARED = 'notifications:cleared',
  LOADING_STATE_CHANGED = 'loading:changed',
  ERROR_STATE_CHANGED = 'error:changed',
  CONFIG_UPDATED = 'config:updated'
}

/**
 * UI 服务接口
 */
export interface UiService {
  getState(): UiServiceState;
  updateConfig(config: Partial<UiServiceConfig>): void;
  navigateToRoute(route: string): void;
  showNotification(message: string, type?: string, options?: any): void;
  showSuccessNotification(message: string): void;
  showErrorNotification(message: string): void;
  showWarningNotification(message: string): void;
  showInfoNotification(message: string): void;
  removeNotification(index: number): void;
  clearAllNotifications(): void;
  setLoading(loading: boolean): void;
  setError(error: string | null): void;
  on(event: UiServiceEvent, listener: (...args: any[]) => void): () => void;
  destroy(): void;
}
