/**
 * 配置服务主入口
 * 提供应用配置管理功能
 */

// 类型导出
export * from './types';

// 配置管理
export * from './config-manager';

// 创建默认配置服务实例
import { createConfigService, DEFAULT_CONFIG_SERVICE_OPTIONS } from './config-manager';

/**
 * 默认配置服务实例
 */
export const defaultConfigService = createConfigService(DEFAULT_CONFIG_SERVICE_OPTIONS);
