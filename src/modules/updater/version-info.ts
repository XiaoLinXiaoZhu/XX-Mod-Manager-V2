/**
 * 版本信息模块
 * 提供版本相关的纯函数
 */

import { VersionInfo, VersionComparison, UpdateConfig } from './types';
import { Result, KernelError } from '@/kernels/types';

// 版本号正则表达式
const VERSION_REGEX = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$/;

// 版本号部分
interface VersionParts {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  build?: string;
}

/**
 * 解析版本号
 */
export function parseVersion(version: string): Result<VersionParts, KernelError> {
  if (!version || typeof version !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Version must be a non-empty string',
        'INVALID_VERSION_FORMAT',
        { version }
      )
    };
  }

  const match = version.trim().match(VERSION_REGEX);
  if (!match) {
    return {
      success: false,
      error: new KernelError(
        'Invalid version format',
        'INVALID_VERSION_FORMAT',
        { version, expectedFormat: 'x.y.z[-prerelease][+build]' }
      )
    };
  }

  const [, major, minor, patch, prerelease, build] = match;

  return {
    success: true,
    data: {
      major: parseInt(major, 10),
      minor: parseInt(minor, 10),
      patch: parseInt(patch, 10),
      prerelease: prerelease || undefined,
      build: build || undefined
    }
  };
}

/**
 * 比较版本号
 */
export function compareVersions(
  version1: string,
  version2: string
): Result<VersionComparison, KernelError> {
  const parse1 = parseVersion(version1);
  if (!parse1.success) {
    return parse1;
  }

  const parse2 = parseVersion(version2);
  if (!parse2.success) {
    return parse2;
  }

  const v1 = parse1.data;
  const v2 = parse2.data;

  // 比较主版本号
  if (v1.major !== v2.major) {
    return {
      success: true,
      data: {
        isNewer: v1.major > v2.major,
        isOlder: v1.major < v2.major,
        isSame: false,
        difference: 'major',
        currentVersion: version1,
        targetVersion: version2
      }
    };
  }

  // 比较次版本号
  if (v1.minor !== v2.minor) {
    return {
      success: true,
      data: {
        isNewer: v1.minor > v2.minor,
        isOlder: v1.minor < v2.minor,
        isSame: false,
        difference: 'minor',
        currentVersion: version1,
        targetVersion: version2
      }
    };
  }

  // 比较补丁版本号
  if (v1.patch !== v2.patch) {
    return {
      success: true,
      data: {
        isNewer: v1.patch > v2.patch,
        isOlder: v1.patch < v2.patch,
        isSame: false,
        difference: 'patch',
        currentVersion: version1,
        targetVersion: version2
      }
    };
  }

  // 比较预发布版本
  if (v1.prerelease !== v2.prerelease) {
    const prereleaseComparison = comparePrerelease(v1.prerelease, v2.prerelease);
    return {
      success: true,
      data: {
        isNewer: prereleaseComparison > 0,
        isOlder: prereleaseComparison < 0,
        isSame: prereleaseComparison === 0,
        difference: 'build',
        currentVersion: version1,
        targetVersion: version2
      }
    };
  }

  // 版本完全相同
  return {
    success: true,
    data: {
      isNewer: false,
      isOlder: false,
      isSame: true,
      difference: 'none',
      currentVersion: version1,
      targetVersion: version2
    }
  };
}

/**
 * 比较预发布版本
 */
function comparePrerelease(prerelease1?: string, prerelease2?: string): number {
  if (!prerelease1 && !prerelease2) return 0;
  if (!prerelease1) return 1; // 正式版本 > 预发布版本
  if (!prerelease2) return -1; // 预发布版本 < 正式版本

  const parts1 = prerelease1.split('.');
  const parts2 = prerelease2.split('.');

  const maxLength = Math.max(parts1.length, parts2.length);
  
  for (let i = 0; i < maxLength; i++) {
    const part1 = parts1[i] || '0';
    const part2 = parts2[i] || '0';

    const num1 = parseInt(part1, 10);
    const num2 = parseInt(part2, 10);

    if (!isNaN(num1) && !isNaN(num2)) {
      if (num1 !== num2) {
        return num1 - num2;
      }
    } else {
      const strComparison = part1.localeCompare(part2);
      if (strComparison !== 0) {
        return strComparison;
      }
    }
  }

  return 0;
}

/**
 * 检查版本是否更新
 */
export function isVersionNewer(
  currentVersion: string,
  targetVersion: string
): Result<boolean, KernelError> {
  const comparison = compareVersions(currentVersion, targetVersion);
  if (!comparison.success) {
    return comparison;
  }

  return {
    success: true,
    data: comparison.data.isNewer
  };
}

/**
 * 检查版本是否相同
 */
export function isVersionSame(
  version1: string,
  version2: string
): Result<boolean, KernelError> {
  const comparison = compareVersions(version1, version2);
  if (!comparison.success) {
    return comparison;
  }

  return {
    success: true,
    data: comparison.data.isSame
  };
}

/**
 * 验证版本信息
 */
export function validateVersionInfo(info: unknown): Result<VersionInfo, KernelError> {
  if (!info || typeof info !== 'object') {
    return {
      success: false,
      error: new KernelError(
        'Version info must be an object',
        'INVALID_VERSION_INFO',
        { info }
      )
    };
  }

  const vi = info as Record<string, unknown>;

  // 验证必需字段
  const requiredFields = ['version', 'buildNumber', 'releaseDate', 'downloadUrl'];
  for (const field of requiredFields) {
    if (!vi[field]) {
      return {
        success: false,
        error: new KernelError(
          `Missing required field: ${field}`,
          'MISSING_REQUIRED_FIELD',
          { field, versionInfo: vi }
        )
      };
    }
  }

  // 验证版本号格式
  const versionValidation = parseVersion(vi.version as string);
  if (!versionValidation.success) {
    return versionValidation;
  }

  // 验证构建号
  if (typeof vi.buildNumber !== 'number' || vi.buildNumber < 0) {
    return {
      success: false,
      error: new KernelError(
        'Build number must be a non-negative number',
        'INVALID_BUILD_NUMBER',
        { buildNumber: vi.buildNumber }
      )
    };
  }

  // 验证发布日期
  if (typeof vi.releaseDate !== 'string' || !isValidDate(vi.releaseDate)) {
    return {
      success: false,
      error: new KernelError(
        'Release date must be a valid date string',
        'INVALID_RELEASE_DATE',
        { releaseDate: vi.releaseDate }
      )
    };
  }

  // 验证下载URL
  if (typeof vi.downloadUrl !== 'string' || !isValidUrl(vi.downloadUrl)) {
    return {
      success: false,
      error: new KernelError(
        'Download URL must be a valid URL',
        'INVALID_DOWNLOAD_URL',
        { downloadUrl: vi.downloadUrl }
      )
    };
  }

  // 验证可选字段
  if (vi.notes && typeof vi.notes !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Notes must be a string',
        'INVALID_NOTES',
        { notes: vi.notes }
      )
    };
  }

  if (vi.checksum && typeof vi.checksum !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Checksum must be a string',
        'INVALID_CHECKSUM',
        { checksum: vi.checksum }
      )
    };
  }

  if (vi.size && (typeof vi.size !== 'number' || vi.size < 0)) {
    return {
      success: false,
      error: new KernelError(
        'Size must be a non-negative number',
        'INVALID_SIZE',
        { size: vi.size }
      )
    };
  }

  return {
    success: true,
    data: {
      version: vi.version as string,
      buildNumber: vi.buildNumber as number,
      releaseDate: vi.releaseDate as string,
      notes: (vi.notes as string) || '',
      downloadUrl: vi.downloadUrl as string,
      checksum: (vi.checksum as string) || '',
      size: (vi.size as number) || 0
    }
  };
}

/**
 * 检查日期是否有效
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * 检查URL是否有效
 */
function isValidUrl(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}

/**
 * 创建版本信息
 */
export function createVersionInfo(
  version: string,
  buildNumber: number,
  releaseDate: string,
  downloadUrl: string,
  overrides: Partial<VersionInfo> = {}
): Result<VersionInfo, KernelError> {
  const versionInfo = {
    version,
    buildNumber,
    releaseDate,
    notes: '',
    downloadUrl,
    checksum: '',
    size: 0,
    ...overrides
  };

  return validateVersionInfo(versionInfo);
}

/**
 * 获取版本显示名称
 */
export function getVersionDisplayName(version: string): string {
  const parse = parseVersion(version);
  if (!parse.success) {
    return version;
  }

  const { major, minor, patch, prerelease } = parse.data;
  let displayName = `${major}.${minor}.${patch}`;
  
  if (prerelease) {
    displayName += `-${prerelease}`;
  }

  return displayName;
}

/**
 * 检查版本是否稳定
 */
export function isStableVersion(version: string): Result<boolean, KernelError> {
  const parse = parseVersion(version);
  if (!parse.success) {
    return parse;
  }

  return {
    success: true,
    data: !parse.data.prerelease
  };
}

/**
 * 检查版本是否为预发布版本
 */
export function isPrereleaseVersion(version: string): Result<boolean, KernelError> {
  const parse = parseVersion(version);
  if (!parse.success) {
    return parse;
  }

  return {
    success: true,
    data: !!parse.data.prerelease
  };
}

/**
 * 获取版本类型
 */
export function getVersionType(version: string): Result<'stable' | 'prerelease' | 'beta' | 'alpha', KernelError> {
  const parse = parseVersion(version);
  if (!parse.success) {
    return parse;
  }

  if (!parse.data.prerelease) {
    return {
      success: true,
      data: 'stable'
    };
  }

  const prerelease = parse.data.prerelease.toLowerCase();
  if (prerelease.includes('beta')) {
    return {
      success: true,
      data: 'beta'
    };
  }
  
  if (prerelease.includes('alpha')) {
    return {
      success: true,
      data: 'alpha'
    };
  }

  return {
    success: true,
    data: 'prerelease'
  };
}

/**
 * 比较版本信息
 */
export function compareVersionInfo(
  info1: VersionInfo,
  info2: VersionInfo
): Result<VersionComparison, KernelError> {
  return compareVersions(info1.version, info2.version);
}

/**
 * 检查版本信息是否更新
 */
export function isVersionInfoNewer(
  currentInfo: VersionInfo,
  targetInfo: VersionInfo
): Result<boolean, KernelError> {
  return isVersionNewer(currentInfo.version, targetInfo.version);
}
