/**
 * 通知模块类型定义
 */

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * 通知配置
 */
export interface NotificationConfig {
  message: string;
  type: NotificationType;
  duration?: number;
  closable?: boolean;
  position?: 'top' | 'bottom' | 'center';
}

/**
 * 通知状态
 */
export interface NotificationState {
  notifications: NotificationConfig[];
  maxNotifications: number;
}

/**
 * 通知操作结果
 */
export interface NotificationOperationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}
