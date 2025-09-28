/**
 * Mod 热键管理模块
 * 提供 Mod 热键相关的纯函数
 */

import { ModMetadata } from './types';
import { Result, KernelError } from '@/kernels/types';

// 热键接口
export interface ModHotkey {
  key: string;
  description: string;
}

// 热键验证选项
export interface HotkeyValidationOptions {
  allowEmpty?: boolean;
  maxLength?: number;
  allowedKeys?: string[];
}

// 默认热键验证选项
const DEFAULT_HOTKEY_OPTIONS: Required<HotkeyValidationOptions> = {
  allowEmpty: false,
  maxLength: 100,
  allowedKeys: []
};

/**
 * 验证热键键值
 */
export function validateHotkeyKey(
  key: string,
  options: HotkeyValidationOptions = {}
): Result<string, KernelError> {
  const opts = { ...DEFAULT_HOTKEY_OPTIONS, ...options };

  if (!key || key.trim().length === 0) {
    if (opts.allowEmpty) {
      return { success: true, data: key };
    }
    return {
      success: false,
      error: new KernelError(
        'Hotkey key cannot be empty',
        'EMPTY_HOTKEY_KEY',
        { key }
      )
    };
  }

  const trimmedKey = key.trim();
  if (trimmedKey.length > opts.maxLength) {
    return {
      success: false,
      error: new KernelError(
        `Hotkey key too long (max ${opts.maxLength} characters)`,
        'HOTKEY_KEY_TOO_LONG',
        { key: trimmedKey, maxLength: opts.maxLength }
      )
    };
  }

  if (opts.allowedKeys.length > 0 && !opts.allowedKeys.includes(trimmedKey)) {
    return {
      success: false,
      error: new KernelError(
        'Hotkey key not in allowed list',
        'HOTKEY_KEY_NOT_ALLOWED',
        { key: trimmedKey, allowedKeys: opts.allowedKeys }
      )
    };
  }

  return {
    success: true,
    data: trimmedKey
  };
}

/**
 * 验证热键描述
 */
export function validateHotkeyDescription(
  description: string,
  options: HotkeyValidationOptions = {}
): Result<string, KernelError> {
  const opts = { ...DEFAULT_HOTKEY_OPTIONS, ...options };

  if (!description || description.trim().length === 0) {
    if (opts.allowEmpty) {
      return { success: true, data: description };
    }
    return {
      success: false,
      error: new KernelError(
        'Hotkey description cannot be empty',
        'EMPTY_HOTKEY_DESCRIPTION',
        { description }
      )
    };
  }

  const trimmedDescription = description.trim();
  if (trimmedDescription.length > opts.maxLength) {
    return {
      success: false,
      error: new KernelError(
        `Hotkey description too long (max ${opts.maxLength} characters)`,
        'HOTKEY_DESCRIPTION_TOO_LONG',
        { description: trimmedDescription, maxLength: opts.maxLength }
      )
    };
  }

  return {
    success: true,
    data: trimmedDescription
  };
}

/**
 * 验证热键对象
 */
export function validateHotkey(
  hotkey: unknown,
  options: HotkeyValidationOptions = {}
): Result<ModHotkey, KernelError> {
  if (!hotkey || typeof hotkey !== 'object') {
    return {
      success: false,
      error: new KernelError(
        'Hotkey must be an object',
        'INVALID_HOTKEY_TYPE',
        { hotkey }
      )
    };
  }

  const hk = hotkey as Record<string, unknown>;

  if (typeof hk.key !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Hotkey key must be a string',
        'INVALID_HOTKEY_KEY_TYPE',
        { hotkey: hk }
      )
    };
  }

  if (typeof hk.description !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Hotkey description must be a string',
        'INVALID_HOTKEY_DESCRIPTION_TYPE',
        { hotkey: hk }
      )
    };
  }

  const keyValidation = validateHotkeyKey(hk.key, options);
  if (!keyValidation.success) {
    return keyValidation;
  }

  const descriptionValidation = validateHotkeyDescription(hk.description, options);
  if (!descriptionValidation.success) {
    return descriptionValidation;
  }

  return {
    success: true,
    data: {
      key: keyValidation.data,
      description: descriptionValidation.data
    }
  };
}

/**
 * 验证热键数组
 */
export function validateHotkeys(
  hotkeys: unknown[],
  options: HotkeyValidationOptions = {}
): Result<ModHotkey[], KernelError> {
  const validatedHotkeys: ModHotkey[] = [];
  const errors: string[] = [];

  for (let i = 0; i < hotkeys.length; i++) {
    const validation = validateHotkey(hotkeys[i], options);
    if (validation.success) {
      validatedHotkeys.push(validation.data);
    } else {
      errors.push(`Hotkey at index ${i}: ${validation.error.message}`);
    }
  }

  if (errors.length > 0 && validatedHotkeys.length === 0) {
    return {
      success: false,
      error: new KernelError(
        'All hotkeys are invalid',
        'ALL_HOTKEYS_INVALID',
        { errors }
      )
    };
  }

  return {
    success: true,
    data: validatedHotkeys
  };
}

/**
 * 创建热键对象
 */
export function createHotkey(
  key: string,
  description: string,
  options: HotkeyValidationOptions = {}
): Result<ModHotkey, KernelError> {
  const keyValidation = validateHotkeyKey(key, options);
  if (!keyValidation.success) {
    return keyValidation;
  }

  const descriptionValidation = validateHotkeyDescription(description, options);
  if (!descriptionValidation.success) {
    return descriptionValidation;
  }

  return {
    success: true,
    data: {
      key: keyValidation.data,
      description: descriptionValidation.data
    }
  };
}

/**
 * 添加热键到列表
 */
export function addHotkey(
  hotkeys: ModHotkey[],
  newHotkey: ModHotkey,
  options: HotkeyValidationOptions = {}
): Result<ModHotkey[], KernelError> {
  const validation = validateHotkey(newHotkey, options);
  if (!validation.success) {
    return validation;
  }

  // 检查是否已存在相同的热键
  const existingIndex = hotkeys.findIndex(h => h.key === newHotkey.key);
  if (existingIndex >= 0) {
    return {
      success: false,
      error: new KernelError(
        'Hotkey already exists',
        'HOTKEY_ALREADY_EXISTS',
        { key: newHotkey.key, existingHotkey: hotkeys[existingIndex] }
      )
    };
  }

  return {
    success: true,
    data: [...hotkeys, validation.data]
  };
}

/**
 * 从列表中移除热键
 */
export function removeHotkey(
  hotkeys: ModHotkey[],
  key: string
): Result<ModHotkey[], KernelError> {
  const filteredHotkeys = hotkeys.filter(h => h.key !== key);
  
  if (filteredHotkeys.length === hotkeys.length) {
    return {
      success: false,
      error: new KernelError(
        'Hotkey not found',
        'HOTKEY_NOT_FOUND',
        { key, availableKeys: hotkeys.map(h => h.key) }
      )
    };
  }

  return {
    success: true,
    data: filteredHotkeys
  };
}

/**
 * 更新热键
 */
export function updateHotkey(
  hotkeys: ModHotkey[],
  key: string,
  updates: Partial<ModHotkey>,
  options: HotkeyValidationOptions = {}
): Result<ModHotkey[], KernelError> {
  const index = hotkeys.findIndex(h => h.key === key);
  if (index === -1) {
    return {
      success: false,
      error: new KernelError(
        'Hotkey not found',
        'HOTKEY_NOT_FOUND',
        { key, availableKeys: hotkeys.map(h => h.key) }
      )
    };
  }

  const updatedHotkey = { ...hotkeys[index], ...updates };
  const validation = validateHotkey(updatedHotkey, options);
  if (!validation.success) {
    return validation;
  }

  const updatedHotkeys = [...hotkeys];
  updatedHotkeys[index] = validation.data;

  return {
    success: true,
    data: updatedHotkeys
  };
}

/**
 * 查找热键
 */
export function findHotkey(
  hotkeys: ModHotkey[],
  key: string
): ModHotkey | null {
  return hotkeys.find(h => h.key === key) || null;
}

/**
 * 检查热键是否存在
 */
export function hasHotkey(hotkeys: ModHotkey[], key: string): boolean {
  return findHotkey(hotkeys, key) !== null;
}

/**
 * 获取热键数量
 */
export function getHotkeyCount(hotkeys: ModHotkey[]): number {
  return hotkeys.length;
}

/**
 * 检查热键列表是否为空
 */
export function isHotkeyListEmpty(hotkeys: ModHotkey[]): boolean {
  return hotkeys.length === 0;
}

/**
 * 清空热键列表
 */
export function clearHotkeys(): ModHotkey[] {
  return [];
}

/**
 * 排序热键列表
 */
export function sortHotkeys(
  hotkeys: ModHotkey[],
  sortBy: 'key' | 'description' = 'key',
  order: 'asc' | 'desc' = 'asc'
): ModHotkey[] {
  const sortedHotkeys = [...hotkeys].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'key':
        comparison = a.key.localeCompare(b.key);
        break;
      case 'description':
        comparison = a.description.localeCompare(b.description);
        break;
    }
    
    return order === 'desc' ? -comparison : comparison;
  });

  return sortedHotkeys;
}

/**
 * 搜索热键
 */
export function searchHotkeys(
  hotkeys: ModHotkey[],
  query: string
): ModHotkey[] {
  if (!query || query.trim().length === 0) {
    return hotkeys;
  }

  const searchQuery = query.toLowerCase();
  return hotkeys.filter(hotkey => 
    hotkey.key.toLowerCase().includes(searchQuery) ||
    hotkey.description.toLowerCase().includes(searchQuery)
  );
}

/**
 * 获取热键统计信息
 */
export function getHotkeyStatistics(hotkeys: ModHotkey[]): {
  total: number;
  uniqueKeys: number;
  averageDescriptionLength: number;
} {
  const total = hotkeys.length;
  const uniqueKeys = new Set(hotkeys.map(h => h.key)).size;
  const averageDescriptionLength = total > 0 
    ? hotkeys.reduce((sum, h) => sum + h.description.length, 0) / total 
    : 0;

  return {
    total,
    uniqueKeys,
    averageDescriptionLength: Math.round(averageDescriptionLength * 100) / 100
  };
}

/**
 * 从 Mod 元数据获取热键列表
 */
export function getModHotkeys(metadata: ModMetadata): ModHotkey[] {
  return metadata.hotkeys || [];
}

/**
 * 检查 Mod 是否有热键
 */
export function hasModHotkeys(metadata: ModMetadata): boolean {
  return !isHotkeyListEmpty(getModHotkeys(metadata));
}

/**
 * 获取 Mod 热键数量
 */
export function getModHotkeyCount(metadata: ModMetadata): number {
  return getHotkeyCount(getModHotkeys(metadata));
}
