/**
 * 路由操作函数
 * 提供路由相关的纯函数操作
 */

import type { RouteConfig, RouteState, RouteOperationResult } from './types';
import type { Result, KernelError } from '@/kernels/types';

/**
 * 创建路由配置
 */
export function createRouteConfig(
  name: string,
  path: string,
  component: any,
  meta?: Record<string, any>
): RouteConfig {
  return {
    name,
    path,
    component,
    meta: {
      title: name,
      requiresAuth: false,
      ...meta
    }
  };
}

/**
 * 验证路由配置
 */
export function validateRouteConfig(config: RouteConfig): Result<boolean, KernelError> {
  if (!config.name || typeof config.name !== 'string') {
    return {
      success: false,
      error: new KernelError('Invalid route name', 'INVALID_ROUTE_NAME', { config })
    };
  }

  if (!config.path || typeof config.path !== 'string') {
    return {
      success: false,
      error: new KernelError('Invalid route path', 'INVALID_ROUTE_PATH', { config })
    };
  }

  if (!config.component) {
    return {
      success: false,
      error: new KernelError('Invalid route component', 'INVALID_ROUTE_COMPONENT', { config })
    };
  }

  return {
    success: true,
    data: true
  };
}

/**
 * 检查路由是否需要认证
 */
export function requiresAuthentication(config: RouteConfig): boolean {
  return config.meta?.requiresAuth === true;
}

/**
 * 获取路由标题
 */
export function getRouteTitle(config: RouteConfig): string {
  return config.meta?.title || config.name;
}

/**
 * 创建初始路由状态
 */
export function createInitialRouteState(): RouteState {
  return {
    currentRoute: '/',
    previousRoute: null,
    history: ['/']
  };
}

/**
 * 更新路由状态
 */
export function updateRouteState(
  currentState: RouteState,
  newRoute: string
): RouteState {
  return {
    currentRoute: newRoute,
    previousRoute: currentState.currentRoute,
    history: [...currentState.history, newRoute]
  };
}
