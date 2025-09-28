/**
 * 更新器模块类型定义
 * 定义应用更新相关的类型和接口
 */

// 版本信息
export interface VersionInfo {
  version: string;
  buildNumber: number;
  releaseDate: string;
  notes: string;
  downloadUrl: string;
  checksum: string;
  size: number;
}

// 更新信息
export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  updateInfo?: VersionInfo;
  downloadProgress?: number;
  installProgress?: number;
}

// 更新检查选项
export interface UpdateCheckOptions {
  checkBeta?: boolean;
  checkPrerelease?: boolean;
  timeout?: number;
  retries?: number;
}

// 更新下载选项
export interface UpdateDownloadOptions {
  destination?: string;
  verifyChecksum?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: (filePath: string) => void;
  onError?: (error: Error) => void;
}

// 更新安装选项
export interface UpdateInstallOptions {
  backupCurrent?: boolean;
  restartAfterInstall?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// 更新结果
export interface UpdateResult {
  success: boolean;
  message?: string;
  error?: string;
  version?: string;
  filePath?: string;
}

// 更新状态
export enum UpdateStatus {
  IDLE = 'idle',
  CHECKING = 'checking',
  DOWNLOADING = 'downloading',
  INSTALLING = 'installing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 更新配置
export interface UpdateConfig {
  checkOnStartup: boolean;
  checkInterval: number; // 毫秒
  autoDownload: boolean;
  autoInstall: boolean;
  betaChannel: boolean;
  updateUrl: string;
  fallbackUrls: string[];
}

// 更新统计
export interface UpdateStatistics {
  lastCheckTime: string;
  checkCount: number;
  updateCount: number;
  successRate: number;
  averageCheckTime: number;
  averageDownloadTime: number;
  averageInstallTime: number;
}

// 更新错误
export interface UpdateError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// 版本比较结果
export interface VersionComparison {
  isNewer: boolean;
  isOlder: boolean;
  isSame: boolean;
  difference: 'major' | 'minor' | 'patch' | 'build' | 'none';
  currentVersion: string;
  targetVersion: string;
}

// 更新检查结果
export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  updateInfo?: VersionInfo;
  checkTime: string;
  nextCheckTime: string;
  error?: UpdateError;
}

// 更新下载结果
export interface UpdateDownloadResult {
  success: boolean;
  filePath?: string;
  size?: number;
  downloadTime?: number;
  error?: UpdateError;
}

// 更新安装结果
export interface UpdateInstallResult {
  success: boolean;
  installedVersion?: string;
  installTime?: number;
  error?: UpdateError;
}
