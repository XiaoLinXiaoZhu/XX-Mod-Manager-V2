/**
 * 插件系统 Kernel 模块主入口
 * 提供与业务解耦的插件系统能力
 */

// 类型导出
export * from './types';

// 插件加载器
export { PluginLoader } from './plugin-loader';

// 插件环境
export { createPluginEnvironment } from './plugin-environment';

// 插件作用域验证器
export { validatePluginScope } from './plugin-scope-validator';
