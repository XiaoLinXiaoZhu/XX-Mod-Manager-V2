/**
 * Mod 应用功能兼容桥接层
 * 提供旧 Mod 应用系统的兼容接口
 */

import { 
  applyMod as newApplyMod,
  type ModApplyConfig,
  type ModApplyResult
} from '@/modules/mod-management';

// 兼容的 Mod 应用函数
export async function applyMod(config: ModApplyConfig): Promise<ModApplyResult> {
  return await newApplyMod(config);
}

// 兼容的 Mod 应用对象
export const modApply = {
  // 应用 Mod
  apply: (config: ModApplyConfig) => newApplyMod(config),
  
  // 撤销 Mod
  revert: (config: ModApplyConfig) => newApplyMod({ ...config, revert: true }),
  
  // 验证 Mod
  validate: (config: ModApplyConfig) => newApplyMod({ ...config, validate: true }),
  
  // 事件监听
  on: (event: string, callback: Function) => {
    // 桥接到新架构的事件系统
    console.log(`Mod apply event: ${event}`, callback);
  },
  off: (event: string, callback: Function) => {
    // 桥接到新架构的事件系统
    console.log(`Mod apply event off: ${event}`, callback);
  },
  emit: (event: string, ...args: any[]) => {
    // 桥接到新架构的事件系统
    console.log(`Mod apply event emit: ${event}`, args);
  }
};

// 导出类型
export type { ModApplyConfig, ModApplyResult };
