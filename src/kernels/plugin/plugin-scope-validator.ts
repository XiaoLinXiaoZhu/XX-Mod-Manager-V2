/**
 * 插件作用域验证器
 * 提供插件作用域相关的验证逻辑
 */

import { Result, KernelError } from '@/kernels/types';

export type PluginScope = 'all' | 'local' | 'global';
export type CurrentPage = 'modListPage' | 'gamePage';

export interface PluginScopeContext {
  currentPage: CurrentPage;
  globalDisabledPlugins: string[];
  localDisabledPlugins: string[];
}

/**
 * 检查插件是否可以被启用
 */
export function canPluginBeEnabled(
  pluginName: string,
  pluginScope: PluginScope,
  context: PluginScopeContext
): Result<boolean, KernelError> {
  const { currentPage, globalDisabledPlugins, localDisabledPlugins } = context;
  
  const isGloballyDisabled = globalDisabledPlugins.includes(pluginName);
  const isLocallyDisabled = localDisabledPlugins.includes(pluginName);

  // 检查作用域是否有效
  if (!isValidScope(pluginScope)) {
    return {
      success: false,
      error: new KernelError(
        'Invalid plugin scope',
        'INVALID_PLUGIN_SCOPE',
        { pluginName, pluginScope }
      )
    };
  }

  // 根据作用域和当前页面判断
  switch (pluginScope) {
    case 'all':
      return checkAllScopePlugin(currentPage, isGloballyDisabled, isLocallyDisabled);
    
    case 'local':
      return checkLocalScopePlugin(currentPage, isGloballyDisabled, isLocallyDisabled);
    
    case 'global':
      return checkGlobalScopePlugin(currentPage, isGloballyDisabled);
    
    default:
      return {
        success: false,
        error: new KernelError(
          'Unknown plugin scope',
          'UNKNOWN_PLUGIN_SCOPE',
          { pluginName, pluginScope }
        )
      };
  }
}

/**
 * 检查 all 作用域的插件
 */
function checkAllScopePlugin(
  currentPage: CurrentPage,
  isGloballyDisabled: boolean,
  isLocallyDisabled: boolean
): Result<boolean, KernelError> {
  if (currentPage === 'modListPage') {
    // 在 modList 页面，需要检查全局和本地禁用状态
    if (isGloballyDisabled) {
      return {
        success: true,
        data: false
      };
    }
    if (isLocallyDisabled) {
      return {
        success: true,
        data: false
      };
    }
    return {
      success: true,
      data: true
    };
  }
  
  if (currentPage === 'gamePage') {
    // 在 gamePage 页面，只需要检查全局禁用状态
    if (isGloballyDisabled) {
      return {
        success: true,
        data: false
      };
    }
    return {
      success: true,
      data: true
    };
  }
  
  return {
    success: true,
    data: false
  };
}

/**
 * 检查 local 作用域的插件
 */
function checkLocalScopePlugin(
  currentPage: CurrentPage,
  isGloballyDisabled: boolean,
  isLocallyDisabled: boolean
): Result<boolean, KernelError> {
  if (currentPage === 'modListPage') {
    // 只有在 modList 页面才能启用 local 插件
    if (isGloballyDisabled || isLocallyDisabled) {
      return {
        success: true,
        data: false
      };
    }
    return {
      success: true,
      data: true
    };
  }
  
  return {
    success: true,
    data: false
  };
}

/**
 * 检查 global 作用域的插件
 */
function checkGlobalScopePlugin(
  currentPage: CurrentPage,
  isGloballyDisabled: boolean
): Result<boolean, KernelError> {
  if (currentPage === 'gamePage') {
    // 只有在 gamePage 页面才能启用 global 插件
    if (isGloballyDisabled) {
      return {
        success: true,
        data: false
      };
    }
    return {
      success: true,
      data: true
    };
  }
  
  return {
    success: true,
    data: false
  };
}

/**
 * 验证插件作用域是否有效
 */
function isValidScope(scope: string): scope is PluginScope {
  return ['all', 'local', 'global'].includes(scope);
}

/**
 * 验证插件作用域
 * @param scope 插件作用域
 * @returns 验证结果
 */
export function validatePluginScope(scope: string): Result<PluginScope, KernelError> {
  if (isValidScope(scope)) {
    return { success: true, data: scope };
  }
  
  return {
    success: false,
    error: new KernelError(
      'Invalid plugin scope',
      'INVALID_PLUGIN_SCOPE',
      { scope }
    )
  };
}