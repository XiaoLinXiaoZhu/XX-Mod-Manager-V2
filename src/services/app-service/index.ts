/**
 * 应用服务主入口
 * 提供应用级别的状态管理和业务逻辑
 */

import { ReactiveStore } from '@/kernels';
import type { AppState, AppConfig, AppService as IAppService } from './types';
import { AppServiceEvent } from './types';
import { DEFAULT_APP_CONFIG, mergeAppConfig } from './config';

/**
 * 应用服务实现类
 * 管理应用级别的状态和配置
 */
export class AppService implements IAppService {
  private stateStore: ReactiveStore<AppState>;
  private config: AppConfig;
  private eventListeners = new Map<AppServiceEvent, Set<(...args: any[]) => void>>();

  constructor(config: AppConfig = DEFAULT_APP_CONFIG) {
    this.config = config;
    
    // 初始化状态
    this.stateStore = new ReactiveStore<AppState>('app-service', {
      isInitialized: false,
      isLoading: false,
      error: null,
      currentPage: 'main',
      theme: 'dark',
      language: 'zh-CN'
    });

    // 设置事件监听器
    this.setupEventListeners();
  }

  /**
   * 获取当前状态
   */
  getState(): AppState {
    return this.stateStore.getState();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: AppState) => void): () => void {
    return this.stateStore.subscribe(listener);
  }

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    try {
      // 模拟初始化过程
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.updateState({
        isInitialized: true,
        isLoading: false,
        error: null
      });

      this.emit(AppServiceEvent.APP_INITIALIZED);
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error instanceof Error ? error.message : String(error)
      });

      this.emit(AppServiceEvent.APP_ERROR, error);
      throw error;
    }
  }

  /**
   * 应用准备就绪
   */
  ready(): void {
    this.updateState({
      isLoading: false,
      error: null
    });

    this.emit(AppServiceEvent.APP_READY);
  }

  /**
   * 关闭应用
   */
  async shutdown(): Promise<void> {
    try {
      // 清理资源
      this.eventListeners.clear();
      
      this.emit(AppServiceEvent.APP_READY);
    } catch (error) {
      console.error('Error during app shutdown:', error);
    }
  }

  /**
   * 设置主题
   */
  setTheme(theme: 'light' | 'dark' | 'auto'): void {
    this.updateState({ theme });
    this.emit(AppServiceEvent.THEME_CHANGED, theme);
  }

  /**
   * 设置语言
   */
  setLanguage(language: string): void {
    this.updateState({ language });
    this.emit(AppServiceEvent.LANGUAGE_CHANGED, language);
  }

  /**
   * 设置当前页面
   */
  setCurrentPage(page: 'gamePage' | 'modListPage' | 'main'): void {
    this.updateState({ currentPage: page });
    this.emit(AppServiceEvent.PAGE_CHANGED, page);
  }

  /**
   * 设置错误
   */
  setError(error: string | null): void {
    this.updateState({ error });
    if (error) {
      this.emit(AppServiceEvent.APP_ERROR, error);
    }
  }

  /**
   * 清除错误
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<AppConfig>): void {
    this.config = mergeAppConfig(this.config, config);
  }

  /**
   * 获取配置
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 事件管理
   */
  on(event: AppServiceEvent, listener: (...args: any[]) => void): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    
    this.eventListeners.get(event)!.add(listener);
    
    return () => {
      this.off(event, listener);
    };
  }

  off(event: AppServiceEvent, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  emit(event: AppServiceEvent, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * 更新状态
   */
  private updateState(updates: Partial<AppState>): void {
    const currentState = this.getState();
    this.stateStore.setState({
      ...currentState,
      ...updates
    });
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 这里可以添加事件监听器
    // 目前暂时留空，因为事件系统会在外部设置
  }
}

/**
 * 创建应用服务工厂
 */
export function createAppService(config: AppConfig = DEFAULT_APP_CONFIG): AppService {
  return new AppService(config);
}

// 导出类型
export * from './types';
export * from './config';
