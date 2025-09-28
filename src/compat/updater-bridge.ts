/**
 * 更新器功能兼容桥接层
 * 提供旧更新器系统的兼容接口
 */

import { 
  createUpdateChecker,
  createVersionInfo,
  type UpdateChecker,
  type VersionInfo
} from '@/modules/updater';

// 创建全局更新检查器实例
const globalUpdateChecker = createUpdateChecker();

// 创建全局版本信息实例
const globalVersionInfo = createVersionInfo();

// 兼容的更新检查函数
export async function checkForUpdates(): Promise<boolean> {
  return await globalUpdateChecker.checkForUpdates();
}

// 兼容的版本数据
export const versionData = {
  get currentVersion() { return globalVersionInfo.currentVersion; },
  get latestVersion() { return globalVersionInfo.latestVersion; },
  get updateAvailable() { return globalVersionInfo.updateAvailable; },
  get releaseNotes() { return globalVersionInfo.releaseNotes; },
  get downloadUrl() { return globalVersionInfo.downloadUrl; },
  get releaseDate() { return globalVersionInfo.releaseDate; }
};

// 兼容的版本信息函数
export function getVersionInfo(): VersionInfo {
  return globalVersionInfo.getVersionInfo();
}

export function getVersionNote(): string {
  return globalVersionInfo.getReleaseNotes();
}

// 兼容的更新器对象
export const updater = {
  // 更新检查
  checkForUpdates: () => globalUpdateChecker.checkForUpdates(),
  downloadUpdate: () => globalUpdateChecker.downloadUpdate(),
  installUpdate: () => globalUpdateChecker.installUpdate(),
  
  // 版本信息
  getCurrentVersion: () => globalVersionInfo.getCurrentVersion(),
  getLatestVersion: () => globalVersionInfo.getLatestVersion(),
  getReleaseNotes: () => globalVersionInfo.getReleaseNotes(),
  
  // 事件监听
  on: (event: string, callback: Function) => globalUpdateChecker.on(event, callback),
  off: (event: string, callback: Function) => globalUpdateChecker.off(event, callback),
  emit: (event: string, ...args: any[]) => globalUpdateChecker.emit(event, ...args)
};

// 导出类型
export type { UpdateChecker, VersionInfo };
