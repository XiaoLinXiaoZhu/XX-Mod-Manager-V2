/**
 * 事件管理模块主入口
 * 提供业务事件管理功能
 */

// 类型导出
export * from './types';

// 业务事件类型
export * from './business-events';

// 事件管理器
export { BusinessEventManager, createBusinessEventManager } from './event-manager';
