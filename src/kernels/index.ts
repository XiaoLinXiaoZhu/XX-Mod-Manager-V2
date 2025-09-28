/**
 * Kernel 层主入口
 * 提供与业务完全解耦的通用能力
 */

// 文件系统
export * from './file-system';

// 事件系统
export { EventEmitter, EventType } from './event-system';

// 状态管理
export * from './state-manager';

// 配置存储
export * from './config-storage';

// 插件系统
export * from './plugin';

// 验证工具
export * from './validation';

// 工具函数
export * from './utils';

// 图片处理
export * from './image';

// 文件对话框
export * from './file-dialog';

// 下载功能
export * from './download';

// 窗口管理
export * from './window';

// 符号链接
export * from './symlink';

// 脚本加载
export * from './script-loader';

// 通用类型
export * from './types';
