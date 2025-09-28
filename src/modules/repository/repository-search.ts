/**
 * 仓库搜索和统计
 * 负责仓库的搜索、过滤和统计功能
 */

import { 
  Repository,
  RepositorySearchOptions,
  RepositorySearchResult,
  RepositoryStatistics
} from './types';

/**
 * 搜索仓库
 */
export function searchRepositories(
  repositories: Repository[],
  options: RepositorySearchOptions = {}
): RepositorySearchResult {
  let filteredRepositories = [...repositories];

  // 按查询字符串过滤
  if (options.query) {
    const query = options.query.toLowerCase();
    filteredRepositories = filteredRepositories.filter(repo =>
      repo.name.toLowerCase().includes(query) ||
      (repo.description && repo.description.toLowerCase().includes(query))
    );
  }

  // 按状态过滤
  if (options.isActive !== undefined) {
    filteredRepositories = filteredRepositories.filter(repo => repo.isActive === options.isActive);
  }

  // 排序
  if (options.sortBy) {
    filteredRepositories.sort((a, b) => {
      let comparison = 0;
      
      switch (options.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'updatedAt':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'lastUsed':
          const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          comparison = aLastUsed - bLastUsed;
          break;
      }
      
      return options.sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // 分页
  const offset = options.offset || 0;
  const limit = options.limit || filteredRepositories.length;
  const paginatedRepositories = filteredRepositories.slice(offset, offset + limit);

  return {
    repositories: paginatedRepositories,
    total: filteredRepositories.length,
    hasMore: offset + limit < filteredRepositories.length,
    query: options.query || ''
  };
}

/**
 * 获取仓库统计信息
 */
export function getRepositoryStatistics(repositories: Repository[]): RepositoryStatistics {
  const totalRepositories = repositories.length;
  const activeRepositories = repositories.filter(repo => repo.isActive).length;
  
  // 计算总 Mod 数量（这里需要从实际数据获取）
  const totalMods = repositories.reduce((sum, repo) => sum + (repo.modSourceFolders?.length || 0), 0);
  const averageModsPerRepository = totalRepositories > 0 ? totalMods / totalRepositories : 0;
  
  // 找到最常用的仓库
  const mostUsedRepository = repositories
    .filter(repo => repo.lastUsed)
    .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())[0]?.name;
  
  // 找到最后活动时间
  const lastActivity = repositories
    .map(repo => [repo.createdAt, repo.updatedAt, repo.lastUsed].filter(Boolean))
    .flat()
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || new Date().toISOString();

  return {
    totalRepositories,
    activeRepositories,
    totalMods,
    averageModsPerRepository: Math.round(averageModsPerRepository * 100) / 100,
    mostUsedRepository,
    lastActivity
  };
}
