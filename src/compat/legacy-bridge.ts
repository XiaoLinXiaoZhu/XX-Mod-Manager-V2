/**
 * 旧代码兼容桥接层主入口
 * 提供旧架构代码的兼容接口，逐步迁移到新架构
 * 
 * 此文件仅作为重新导出入口，具体实现分散在各个专门的桥接文件中
 */

// 状态管理兼容接口
export * from './state-bridge';

// 事件系统兼容接口
export * from './event-bridge';

// 配置系统兼容接口
export * from './config-bridge';

// 国际化系统兼容接口
export * from './i18n-bridge';

// 插件系统兼容接口
export * from './plugin-bridge';

// 文件系统兼容接口
export * from './filesystem-bridge';

// 通知系统兼容接口
export * from './notification-bridge';

// Mod 管理兼容接口
export * from './mod-bridge';

// 路由功能兼容接口
export * from './router-bridge';

// 仓库功能兼容接口
export * from './repository-bridge';

// 更新器功能兼容接口
export * from './updater-bridge';

// 设置功能兼容接口
export * from './settings-bridge';

// Mod 应用功能兼容接口
export * from './mod-apply-bridge';
