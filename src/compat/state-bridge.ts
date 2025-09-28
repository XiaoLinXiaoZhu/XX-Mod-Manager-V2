/**
 * 状态管理兼容桥接层
 * 提供旧状态管理系统的兼容接口
 */

import { createAppService, DEFAULT_APP_CONFIG } from '@/services';
import { computed } from 'vue';

// 创建全局应用服务实例
const globalAppService = createAppService(DEFAULT_APP_CONFIG);

// 创建兼容的 currentPage ref
export const currentPage = computed({
  get: () => globalAppService.getState().currentPage,
  set: (value: 'gamePage' | 'modListPage' | 'main') => {
    globalAppService.setCurrentPage(value);
  }
});

/**
 * 获取全局应用服务实例
 */
export function getGlobalAppService() {
  return globalAppService;
}
