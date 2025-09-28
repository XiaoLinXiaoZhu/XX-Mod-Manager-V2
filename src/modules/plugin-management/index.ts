/**
 * 业务插件管理模块主入口
 * 提供与具体业务相关的插件管理功能
 */

// 类型导出
export * from './types';

// 插件管理器
export { BusinessPluginManagerImpl, createBusinessPluginManager } from './plugin-manager';
