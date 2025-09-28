/**
 * 更新器系统兼容层
 * 提供向后兼容的更新器 API
 */

import { createUpdateChecker } from '@/modules/updater';
import type { UpdateChecker, VersionInfo, UpdateCheckResult } from '@/modules/updater';

// 创建默认的更新检查器实例
const defaultUpdateChecker = createUpdateChecker();

/**
 * 兼容的更新器类
 * 提供与旧版本相同的 API
 */
export class Updater {
  private updateChecker: UpdateChecker;

  constructor() {
    this.updateChecker = defaultUpdateChecker;
  }

  /**
   * 检查更新
   */
  async checkForUpdates(): Promise<UpdateCheckResult> {
    return await this.updateChecker.checkForUpdates();
  }

  /**
   * 获取当前版本信息
   */
  getCurrentVersion(): VersionInfo {
    return this.updateChecker.getCurrentVersion();
  }

  /**
   * 下载更新
   */
  async downloadUpdate(versionInfo: VersionInfo): Promise<boolean> {
    return await this.updateChecker.downloadUpdate(versionInfo);
  }

  /**
   * 安装更新
   */
  async installUpdate(versionInfo: VersionInfo): Promise<boolean> {
    return await this.updateChecker.installUpdate(versionInfo);
  }
}

// 导出默认实例
export const updater = new Updater();
