/**
 * 路由模块类型定义
 */

/**
 * 路由配置
 */
export interface RouteConfig {
  name: string;
  path: string;
  component: any;
  meta?: {
    title?: string;
    requiresAuth?: boolean;
    [key: string]: any;
  };
}

/**
 * 路由状态
 */
export interface RouteState {
  currentRoute: string;
  previousRoute: string | null;
  history: string[];
}

/**
 * 路由操作结果
 */
export interface RouteOperationResult {
  success: boolean;
  route?: string;
  error?: string;
}
