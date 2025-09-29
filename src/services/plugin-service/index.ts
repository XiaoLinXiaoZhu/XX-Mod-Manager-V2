/**
 * 插件服务主入口
 * 提供插件状态管理和业务编排
 */

// 类型导出
export * from './types';

// 服务实现
export * from './plugin-service';

// 创建默认实例
import { createPluginService, DEFAULT_PLUGIN_SERVICE_OPTIONS } from './plugin-service';
export const defaultPluginService = createPluginService(DEFAULT_PLUGIN_SERVICE_OPTIONS);