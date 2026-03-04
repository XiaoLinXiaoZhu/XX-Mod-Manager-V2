/**
 * 字符串验证器
 * 提供通用的字符串验证功能
 */

import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';

/**
 * 验证字符串是否为空
 */
export function validateNonEmptyString(
  value: unknown,
  fieldName: string,
  minLength: number = 1
): Result<string, KernelError> {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be a non-empty string`,
        'INVALID_STRING',
        { fieldName, value }
      )
    };
  }

  const trimmedValue = value.trim();
  if (trimmedValue.length < minLength) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be at least ${minLength} characters long`,
        'STRING_TOO_SHORT',
        { fieldName, value: trimmedValue, minLength }
      )
    };
  }

  return {
    success: true,
    data: trimmedValue
  };
}

/**
 * 验证字符串长度
 */
export function validateStringLength(
  value: string,
  fieldName: string,
  minLength: number,
  maxLength: number
): Result<string, KernelError> {
  if (value.length < minLength) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be at least ${minLength} characters long`,
        'STRING_TOO_SHORT',
        { fieldName, value, minLength }
      )
    };
  }

  if (value.length > maxLength) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be at most ${maxLength} characters long`,
        'STRING_TOO_LONG',
        { fieldName, value, maxLength }
      )
    };
  }

  return {
    success: true,
    data: value
  };
}

/**
 * 验证字符串格式（正则表达式）
 */
export function validateStringPattern(
  value: string,
  fieldName: string,
  pattern: RegExp,
  errorMessage: string
): Result<string, KernelError> {
  if (!pattern.test(value)) {
    return {
      success: false,
      error: new KernelError(
        errorMessage,
        'INVALID_STRING_PATTERN',
        { fieldName, value, pattern: pattern.toString() }
      )
    };
  }

  return {
    success: true,
    data: value
  };
}

/**
 * 验证字符串数组
 */
export function validateStringArray(
  value: unknown,
  fieldName: string,
  minItems: number = 1
): Result<string[], KernelError> {
  if (!Array.isArray(value)) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be an array`,
        'INVALID_ARRAY',
        { fieldName, value }
      )
    };
  }

  if (value.length < minItems) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must have at least ${minItems} items`,
        'ARRAY_TOO_SHORT',
        { fieldName, value, minItems }
      )
    };
  }

  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (typeof item !== 'string' || item.trim().length === 0) {
      return {
        success: false,
        error: new KernelError(
          `${fieldName}[${i}] must be a non-empty string`,
          'INVALID_ARRAY_ITEM',
          { fieldName, index: i, item }
        )
      };
    }
  }

  return {
    success: true,
    data: value.map(item => item.trim())
  };
}
