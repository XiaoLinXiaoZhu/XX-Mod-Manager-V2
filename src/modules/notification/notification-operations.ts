/**
 * 通知操作函数
 * 提供通知相关的纯函数操作
 */

import { NotificationConfig, NotificationState, NotificationType } from './types';
import { Result, KernelError } from '@/kernels/types';

/**
 * 创建通知配置
 */
export function createNotificationConfig(
  message: string,
  type: NotificationType = 'info',
  options: Partial<NotificationConfig> = {}
): NotificationConfig {
  return {
    message,
    type,
    duration: 3000,
    closable: true,
    position: 'top',
    ...options
  };
}

/**
 * 验证通知配置
 */
export function validateNotificationConfig(config: NotificationConfig): Result<boolean, KernelError> {
  if (!config.message || typeof config.message !== 'string') {
    return {
      success: false,
      error: new KernelError('Invalid notification message', 'INVALID_NOTIFICATION_MESSAGE', { config })
    };
  }

  if (!config.type || !['success', 'error', 'warning', 'info'].includes(config.type)) {
    return {
      success: false,
      error: new KernelError('Invalid notification type', 'INVALID_NOTIFICATION_TYPE', { config })
    };
  }

  return {
    success: true,
    data: true
  };
}

/**
 * 创建初始通知状态
 */
export function createInitialNotificationState(): NotificationState {
  return {
    notifications: [],
    maxNotifications: 5
  };
}

/**
 * 添加通知到状态
 */
export function addNotificationToState(
  currentState: NotificationState,
  notification: NotificationConfig
): NotificationState {
  const newNotifications = [...currentState.notifications, notification];
  
  // 限制最大通知数量
  if (newNotifications.length > currentState.maxNotifications) {
    newNotifications.splice(0, newNotifications.length - currentState.maxNotifications);
  }

  return {
    ...currentState,
    notifications: newNotifications
  };
}

/**
 * 移除通知从状态
 */
export function removeNotificationFromState(
  currentState: NotificationState,
  notificationIndex: number
): NotificationState {
  const newNotifications = currentState.notifications.filter((_, index) => index !== notificationIndex);
  
  return {
    ...currentState,
    notifications: newNotifications
  };
}

/**
 * 清空所有通知
 */
export function clearAllNotifications(currentState: NotificationState): NotificationState {
  return {
    ...currentState,
    notifications: []
  };
}

/**
 * 创建成功通知
 */
export function createSuccessNotification(message: string): NotificationConfig {
  return createNotificationConfig(message, 'success');
}

/**
 * 创建错误通知
 */
export function createErrorNotification(message: string): NotificationConfig {
  return createNotificationConfig(message, 'error', { duration: 5000 });
}

/**
 * 创建警告通知
 */
export function createWarningNotification(message: string): NotificationConfig {
  return createNotificationConfig(message, 'warning');
}

/**
 * 创建信息通知
 */
export function createInfoNotification(message: string): NotificationConfig {
  return createNotificationConfig(message, 'info');
}
