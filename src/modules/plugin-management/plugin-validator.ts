/**
 * 插件验证器
 * 提供插件验证相关的纯函数
 */

import type { PluginInfo, PluginValidationResult, PluginDependencyGraph } from './types';

/**
 * 验证插件信息
 * @param pluginInfo 插件信息
 * @returns 验证结果
 */
export function validatePluginInfo(pluginInfo: PluginInfo): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 验证必需字段
  if (!pluginInfo.id || typeof pluginInfo.id !== 'string') {
    errors.push('Plugin ID is required and must be a string');
  }

  if (!pluginInfo.name || typeof pluginInfo.name !== 'string') {
    errors.push('Plugin name is required and must be a string');
  }

  if (!pluginInfo.version || typeof pluginInfo.version !== 'string') {
    errors.push('Plugin version is required and must be a string');
  }

  if (!pluginInfo.filePath || typeof pluginInfo.filePath !== 'string') {
    errors.push('Plugin file path is required and must be a string');
  }

  // 验证版本格式
  if (pluginInfo.version && !isValidVersion(pluginInfo.version)) {
    warnings.push('Plugin version format may be invalid');
  }

  // 验证依赖数组
  if (!Array.isArray(pluginInfo.dependencies)) {
    errors.push('Plugin dependencies must be an array');
  }

  if (!Array.isArray(pluginInfo.conflicts)) {
    errors.push('Plugin conflicts must be an array');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 验证插件兼容性
 * @param pluginInfo 插件信息
 * @param environment 目标环境
 * @returns 兼容性验证结果
 */
export function validatePluginCompatibility(
  pluginInfo: PluginInfo,
  environment: any
): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查插件类型兼容性
  if (pluginInfo.type === 'core' && !environment.supportsCorePlugins) {
    errors.push('Environment does not support core plugins');
  }

  // 检查版本兼容性
  if (pluginInfo.version && environment.minVersion) {
    if (!isVersionCompatible(pluginInfo.version, environment.minVersion)) {
      errors.push(`Plugin version ${pluginInfo.version} is not compatible with minimum required version ${environment.minVersion}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 检查依赖冲突
 * @param pluginInfo 插件信息
 * @param dependencyGraph 依赖图
 * @returns 冲突检查结果
 */
export function checkDependencyConflicts(
  pluginInfo: PluginInfo,
  dependencyGraph: PluginDependencyGraph
): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 检查循环依赖
  if (hasCircularDependency(pluginInfo.id, pluginInfo.dependencies, dependencyGraph)) {
    errors.push(`Circular dependency detected for plugin ${pluginInfo.id}`);
  }

  // 检查冲突
  for (const conflict of pluginInfo.conflicts) {
    if (dependencyGraph[conflict]) {
      errors.push(`Plugin ${pluginInfo.id} conflicts with ${conflict}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * 检查插件是否可以加载
 * @param pluginInfo 插件信息
 * @param environment 环境
 * @param dependencyGraph 依赖图
 * @returns 加载检查结果
 */
export function canLoadPlugin(
  pluginInfo: PluginInfo,
  environment: any,
  dependencyGraph: PluginDependencyGraph
): { success: boolean; message: string; data?: any } {
  // 验证插件信息
  const validation = validatePluginInfo(pluginInfo);
  if (!validation.valid) {
    return {
      success: false,
      message: 'Plugin validation failed',
      data: validation.errors
    };
  }

  // 验证兼容性
  const compatibility = validatePluginCompatibility(pluginInfo, environment);
  if (!compatibility.valid) {
    return {
      success: false,
      message: 'Plugin compatibility check failed',
      data: compatibility.errors
    };
  }

  // 检查依赖冲突
  const conflicts = checkDependencyConflicts(pluginInfo, dependencyGraph);
  if (!conflicts.valid) {
    return {
      success: false,
      message: 'Plugin dependency conflicts detected',
      data: conflicts.errors
    };
  }

  return {
    success: true,
    message: 'Plugin can be loaded'
  };
}

/**
 * 构建依赖图
 * @param plugins 插件列表
 * @returns 依赖图
 */
export function buildDependencyGraph(plugins: PluginInfo[]): PluginDependencyGraph {
  const graph: PluginDependencyGraph = {};

  for (const plugin of plugins) {
    graph[plugin.id] = {
      dependencies: plugin.dependencies,
      dependents: []
    };
  }

  // 构建反向依赖关系
  for (const plugin of plugins) {
    for (const dep of plugin.dependencies) {
      if (graph[dep]) {
        graph[dep].dependents.push(plugin.id);
      }
    }
  }

  return graph;
}

/**
 * 按依赖关系排序插件
 * @param plugins 插件列表
 * @param dependencyGraph 依赖图
 * @returns 排序后的插件列表
 */
export function sortPluginsByDependencies(
  plugins: PluginInfo[],
  dependencyGraph: PluginDependencyGraph
): PluginInfo[] {
  const sorted: PluginInfo[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(plugin: PluginInfo) {
    if (visiting.has(plugin.id)) {
      throw new Error(`Circular dependency detected: ${plugin.id}`);
    }
    if (visited.has(plugin.id)) {
      return;
    }

    visiting.add(plugin.id);
    
    for (const depId of plugin.dependencies) {
      const depPlugin = plugins.find(p => p.id === depId);
      if (depPlugin) {
        visit(depPlugin);
      }
    }

    visiting.delete(plugin.id);
    visited.add(plugin.id);
    sorted.push(plugin);
  }

  for (const plugin of plugins) {
    if (!visited.has(plugin.id)) {
      visit(plugin);
    }
  }

  return sorted;
}

/**
 * 搜索插件
 * @param plugins 插件列表
 * @param options 搜索选项
 * @returns 搜索结果
 */
export function searchPlugins(
  plugins: PluginInfo[],
  options: {
    query?: string;
    type?: string;
    status?: string;
    enabled?: boolean;
    offset?: number;
    limit?: number;
  } = {}
): {
  plugins: PluginInfo[];
  total: number;
  hasMore: boolean;
  query: string;
} {
  let filtered = [...plugins];

  // 按查询字符串过滤
  if (options.query) {
    const query = options.query.toLowerCase();
    filtered = filtered.filter(plugin =>
      plugin.name.toLowerCase().includes(query) ||
      plugin.description?.toLowerCase().includes(query) ||
      plugin.id.toLowerCase().includes(query)
    );
  }

  // 按类型过滤
  if (options.type) {
    filtered = filtered.filter(plugin => plugin.type === options.type);
  }

  // 按状态过滤
  if (options.status) {
    filtered = filtered.filter(plugin => plugin.status === options.status);
  }

  // 按启用状态过滤
  if (options.enabled !== undefined) {
    filtered = filtered.filter(plugin => plugin.enabled === options.enabled);
  }

  // 分页
  const offset = options.offset || 0;
  const limit = options.limit || filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    plugins: paginated,
    total: filtered.length,
    hasMore: offset + limit < filtered.length,
    query: options.query || ''
  };
}

/**
 * 获取插件统计信息
 * @param plugins 插件列表
 * @returns 统计信息
 */
export function getPluginStatistics(plugins: PluginInfo[]): {
  total: number;
  enabled: number;
  disabled: number;
  loading: number;
  error: number;
  averageLoadTime: number;
} {
  const total = plugins.length;
  let enabled = 0;
  let disabled = 0;
  let loading = 0;
  let error = 0;
  let totalLoadTime = 0;
  let loadTimeCount = 0;

  for (const plugin of plugins) {
    switch (plugin.status) {
      case 'enabled':
        enabled++;
        break;
      case 'disabled':
        disabled++;
        break;
      case 'loading':
        loading++;
        break;
      case 'error':
        error++;
        break;
    }

    if (plugin.loadTime !== undefined) {
      totalLoadTime += plugin.loadTime;
      loadTimeCount++;
    }
  }

  return {
    total,
    enabled,
    disabled,
    loading,
    error,
    averageLoadTime: loadTimeCount > 0 ? totalLoadTime / loadTimeCount : 0
  };
}

// 辅助函数

/**
 * 验证版本格式
 * @param version 版本字符串
 * @returns 是否有效
 */
function isValidVersion(version: string): boolean {
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  return versionRegex.test(version);
}

/**
 * 检查版本兼容性
 * @param version 插件版本
 * @param minVersion 最小版本
 * @returns 是否兼容
 */
function isVersionCompatible(version: string, minVersion: string): boolean {
  // 简化的版本比较，实际项目中应该使用更复杂的版本比较逻辑
  return version >= minVersion;
}

/**
 * 检查循环依赖
 * @param pluginId 插件ID
 * @param dependencies 依赖列表
 * @param graph 依赖图
 * @returns 是否有循环依赖
 */
function hasCircularDependency(
  pluginId: string,
  dependencies: string[],
  graph: PluginDependencyGraph
): boolean {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string): boolean {
    if (visiting.has(id)) {
      return true; // 发现循环依赖
    }
    if (visited.has(id)) {
      return false;
    }

    visiting.add(id);
    
    const deps = graph[id]?.dependencies || [];
    for (const dep of deps) {
      if (visit(dep)) {
        return true;
      }
    }

    visiting.delete(id);
    visited.add(id);
    return false;
  }

  return visit(pluginId);
}
