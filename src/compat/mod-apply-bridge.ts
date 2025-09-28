/**
 * Mod 应用系统兼容层
 * 提供向后兼容的 Mod 应用 API
 */

import { applyMod, removeMod, isModApplied } from '@/modules/mod-management';
import type { ModInfo, ModApplyOptions } from '@/modules/mod-management';

/**
 * 兼容的 Mod 应用管理器类
 * 提供与旧版本相同的 API
 */
export class ModApplyManager {
  /**
   * 应用 Mod
   */
  async applyMod(mod: ModInfo, targetFolder: string, options?: ModApplyOptions): Promise<boolean> {
    const result = await applyMod(mod, targetFolder, options || {});
    return result.success;
  }

  /**
   * 移除 Mod
   */
  async removeMod(mod: ModInfo, targetFolder: string): Promise<boolean> {
    const result = await removeMod(mod, targetFolder);
    return result.success;
  }

  /**
   * 检查 Mod 是否已应用
   */
  async isModApplied(mod: ModInfo, targetFolder: string): Promise<boolean> {
    const result = await isModApplied(mod, targetFolder);
    return result.success && result.data;
  }
}

// 导出默认实例
export const modApplyManager = new ModApplyManager();
