/**
 * 应用服务类型定义
 * 定义应用级别的状态和配置
 */

// 应用状态
export interface AppState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  currentPage: string;
  theme: 'light' | 'dark' | 'auto';
  language: string;
}

// 应用配置
export interface AppConfig {
  version: string;
  environment: 'development' | 'production' | 'test';
  debug: boolean;
  autoUpdate: boolean;
  checkUpdatesOnStart: boolean;
}

// 应用服务事件
export enum AppServiceEvent {
  APP_INITIALIZED = 'app:initialized',
  APP_READY = 'app:ready',
  APP_ERROR = 'app:error',
  THEME_CHANGED = 'app:theme_changed',
  LANGUAGE_CHANGED = 'app:language_changed',
  PAGE_CHANGED = 'app:page_changed'
}

// 应用服务接口
export interface AppService {
  // 状态管理
  getState(): AppState;
  subscribe(listener: (state: AppState) => void): () => void;
  
  // 应用生命周期
  initialize(): Promise<void>;
  ready(): void;
  shutdown(): Promise<void>;
  
  // 状态操作
  setTheme(theme: 'light' | 'dark' | 'auto'): void;
  setLanguage(language: string): void;
  setCurrentPage(page: string): void;
  setError(error: string | null): void;
  clearError(): void;
  
  // 配置管理
  updateConfig(config: Partial<AppConfig>): void;
  getConfig(): AppConfig;
  
  // 事件管理
  on(event: AppServiceEvent, listener: (...args: any[]) => void): () => void;
  off(event: AppServiceEvent, listener: (...args: any[]) => void): void;
  emit(event: AppServiceEvent, ...args: any[]): void;
}
