/**
 * 插件系统 Kernel 模块主入口
 * 提供与业务完全解耦的通用插件系统能力
 * 支持泛型，让使用者可以定义自己的插件类型和环境
 */

// 类型导出
export * from './types';

// 插件加载器
export { PluginLoader } from './plugin-loader';
