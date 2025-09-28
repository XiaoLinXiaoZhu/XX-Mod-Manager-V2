/**
 * UI 服务主入口
 * 提供 UI 相关的状态管理和业务逻辑
 */

import { ReactiveStore } from '@/kernels';
import { 
  createRouteConfig,
  validateRouteConfig,
  createInitialRouteState,
  updateRouteState,
  type RouteConfig,
  type RouteState
} from '@/modules/router';
import { 
  createNotificationConfig,
  validateNotificationConfig,
  createInitialNotificationState,
  addNotificationToState,
  removeNotificationFromState,
  clearAllNotifications,
  createSuccessNotification,
  createErrorNotification,
  createWarningNotification,
  createInfoNotification,
  type NotificationConfig,
  type NotificationState,
  type NotificationType
} from '@/modules/notification';
import { 
  UiServiceState, 
  UiServiceConfig, 
  UiServiceOptions, 
  UiServiceEvent,
  UiService as IUiService
} from './types';
import { 
  DEFAULT_UI_SERVICE_CONFIG, 
  DEFAULT_UI_SERVICE_OPTIONS,
  mergeUiServiceConfig
} from './config';
import { EventEmitter } from '@/kernels';

/**
 * UI 服务实现类
 * 管理 UI 相关的状态和操作
 */
export class UiService implements IUiService {
  private stateStore: ReactiveStore<UiServiceState>;
  private config: UiServiceConfig;
  private options: UiServiceOptions;
  private eventSystem: EventEmitter;
  private eventListeners = new Map<UiServiceEvent, Set<(...args: any[]) => void>>();

  constructor(
    config: UiServiceConfig = DEFAULT_UI_SERVICE_CONFIG,
    options: UiServiceOptions = DEFAULT_UI_SERVICE_OPTIONS,
    eventSystem: EventEmitter
  ) {
    this.config = config;
    this.options = options;
    this.eventSystem = eventSystem;
    
    // 初始化状态
    this.stateStore = new ReactiveStore<UiServiceState>('ui-service', {
      routeState: createInitialRouteState(),
      notificationState: createInitialNotificationState(),
      loading: false,
      error: null
    });

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 获取当前状态
   */
  getState(): UiServiceState {
    return this.stateStore.getState();
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<UiServiceConfig>): void {
    this.config = mergeUiServiceConfig(this.config, newConfig);
    this.eventSystem.emit(UiServiceEvent.CONFIG_UPDATED, this.config);
  }

  /**
   * 导航到指定路由
   */
  navigateToRoute(route: string): void {
    const currentState = this.stateStore.getState();
    const newRouteState = updateRouteState(currentState.routeState, route);
    
    this.stateStore.updateState({
      routeState: newRouteState
    });

    this.eventSystem.emit(UiServiceEvent.ROUTE_CHANGED, route);
  }

  /**
   * 显示通知
   */
  showNotification(message: string, type: NotificationType = 'info', options: Partial<NotificationConfig> = {}): void {
    const notification = createNotificationConfig(message, type, options);
    
    const validation = validateNotificationConfig(notification);
    if (!validation.success) {
      console.error('Invalid notification config:', validation.error);
      return;
    }

    const currentState = this.stateStore.getState();
    const newNotificationState = addNotificationToState(currentState.notificationState, notification);
    
    this.stateStore.updateState({
      notificationState: newNotificationState
    });

    this.eventSystem.emit(UiServiceEvent.NOTIFICATION_SHOWN, notification);
  }

  /**
   * 显示成功通知
   */
  showSuccessNotification(message: string): void {
    this.showNotification(message, 'success');
  }

  /**
   * 显示错误通知
   */
  showErrorNotification(message: string): void {
    this.showNotification(message, 'error');
  }

  /**
   * 显示警告通知
   */
  showWarningNotification(message: string): void {
    this.showNotification(message, 'warning');
  }

  /**
   * 显示信息通知
   */
  showInfoNotification(message: string): void {
    this.showNotification(message, 'info');
  }

  /**
   * 移除通知
   */
  removeNotification(index: number): void {
    const currentState = this.stateStore.getState();
    const newNotificationState = removeNotificationFromState(currentState.notificationState, index);
    
    this.stateStore.updateState({
      notificationState: newNotificationState
    });

    this.eventSystem.emit(UiServiceEvent.NOTIFICATION_REMOVED, index);
  }

  /**
   * 清空所有通知
   */
  clearAllNotifications(): void {
    const currentState = this.stateStore.getState();
    const newNotificationState = clearAllNotifications(currentState.notificationState);
    
    this.stateStore.updateState({
      notificationState: newNotificationState
    });

    this.eventSystem.emit(UiServiceEvent.ALL_NOTIFICATIONS_CLEARED);
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void {
    this.stateStore.updateState({ loading });
    this.eventSystem.emit(UiServiceEvent.LOADING_STATE_CHANGED, loading);
  }

  /**
   * 设置错误状态
   */
  setError(error: string | null): void {
    this.stateStore.updateState({ error });
    this.eventSystem.emit(UiServiceEvent.ERROR_STATE_CHANGED, error);
  }

  /**
   * 订阅事件
   */
  on(event: UiServiceEvent, listener: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    return () => {
      this.eventListeners.get(event)?.delete(listener);
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 可以在这里设置一些内部事件监听器
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.eventListeners.clear();
    this.stateStore.destroy();
  }
}

/**
 * 创建 UI 服务实例
 */
export function createUiService(
  config: UiServiceConfig = DEFAULT_UI_SERVICE_CONFIG,
  options: UiServiceOptions = DEFAULT_UI_SERVICE_OPTIONS,
  eventSystem: EventEmitter
): UiService {
  return new UiService(config, options, eventSystem);
}

// 导出类型和配置
export * from './types';
export * from './config';
