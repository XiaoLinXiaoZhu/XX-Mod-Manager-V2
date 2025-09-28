/**
 * 仓库验证器
 * 负责仓库配置和数据的验证
 */

import { Repository } from './types';
import type { RepositoryConfig, RepositoryValidationResult } from './types';
import type { Result, KernelError } from '@/kernels/types';
import { 
  validateNonEmptyString, 
  validateStringLength, 
  validateStringPattern, 
  validateStringArray 
} from '@/kernels/validation';
import { validateObject, validateRequiredField, validateOptionalField } from '@/kernels/validation';
import { validateDateString, validateOptionalDateString, isValidDate } from '@/kernels/validation';

/**
 * 验证仓库名称
 */
export function validateRepositoryName(name: string): Result<string, KernelError> {
  // 使用 Kernel 层验证器
  const nonEmptyResult = validateNonEmptyString(name, 'Repository name', 2);
  if (!nonEmptyResult.success) {
    return nonEmptyResult;
  }

  const lengthResult = validateStringLength(
    nonEmptyResult.data, 
    'Repository name', 
    2, 
    50
  );
  if (!lengthResult.success) {
    return lengthResult;
  }

  const patternResult = validateStringPattern(
    lengthResult.data,
    'Repository name',
    /^[a-zA-Z0-9\s\-_]+$/,
    'Repository name contains invalid characters'
  );

  return patternResult;
}

/**
 * 验证仓库配置
 */
export function validateRepositoryConfig(config: unknown): Result<RepositoryConfig, KernelError> {
  // 使用 Kernel 层验证器验证对象
  const objectResult = validateObject(config, 'Repository config');
  if (!objectResult.success) {
    return objectResult;
  }

  const cfg = objectResult.data;

  // 验证名称
  const nameResult = validateRequiredField(cfg, 'name', 'string');
  if (!nameResult.success) {
    return nameResult;
  }

  const nameValidation = validateRepositoryName(nameResult.data as string);
  if (!nameValidation.success) {
    return nameValidation;
  }

  // 验证描述
  const descriptionResult = validateOptionalField(cfg, 'description', 'string');
  if (!descriptionResult.success) {
    return descriptionResult;
  }

  // 验证 Mod 源文件夹
  const modSourceFoldersResult = validateStringArray(cfg.modSourceFolders, 'Mod source folders', 1);
  if (!modSourceFoldersResult.success) {
    return modSourceFoldersResult;
  }

  // 验证 Mod 目标文件夹
  const modTargetFolderResult = validateNonEmptyString(cfg.modTargetFolder, 'Mod target folder');
  if (!modTargetFolderResult.success) {
    return modTargetFolderResult;
  }

  // 验证设置
  const settingsResult = validateOptionalField(cfg, 'settings', 'object');
  if (!settingsResult.success) {
    return settingsResult;
  }

  return {
    success: true,
    data: {
      name: nameValidation.data,
      description: descriptionResult.data as string | undefined,
      modSourceFolders: modSourceFoldersResult.data,
      modTargetFolder: modTargetFolderResult.data,
      settings: (settingsResult.data as Record<string, unknown>) || {}
    }
  };
}

/**
 * 验证仓库
 */
export function validateRepository(repository: Repository): RepositoryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证必需字段
  if (!repository.id || repository.id.trim().length === 0) {
    errors.push('Repository ID is required');
  }

  if (!repository.name || repository.name.trim().length === 0) {
    errors.push('Repository name is required');
  }

  if (!repository.configLocation || repository.configLocation.trim().length === 0) {
    errors.push('Repository config location is required');
  }

  if (!repository.modSourceFolders || repository.modSourceFolders.length === 0) {
    errors.push('At least one mod source folder is required');
  }

  if (!repository.modTargetFolder || repository.modTargetFolder.trim().length === 0) {
    errors.push('Mod target folder is required');
  }

  // 验证日期格式
  if (!repository.createdAt || !isValidDate(repository.createdAt)) {
    errors.push('Invalid creation date');
  }

  if (!repository.updatedAt || !isValidDate(repository.updatedAt)) {
    errors.push('Invalid update date');
  }

  if (repository.lastUsed && !isValidDate(repository.lastUsed)) {
    warnings.push('Invalid last used date');
  }

  // 验证 Mod 源文件夹
  if (repository.modSourceFolders) {
    for (const folder of repository.modSourceFolders) {
      if (!folder || folder.trim().length === 0) {
        errors.push('Mod source folder cannot be empty');
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 检查日期是否有效
 */
function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
