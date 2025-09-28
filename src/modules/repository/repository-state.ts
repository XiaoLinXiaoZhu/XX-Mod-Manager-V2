/**
 * 仓库状态管理
 * 负责仓库的激活、停用等状态操作
 */

import { 
  Repository
} from './types';
import type { Result, KernelError } from '@/kernels/types';

/**
 * 激活仓库
 */
export function activateRepository(
  repositoryId: string,
  repositories: Repository[]
): Result<Repository, KernelError> {
  const repository = repositories.find(repo => repo.id === repositoryId);
  
  if (!repository) {
    return {
      success: false,
      error: new KernelError(
        'Repository not found',
        'REPOSITORY_NOT_FOUND',
        { repositoryId }
      )
    };
  }

  if (repository.isActive) {
    return {
      success: false,
      error: new KernelError(
        'Repository is already active',
        'REPOSITORY_ALREADY_ACTIVE',
        { repositoryId }
      )
    };
  }

  const now = new Date().toISOString();
  const updatedRepository: Repository = {
    ...repository,
    isActive: true,
    lastUsed: now,
    updatedAt: now
  };

  return {
    success: true,
    data: updatedRepository
  };
}

/**
 * 停用仓库
 */
export function deactivateRepository(
  repositoryId: string,
  repositories: Repository[]
): Result<Repository, KernelError> {
  const repository = repositories.find(repo => repo.id === repositoryId);
  
  if (!repository) {
    return {
      success: false,
      error: new KernelError(
        'Repository not found',
        'REPOSITORY_NOT_FOUND',
        { repositoryId }
      )
    };
  }

  if (!repository.isActive) {
    return {
      success: false,
      error: new KernelError(
        'Repository is already inactive',
        'REPOSITORY_ALREADY_INACTIVE',
        { repositoryId }
      )
    };
  }

  const now = new Date().toISOString();
  const updatedRepository: Repository = {
    ...repository,
    isActive: false,
    updatedAt: now
  };

  return {
    success: true,
    data: updatedRepository
  };
}
