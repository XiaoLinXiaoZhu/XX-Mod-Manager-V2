/**
 * 仓库管理模块类型定义
 * 定义仓库管理相关的类型和接口
 */

// 仓库信息
export interface Repository {
  id: string;
  name: string;
  description?: string;
  configLocation: string;
  modSourceFolders: string[];
  modTargetFolder: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
}

// 仓库配置
export interface RepositoryConfig {
  name: string;
  description?: string;
  modSourceFolders: string[];
  modTargetFolder: string;
  settings?: Record<string, unknown>;
}

// 仓库创建选项
export interface RepositoryCreateOptions {
  name: string;
  description?: string;
  configLocation?: string;
  modSourceFolders?: string[];
  modTargetFolder?: string;
  settings?: Record<string, unknown>;
}

// 仓库更新选项
export interface RepositoryUpdateOptions {
  name?: string;
  description?: string;
  modSourceFolders?: string[];
  modTargetFolder?: string;
  settings?: Record<string, unknown>;
}

// 仓库操作结果
export interface RepositoryOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  repository?: Repository;
}

// 仓库列表结果
export interface RepositoryListResult {
  repositories: Repository[];
  total: number;
  active: number;
  inactive: number;
}

// 仓库验证结果
export interface RepositoryValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// 仓库统计信息
export interface RepositoryStatistics {
  totalRepositories: number;
  activeRepositories: number;
  totalMods: number;
  averageModsPerRepository: number;
  mostUsedRepository?: string;
  lastActivity: string;
}

// 仓库搜索选项
export interface RepositorySearchOptions {
  query?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'lastUsed';
  sortOrder?: 'asc' | 'desc';
}

// 仓库搜索结果
export interface RepositorySearchResult {
  repositories: Repository[];
  total: number;
  hasMore: boolean;
  query: string;
}

// 仓库导入选项
export interface RepositoryImportOptions {
  sourcePath: string;
  targetName?: string;
  overwrite?: boolean;
  validate?: boolean;
}

// 仓库导出选项
export interface RepositoryExportOptions {
  targetPath: string;
  includeSettings?: boolean;
  includeMods?: boolean;
  format?: 'json' | 'yaml';
}

// 仓库同步选项
export interface RepositorySyncOptions {
  sourceRepository: string;
  targetRepository: string;
  syncSettings?: boolean;
  syncMods?: boolean;
  backup?: boolean;
}

// 仓库错误
export interface RepositoryError {
  code: string;
  message: string;
  repositoryId?: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
