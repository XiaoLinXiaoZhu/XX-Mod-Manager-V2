/**
 * 路由系统兼容层
 * 提供向后兼容的路由 API
 */

import { createRouterManager } from '@/modules/router';
import type { RouterManager, RouteConfig, RouteState } from '@/modules/router';

// 创建默认的路由管理器实例
const defaultRouterManager = createRouterManager();

/**
 * 兼容的路由管理器类
 * 提供与旧版本相同的 API
 */
export class Router {
  private routerManager: RouterManager;

  constructor() {
    this.routerManager = defaultRouterManager;
  }

  /**
   * 导航到指定路由
   */
  push(path: string): void {
    this.routerManager.navigateTo(path);
  }

  /**
   * 替换当前路由
   */
  replace(path: string): void {
    this.routerManager.replaceRoute(path);
  }

  /**
   * 返回上一页
   */
  back(): void {
    this.routerManager.goBack();
  }

  /**
   * 前进到下一页
   */
  forward(): void {
    this.routerManager.goForward();
  }

  /**
   * 获取当前路由
   */
  getCurrentRoute(): string {
    return this.routerManager.getCurrentRoute();
  }

  /**
   * 获取路由历史
   */
  getHistory(): string[] {
    return this.routerManager.getHistory();
  }

  /**
   * 检查路由是否存在
   */
  hasRoute(path: string): boolean {
    return this.routerManager.hasRoute(path);
  }
}

// 导出默认实例
export const router = new Router();
