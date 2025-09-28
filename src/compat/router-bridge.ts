/**
 * 路由功能兼容桥接层
 * 提供旧路由系统的兼容接口
 */

import { 
  createRouter,
  type RouterConfig,
  type Route
} from '@/modules/router';

// 创建默认路由配置
const defaultRouterConfig: RouterConfig = {
  routes: [],
  defaultRoute: 'main',
  historyMode: 'hash'
};

// 创建全局路由实例
const globalRouter = createRouter(defaultRouterConfig);

// 兼容的路由对象
export const router = {
  // 路由方法
  push: (route: string) => globalRouter.push(route),
  replace: (route: string) => globalRouter.replace(route),
  go: (delta: number) => globalRouter.go(delta),
  back: () => globalRouter.back(),
  forward: () => globalRouter.forward(),
  
  // 路由状态
  get currentRoute() { return globalRouter.currentRoute; },
  get history() { return globalRouter.history; },
  
  // 路由配置
  addRoute: (route: Route) => globalRouter.addRoute(route),
  removeRoute: (name: string) => globalRouter.removeRoute(name),
  
  // 事件监听
  on: (event: string, callback: Function) => globalRouter.on(event, callback),
  off: (event: string, callback: Function) => globalRouter.off(event, callback),
  emit: (event: string, ...args: any[]) => globalRouter.emit(event, ...args)
};

// 导出路由列表
export const routes = globalRouter.routes;

// 导出路由列表组件
export { default as RouteList } from '@/ui/pages/RouteList.vue';

// 导出类型
export type { Route, RouterConfig };
