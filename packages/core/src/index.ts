/**
 * @xxmm/core - XX Mod Manager 核心功能
 */

// 重新导出 ini-parser
export * from '@xxmm/ini-parser';

// 冲突检测
export * from './conflict-detector';

// 角色识别
export * from './character-types';
export * from './character-recognizer';

// Mod 启用/禁用（符号链接管理）
export * from './mod-linker';

// Preset/Pack/Mod 层级管理
export * from './preset-manager';

// 快捷键识别与管理
export * from './key-manager';
