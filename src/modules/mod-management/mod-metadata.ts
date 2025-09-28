/**
 * Mod 元数据处理模块
 * 提供 Mod 元数据的创建、验证、转换等纯函数
 */

import { ModMetadata, ModConfig, ModInfo, ModStatus } from './types';
import { Result, KernelError } from '@/kernels/types';

/**
 * 创建 Mod 元数据
 */
export function createModMetadata(
  location: string,
  config: ModConfig,
  overrides: Partial<ModMetadata> = {}
): ModMetadata {
  const now = new Date().toISOString();
  const id = generateModId(location);
  
  return {
    id,
    name: overrides.name || extractModName(location),
    location,
    url: overrides.url,
    addDate: overrides.addDate || now,
    jsonVersion: overrides.jsonVersion || 1,
    category: overrides.category,
    tags: overrides.tags || [],
    preview: overrides.preview,
    description: overrides.description,
    hotkeys: overrides.hotkeys || [],
    ...overrides
  };
}

/**
 * 验证 Mod 元数据
 */
export function validateModMetadata(metadata: unknown): Result<ModMetadata, KernelError> {
  if (!metadata || typeof metadata !== 'object') {
    return {
      success: false,
      error: new KernelError(
        'Invalid metadata: not an object',
        'INVALID_METADATA',
        { metadata }
      )
    };
  }

  const meta = metadata as Record<string, unknown>;

  // 必需字段验证
  const requiredFields = ['id', 'name', 'location', 'addDate', 'jsonVersion'];
  for (const field of requiredFields) {
    if (!meta[field]) {
      return {
        success: false,
        error: new KernelError(
          `Missing required field: ${field}`,
          'MISSING_REQUIRED_FIELD',
          { field, metadata }
        )
      };
    }
  }

  // 类型验证
  if (typeof meta.id !== 'string' || meta.id.length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Invalid id: must be a non-empty string',
        'INVALID_ID',
        { id: meta.id }
      )
    };
  }

  if (typeof meta.name !== 'string' || meta.name.length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Invalid name: must be a non-empty string',
        'INVALID_NAME',
        { name: meta.name }
      )
    };
  }

  if (typeof meta.location !== 'string' || meta.location.length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Invalid location: must be a non-empty string',
        'INVALID_LOCATION',
        { location: meta.location }
      )
    };
  }

  if (typeof meta.jsonVersion !== 'number' || meta.jsonVersion < 1) {
    return {
      success: false,
      error: new KernelError(
        'Invalid jsonVersion: must be a number >= 1',
        'INVALID_JSON_VERSION',
        { jsonVersion: meta.jsonVersion }
      )
    };
  }

  // 可选字段验证
  if (meta.url && typeof meta.url !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Invalid url: must be a string',
        'INVALID_URL',
        { url: meta.url }
      )
    };
  }

  if (meta.tags && !Array.isArray(meta.tags)) {
    return {
      success: false,
      error: new KernelError(
        'Invalid tags: must be an array',
        'INVALID_TAGS',
        { tags: meta.tags }
      )
    };
  }

  if (meta.hotkeys && !Array.isArray(meta.hotkeys)) {
    return {
      success: false,
      error: new KernelError(
        'Invalid hotkeys: must be an array',
        'INVALID_HOTKEYS',
        { hotkeys: meta.hotkeys }
      )
    };
  }

  return {
    success: true,
    data: metadata as ModMetadata
  };
}

/**
 * 更新 Mod 元数据
 */
export function updateModMetadata(
  metadata: ModMetadata,
  updates: Partial<ModMetadata>
): ModMetadata {
  return {
    ...metadata,
    ...updates
  };
}

/**
 * 将 Mod 元数据转换为 Mod 信息
 */
export function metadataToModInfo(
  metadata: ModMetadata,
  status: ModStatus = ModStatus.INACTIVE,
  additionalInfo: Partial<ModInfo> = {}
): ModInfo {
  return {
    ...metadata,
    status,
    conflicts: [],
    ...additionalInfo
  };
}

/**
 * 生成 Mod ID
 */
function generateModId(location: string): string {
  // 使用简单的哈希算法生成 ID
  let hash = 0;
  for (let i = 0; i < location.length; i++) {
    const char = location.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为 32 位整数
  }
  return Math.abs(hash).toString(36);
}

/**
 * 从路径提取 Mod 名称
 */
function extractModName(location: string): string {
  const parts = location.split('/');
  return parts[parts.length - 1] || 'Unknown Mod';
}

/**
 * 检查 Mod 元数据是否完整
 */
export function isModMetadataComplete(metadata: ModMetadata): boolean {
  return !!(
    metadata.id &&
    metadata.name &&
    metadata.location &&
    metadata.addDate &&
    metadata.jsonVersion
  );
}

/**
 * 比较两个 Mod 元数据是否相同
 */
export function compareModMetadata(a: ModMetadata, b: ModMetadata): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.location === b.location &&
    a.jsonVersion === b.jsonVersion
  );
}

/**
 * 获取 Mod 显示名称
 */
export function getModDisplayName(metadata: ModMetadata): string {
  return metadata.name || extractModName(metadata.location);
}

/**
 * 检查 Mod 是否有预览图
 */
export function hasModPreview(metadata: ModMetadata): boolean {
  return !!(metadata.preview && metadata.preview.trim().length > 0);
}

/**
 * 检查 Mod 是否有描述
 */
export function hasModDescription(metadata: ModMetadata): boolean {
  return !!(metadata.description && metadata.description.trim().length > 0);
}
