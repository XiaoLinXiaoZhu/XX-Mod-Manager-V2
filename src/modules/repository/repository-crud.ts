/**
 * 仓库 CRUD 操作
 * 负责仓库的创建、更新、删除等基本操作
 */

import { Repository } from './types';
import type { RepositoryConfig, RepositoryCreateOptions, RepositoryUpdateOptions, RepositoryOperationResult } from './types';
import type { Result, KernelError } from '@/kernels/types';
import type { validateRepositoryConfig } from './repository-validator';

/**
 * 创建仓库
 */
export function createRepository(
  options: RepositoryCreateOptions,
  existingRepositories: Repository[] = []
): Result<Repository, KernelError> {
  const config: RepositoryConfig = {
    name: options.name,
    description: options.description,
    modSourceFolders: options.modSourceFolders || [],
    modTargetFolder: options.modTargetFolder || '',
    settings: options.settings || {}
  };

  const configValidation = validateRepositoryConfig(config);
  if (!configValidation.success) {
    return configValidation;
  }

  const validatedConfig = configValidation.data;

  // 检查名称是否已存在
  const existingRepo = existingRepositories.find(repo => repo.name === validatedConfig.name);
  if (existingRepo) {
    return {
      success: false,
      error: new KernelError(
        'Repository with this name already exists',
        'REPOSITORY_NAME_EXISTS',
        { name: validatedConfig.name, existingId: existingRepo.id }
      )
    };
  }

  // 生成仓库 ID
  const id = generateRepositoryId(validatedConfig.name, existingRepositories);
  
  // 生成配置位置
  const configLocation = options.configLocation || generateConfigLocation(validatedConfig.name);
  
  const now = new Date().toISOString();
  
  const repository: Repository = {
    id,
    name: validatedConfig.name,
    description: validatedConfig.description,
    configLocation,
    modSourceFolders: validatedConfig.modSourceFolders,
    modTargetFolder: validatedConfig.modTargetFolder,
    isActive: false,
    createdAt: now,
    updatedAt: now
  };

  return {
    success: true,
    data: repository
  };
}

/**
 * 更新仓库
 */
export function updateRepository(
  repository: Repository,
  updates: RepositoryUpdateOptions,
  existingRepositories: Repository[] = []
): Result<Repository, KernelError> {
  // 检查名称是否与其他仓库冲突
  if (updates.name && updates.name !== repository.name) {
    const existingRepo = existingRepositories.find(repo => 
      repo.id !== repository.id && repo.name === updates.name
    );
    if (existingRepo) {
      return {
        success: false,
        error: new KernelError(
          'Repository with this name already exists',
          'REPOSITORY_NAME_EXISTS',
          { name: updates.name, existingId: existingRepo.id }
        )
      };
    }
  }

  // 验证更新后的配置
  const updatedConfig: RepositoryConfig = {
    name: updates.name || repository.name,
    description: updates.description !== undefined ? updates.description : repository.description,
    modSourceFolders: updates.modSourceFolders || repository.modSourceFolders,
    modTargetFolder: updates.modTargetFolder || repository.modTargetFolder,
    settings: updates.settings || repository.settings || {}
  };

  const configValidation = validateRepositoryConfig(updatedConfig);
  if (!configValidation.success) {
    return configValidation;
  }

  const validatedConfig = configValidation.data;
  const now = new Date().toISOString();

  const updatedRepository: Repository = {
    ...repository,
    name: validatedConfig.name,
    description: validatedConfig.description,
    modSourceFolders: validatedConfig.modSourceFolders,
    modTargetFolder: validatedConfig.modTargetFolder,
    settings: validatedConfig.settings,
    updatedAt: now
  };

  return {
    success: true,
    data: updatedRepository
  };
}

/**
 * 删除仓库
 */
export function deleteRepository(
  repositoryId: string,
  repositories: Repository[]
): Result<RepositoryOperationResult, KernelError> {
  const repositoryIndex = repositories.findIndex(repo => repo.id === repositoryId);
  
  if (repositoryIndex === -1) {
    return {
      success: false,
      error: new KernelError(
        'Repository not found',
        'REPOSITORY_NOT_FOUND',
        { repositoryId }
      )
    };
  }

  const repository = repositories[repositoryIndex];
  
  return {
    success: true,
    data: {
      success: true,
      message: `Repository '${repository.name}' deleted successfully`,
      repository
    }
  };
}

/**
 * 生成仓库 ID
 */
function generateRepositoryId(name: string, existingRepositories: Repository[]): string {
  const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  let id = baseId;
  let counter = 1;
  
  while (existingRepositories.some(repo => repo.id === id)) {
    id = `${baseId}-${counter}`;
    counter++;
  }
  
  return id;
}

/**
 * 生成配置位置
 */
function generateConfigLocation(name: string): string {
  const sanitizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `./repositories/${sanitizedName}/config.json`;
}
