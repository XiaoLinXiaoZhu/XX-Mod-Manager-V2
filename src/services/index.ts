/**
 * 服务层主入口
 * 提供应用的状态管理和副作用处理
 */

// Mod 服务
export * from './mod-service';

// 应用服务
export * from './app-service';

// 创建默认服务实例
import { createModService, DEFAULT_MOD_SERVICE_CONFIG, DEFAULT_MOD_SERVICE_OPTIONS } from './mod-service';
import { createAppService, DEFAULT_APP_CONFIG } from './app-service';

/**
 * 默认 Mod 服务实例
 */
export const defaultModService = createModService(DEFAULT_MOD_SERVICE_CONFIG, DEFAULT_MOD_SERVICE_OPTIONS);

/**
 * 默认应用服务实例
 */
export const defaultAppService = createAppService(DEFAULT_APP_CONFIG);
