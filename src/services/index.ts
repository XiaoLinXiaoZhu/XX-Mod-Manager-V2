/**
 * 服务层主入口
 * 提供应用的状态管理和副作用处理
 */

// Mod 服务
export * from './mod-service';

// 应用服务
export * from './app-service';

// 配置服务
export * from './config-service';

// 插件服务
export * from './plugin-service';

// UI 服务
export * from './ui-service';

// 导出工厂函数和配置
export { createModService, DEFAULT_MOD_SERVICE_CONFIG, DEFAULT_MOD_SERVICE_OPTIONS } from './mod-service';
export { createAppService, DEFAULT_APP_CONFIG } from './app-service';
export { createConfigService, DEFAULT_CONFIG_SERVICE_CONFIG } from './config-service';
export { createPluginService, DEFAULT_PLUGIN_SERVICE_CONFIG } from './plugin-service';
export { createUiService, DEFAULT_UI_SERVICE_CONFIG, DEFAULT_UI_SERVICE_OPTIONS } from './ui-service';
