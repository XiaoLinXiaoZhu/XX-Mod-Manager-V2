/**
 * 仓库功能兼容桥接层
 * 提供旧仓库系统的兼容接口
 */

import { 
  createRepository,
  type Repository,
  type RepositoryConfig
} from '@/modules/repository';

// 创建默认仓库配置
const defaultRepoConfig: RepositoryConfig = {
  name: '',
  url: '',
  description: '',
  enabled: true
};

// 创建全局仓库实例
const globalRepository = createRepository(defaultRepoConfig);

// 兼容的仓库类型
export type repo = Repository;

// 兼容的仓库数组
export const repos: Repository[] = [];

// 兼容的获取仓库函数
export function getRepos(): Repository[] {
  return globalRepository.getAllRepositories();
}

// 兼容的仓库操作
export const repository = {
  // 仓库管理
  add: (repo: Repository) => globalRepository.addRepository(repo),
  remove: (id: string) => globalRepository.removeRepository(id),
  update: (id: string, updates: Partial<Repository>) => globalRepository.updateRepository(id, updates),
  get: (id: string) => globalRepository.getRepository(id),
  getAll: () => globalRepository.getAllRepositories(),
  
  // 仓库验证
  validate: (repo: Repository) => globalRepository.validateRepository(repo),
  
  // 仓库搜索
  search: (query: string) => globalRepository.searchRepositories(query),
  
  // 仓库状态
  enable: (id: string) => globalRepository.enableRepository(id),
  disable: (id: string) => globalRepository.disableRepository(id),
  
  // 事件监听
  on: (event: string, callback: Function) => globalRepository.on(event, callback),
  off: (event: string, callback: Function) => globalRepository.off(event, callback),
  emit: (event: string, ...args: any[]) => globalRepository.emit(event, ...args)
};

// 导出类型
export type { Repository, RepositoryConfig };
