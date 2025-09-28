/**
 * 插件服务主入口
 * 提供插件管理功能
 */

// 类型导出
export * from './types';

// 插件管理
export * from './plugin-manager';

// 创建默认插件服务实例
import { createPluginService, DEFAULT_PLUGIN_SERVICE_CONFIG } from './plugin-manager';

/**
 * 默认插件服务实例
 */
export const defaultPluginService = createPluginService(DEFAULT_PLUGIN_SERVICE_CONFIG);
