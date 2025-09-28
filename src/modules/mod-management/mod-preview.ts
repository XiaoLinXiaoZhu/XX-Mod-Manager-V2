/**
 * Mod 预览管理模块
 * 提供 Mod 预览图相关的纯函数
 */

import { ModMetadata } from './types';
import { Result, KernelError } from '@/kernels/types';

// 支持的图片格式
const SUPPORTED_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];

// 默认预览图文件名
const DEFAULT_PREVIEW_FILENAMES = [
  'preview.png', 
  'preview.jpg', 
  'preview.jpeg', 
  'preview.webp', 
  'preview.gif', 
  'preview.bmp'
];

/**
 * 检查文件是否为支持的图片格式
 */
export function isSupportedImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? SUPPORTED_IMAGE_EXTENSIONS.includes(ext) : false;
}

/**
 * 从文件名提取图片扩展名
 */
export function extractImageExtension(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext && SUPPORTED_IMAGE_EXTENSIONS.includes(ext) ? ext : null;
}

/**
 * 生成默认预览图文件名
 */
export function generateDefaultPreviewFilename(extension: string): string {
  return `preview.${extension}`;
}

/**
 * 检查预览图路径是否有效
 */
export function validatePreviewPath(
  previewPath: string,
  modLocation: string
): Result<string, KernelError> {
  if (!previewPath || previewPath.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Preview path is empty',
        'INVALID_PREVIEW_PATH',
        { previewPath, modLocation }
      )
    };
  }

  if (!isSupportedImageFile(previewPath)) {
    return {
      success: false,
      error: new KernelError(
        'Preview file is not a supported image format',
        'UNSUPPORTED_IMAGE_FORMAT',
        { previewPath, modLocation, supportedFormats: SUPPORTED_IMAGE_EXTENSIONS }
      )
    };
  }

  return {
    success: true,
    data: previewPath
  };
}

/**
 * 从 Mod 元数据获取预览图路径
 */
export function getModPreviewPath(metadata: ModMetadata): string | null {
  if (!metadata.preview || metadata.preview.trim().length === 0) {
    return null;
  }

  const validation = validatePreviewPath(metadata.preview, metadata.location);
  return validation.success ? validation.data : null;
}

/**
 * 检查 Mod 是否有预览图
 */
export function hasModPreview(metadata: ModMetadata): boolean {
  return getModPreviewPath(metadata) !== null;
}

/**
 * 生成预览图完整路径
 */
export function generatePreviewFullPath(
  modLocation: string,
  previewFilename: string
): string {
  // 简单的路径拼接，实际项目中应该使用路径工具
  return `${modLocation}/${previewFilename}`;
}

/**
 * 从文件列表中找到第一个图片文件
 */
export function findFirstImageFile(files: string[]): string | null {
  for (const file of files) {
    if (isSupportedImageFile(file)) {
      return file;
    }
  }
  return null;
}

/**
 * 从文件列表中找到默认预览图文件
 */
export function findDefaultPreviewFile(files: string[]): string | null {
  for (const filename of DEFAULT_PREVIEW_FILENAMES) {
    if (files.includes(filename)) {
      return filename;
    }
  }
  return null;
}

/**
 * 获取 Mod 的预览图文件名（优先使用配置的，否则查找默认的）
 */
export function getModPreviewFilename(
  metadata: ModMetadata,
  availableFiles: string[]
): string | null {
  // 如果元数据中指定了预览图，先验证它
  if (metadata.preview) {
    const validation = validatePreviewPath(metadata.preview, metadata.location);
    if (validation.success) {
      return validation.data;
    }
  }

  // 查找默认预览图文件
  const defaultPreview = findDefaultPreviewFile(availableFiles);
  if (defaultPreview) {
    return defaultPreview;
  }

  // 查找第一个图片文件
  return findFirstImageFile(availableFiles);
}

/**
 * 验证 Base64 图片数据
 */
export function validateBase64Image(base64: string): Result<string, KernelError> {
  if (!base64.startsWith('data:image/') || !base64.includes(',')) {
    return {
      success: false,
      error: new KernelError(
        'Invalid base64 image data format',
        'INVALID_BASE64_FORMAT',
        { base64: base64.substring(0, 50) + '...' }
      )
    };
  }

  const mimeMatch = base64.match(/data:image\/([^;]+);/);
  if (!mimeMatch) {
    return {
      success: false,
      error: new KernelError(
        'Invalid MIME type in base64 data',
        'INVALID_MIME_TYPE',
        { base64: base64.substring(0, 50) + '...' }
      )
    };
  }

  const extension = mimeMatch[1].toLowerCase();
  if (!SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
    return {
      success: false,
      error: new KernelError(
        'Unsupported image format in base64 data',
        'UNSUPPORTED_BASE64_FORMAT',
        { extension, supportedFormats: SUPPORTED_IMAGE_EXTENSIONS }
      )
    };
  }

  return {
    success: true,
    data: extension
  };
}

/**
 * 从 Base64 数据提取图片扩展名
 */
export function extractBase64ImageExtension(base64: string): Result<string, KernelError> {
  const validation = validateBase64Image(base64);
  if (!validation.success) {
    return validation;
  }

  return {
    success: true,
    data: validation.data
  };
}

/**
 * 生成预览图文件名（带时间戳）
 */
export function generateTimestampedPreviewFilename(extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `preview_${timestamp}.${extension}`;
}

/**
 * 清理预览图文件名（移除特殊字符）
 */
export function sanitizePreviewFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * 检查预览图是否需要更新
 */
export function shouldUpdatePreview(
  currentPreview: string | null,
  newPreview: string
): boolean {
  if (!currentPreview) {
    return true;
  }

  // 如果文件名不同，需要更新
  return currentPreview !== newPreview;
}

/**
 * 获取预览图显示名称
 */
export function getPreviewDisplayName(metadata: ModMetadata): string {
  if (metadata.preview) {
    return metadata.preview;
  }
  return 'No Preview';
}

/**
 * 检查预览图是否完整
 */
export function isPreviewComplete(metadata: ModMetadata): boolean {
  return !!(metadata.preview && metadata.preview.trim().length > 0);
}
