/**
 * 更新检查模块
 * 提供应用更新检查相关的纯函数
 */

import { UpdateStatus } from './types';
import type { UpdateInfo, UpdateCheckOptions, UpdateCheckResult, UpdateConfig, VersionInfo } from './types';
import type { Result, KernelError } from '@/kernels/types';
import { compareVersions, isVersionNewer, isStableVersion, isPrereleaseVersion } from './version-info';
import type { validateVersionInfo } from './version-info';

// 默认更新检查选项
const DEFAULT_CHECK_OPTIONS: Required<UpdateCheckOptions> = {
  checkBeta: false,
  checkPrerelease: false,
  timeout: 30000,
  retries: 3
};

/**
 * 验证更新检查选项
 */
export function validateUpdateCheckOptions(
  options: UpdateCheckOptions = {}
): Result<UpdateCheckOptions, KernelError> {
  const opts = { ...DEFAULT_CHECK_OPTIONS, ...options };

  if (typeof opts.checkBeta !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'checkBeta must be a boolean',
        'INVALID_CHECK_BETA',
        { checkBeta: opts.checkBeta }
      )
    };
  }

  if (typeof opts.checkPrerelease !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'checkPrerelease must be a boolean',
        'INVALID_CHECK_PRERELEASE',
        { checkPrerelease: opts.checkPrerelease }
      )
    };
  }

  if (typeof opts.timeout !== 'number' || opts.timeout < 1000) {
    return {
      success: false,
      error: new KernelError(
        'timeout must be a number >= 1000',
        'INVALID_TIMEOUT',
        { timeout: opts.timeout }
      )
    };
  }

  if (typeof opts.retries !== 'number' || opts.retries < 0) {
    return {
      success: false,
      error: new KernelError(
        'retries must be a non-negative number',
        'INVALID_RETRIES',
        { retries: opts.retries }
      )
    };
  }

  return {
    success: true,
    data: opts
  };
}

/**
 * 验证更新配置
 */
export function validateUpdateConfig(config: unknown): Result<UpdateConfig, KernelError> {
  if (!config || typeof config !== 'object') {
    return {
      success: false,
      error: new KernelError(
        'Update config must be an object',
        'INVALID_UPDATE_CONFIG',
        { config }
      )
    };
  }

  const cfg = config as Record<string, unknown>;

  // 验证必需字段
  const requiredFields = ['checkOnStartup', 'checkInterval', 'autoDownload', 'autoInstall', 'updateUrl'];
  for (const field of requiredFields) {
    if (cfg[field] === undefined) {
      return {
        success: false,
        error: new KernelError(
          `Missing required field: ${field}`,
          'MISSING_REQUIRED_FIELD',
          { field, config: cfg }
        )
      };
    }
  }

  // 验证字段类型
  if (typeof cfg.checkOnStartup !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'checkOnStartup must be a boolean',
        'INVALID_CHECK_ON_STARTUP',
        { checkOnStartup: cfg.checkOnStartup }
      )
    };
  }

  if (typeof cfg.checkInterval !== 'number' || cfg.checkInterval < 0) {
    return {
      success: false,
      error: new KernelError(
        'checkInterval must be a non-negative number',
        'INVALID_CHECK_INTERVAL',
        { checkInterval: cfg.checkInterval }
      )
    };
  }

  if (typeof cfg.autoDownload !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'autoDownload must be a boolean',
        'INVALID_AUTO_DOWNLOAD',
        { autoDownload: cfg.autoDownload }
      )
    };
  }

  if (typeof cfg.autoInstall !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'autoInstall must be a boolean',
        'INVALID_AUTO_INSTALL',
        { autoInstall: cfg.autoInstall }
      )
    };
  }

  if (typeof cfg.updateUrl !== 'string' || cfg.updateUrl.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'updateUrl must be a non-empty string',
        'INVALID_UPDATE_URL',
        { updateUrl: cfg.updateUrl }
      )
    };
  }

  if (cfg.fallbackUrls && !Array.isArray(cfg.fallbackUrls)) {
    return {
      success: false,
      error: new KernelError(
        'fallbackUrls must be an array',
        'INVALID_FALLBACK_URLS',
        { fallbackUrls: cfg.fallbackUrls }
      )
    };
  }

  if (typeof cfg.betaChannel !== 'boolean') {
    return {
      success: false,
      error: new KernelError(
        'betaChannel must be a boolean',
        'INVALID_BETA_CHANNEL',
        { betaChannel: cfg.betaChannel }
      )
    };
  }

  return {
    success: true,
    data: {
      checkOnStartup: cfg.checkOnStartup as boolean,
      checkInterval: cfg.checkInterval as number,
      autoDownload: cfg.autoDownload as boolean,
      autoInstall: cfg.autoInstall as boolean,
      betaChannel: (cfg.betaChannel as boolean) || false,
      updateUrl: cfg.updateUrl as string,
      fallbackUrls: (cfg.fallbackUrls as string[]) || []
    }
  };
}

/**
 * 检查是否有更新
 */
export function checkForUpdate(
  currentVersion: string,
  latestVersionInfo: VersionInfo,
  options: UpdateCheckOptions = {}
): Result<UpdateInfo, KernelError> {
  const optionsValidation = validateUpdateCheckOptions(options);
  if (!optionsValidation.success) {
    return optionsValidation;
  }

  const opts = optionsValidation.data;

  // 验证当前版本
  const currentVersionValidation = compareVersions(currentVersion, currentVersion);
  if (!currentVersionValidation.success) {
    return currentVersionValidation;
  }

  // 验证最新版本信息
  const versionInfoValidation = validateVersionInfo(latestVersionInfo);
  if (!versionInfoValidation.success) {
    return versionInfoValidation;
  }

  const latestVersion = versionInfoValidation.data;

  // 检查版本类型是否符合要求
  if (!opts.checkBeta && !opts.checkPrerelease) {
    const isStable = isStableVersion(latestVersion.version);
    if (!isStable.success || !isStable.data) {
      return {
        success: false,
        error: new KernelError(
          'Latest version is not stable and beta/prerelease checking is disabled',
          'VERSION_NOT_STABLE',
          { 
            latestVersion: latestVersion.version,
            checkBeta: opts.checkBeta,
            checkPrerelease: opts.checkPrerelease
          }
        )
      };
    }
  }

  // 比较版本
  const versionComparison = compareVersions(currentVersion, latestVersion.version);
  if (!versionComparison.success) {
    return versionComparison;
  }

  const hasUpdate = versionComparison.data.isNewer;

  return {
    success: true,
    data: {
      currentVersion,
      latestVersion: latestVersion.version,
      hasUpdate,
      updateInfo: hasUpdate ? latestVersion : undefined
    }
  };
}

/**
 * 生成更新检查结果
 */
export function generateUpdateCheckResult(
  currentVersion: string,
  latestVersionInfo: VersionInfo | null,
  options: UpdateCheckOptions = {},
  error?: Error
): UpdateCheckResult {
  const now = new Date().toISOString();
  const nextCheckTime = new Date(Date.now() + (options.timeout || 30000)).toISOString();

  if (error) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      checkTime: now,
      nextCheckTime,
      error: {
        code: 'UPDATE_CHECK_ERROR',
        message: error.message,
        details: { error: error.name, stack: error.stack },
        timestamp: now
      }
    };
  }

  if (!latestVersionInfo) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      checkTime: now,
      nextCheckTime,
      error: {
        code: 'NO_UPDATE_INFO',
        message: 'No update information available',
        details: {},
        timestamp: now
      }
    };
  }

  const updateCheck = checkForUpdate(currentVersion, latestVersionInfo, options);
  if (!updateCheck.success) {
    return {
      hasUpdate: false,
      currentVersion,
      latestVersion: currentVersion,
      checkTime: now,
      nextCheckTime,
      error: {
        code: updateCheck.error.code,
        message: updateCheck.error.message,
        details: updateCheck.error.details,
        timestamp: now
      }
    };
  }

  const updateInfo = updateCheck.data;

  return {
    hasUpdate: updateInfo.hasUpdate,
    currentVersion: updateInfo.currentVersion,
    latestVersion: updateInfo.latestVersion,
    updateInfo: updateInfo.updateInfo,
    checkTime: now,
    nextCheckTime
  };
}

/**
 * 检查更新配置是否有效
 */
export function isUpdateConfigValid(config: UpdateConfig): boolean {
  const validation = validateUpdateConfig(config);
  return validation.success;
}

/**
 * 检查是否应该检查更新
 */
export function shouldCheckForUpdate(
  config: UpdateConfig,
  lastCheckTime: string | null,
  currentTime: number = Date.now()
): boolean {
  if (!config.checkOnStartup) {
    return false;
  }

  if (!lastCheckTime) {
    return true;
  }

  const lastCheck = new Date(lastCheckTime).getTime();
  const timeSinceLastCheck = currentTime - lastCheck;
  
  return timeSinceLastCheck >= config.checkInterval;
}

/**
 * 计算下次检查时间
 */
export function calculateNextCheckTime(
  config: UpdateConfig,
  currentTime: number = Date.now()
): string {
  const nextCheckTime = new Date(currentTime + config.checkInterval);
  return nextCheckTime.toISOString();
}

/**
 * 检查更新状态
 */
export function getUpdateStatus(
  updateInfo: UpdateInfo
): UpdateStatus {
  if (updateInfo.downloadProgress !== undefined) {
    return UpdateStatus.DOWNLOADING;
  }
  
  if (updateInfo.installProgress !== undefined) {
    return UpdateStatus.INSTALLING;
  }
  
  if (updateInfo.hasUpdate) {
    return UpdateStatus.CHECKING;
  }
  
  return UpdateStatus.IDLE;
}

/**
 * 检查更新是否可用
 */
export function isUpdateAvailable(updateInfo: UpdateInfo): boolean {
  return updateInfo.hasUpdate && !!updateInfo.updateInfo;
}

/**
 * 检查更新是否正在下载
 */
export function isUpdateDownloading(updateInfo: UpdateInfo): boolean {
  return updateInfo.downloadProgress !== undefined;
}

/**
 * 检查更新是否正在安装
 */
export function isUpdateInstalling(updateInfo: UpdateInfo): boolean {
  return updateInfo.installProgress !== undefined;
}

/**
 * 获取更新进度
 */
export function getUpdateProgress(updateInfo: UpdateInfo): number {
  if (updateInfo.downloadProgress !== undefined) {
    return updateInfo.downloadProgress;
  }
  
  if (updateInfo.installProgress !== undefined) {
    return updateInfo.installProgress;
  }
  
  return 0;
}

/**
 * 检查更新是否完成
 */
export function isUpdateComplete(updateInfo: UpdateInfo): boolean {
  return updateInfo.downloadProgress === 100 && updateInfo.installProgress === 100;
}

/**
 * 生成更新摘要
 */
export function generateUpdateSummary(updateInfo: UpdateInfo): string {
  if (!updateInfo.hasUpdate || !updateInfo.updateInfo) {
    return 'No updates available';
  }

  const { currentVersion, latestVersion, updateInfo: info } = updateInfo;
  
  return `Update available: ${currentVersion} → ${latestVersion}${info.notes ? `\n\n${info.notes}` : ''}`;
}

/**
 * 检查更新是否安全
 */
export function isUpdateSafe(updateInfo: UpdateInfo): boolean {
  if (!updateInfo.updateInfo) {
    return false;
  }

  const { checksum, size } = updateInfo.updateInfo;
  
  // 检查是否有校验和
  if (!checksum || checksum.trim().length === 0) {
    return false;
  }
  
  // 检查文件大小是否合理
  if (size <= 0 || size > 1024 * 1024 * 1024) { // 1GB 限制
    return false;
  }
  
  return true;
}
