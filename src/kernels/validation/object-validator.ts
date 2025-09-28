/**
 * 对象验证器
 * 提供通用的对象验证功能
 */

import type { Result } from '@/kernels/types';
import { KernelError } from '@/kernels/types';

/**
 * 验证对象是否为非空对象
 */
export function validateObject(
  value: unknown,
  fieldName: string
): Result<Record<string, unknown>, KernelError> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be an object`,
        'INVALID_OBJECT',
        { fieldName, value }
      )
    };
  }

  return {
    success: true,
    data: value as Record<string, unknown>
  };
}

/**
 * 验证必需字段
 */
export function validateRequiredField(
  obj: Record<string, unknown>,
  fieldName: string,
  expectedType: string = 'string'
): Result<unknown, KernelError> {
  const value = obj[fieldName];
  
  if (value === undefined || value === null) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} is required`,
        'MISSING_REQUIRED_FIELD',
        { fieldName, object: obj }
      )
    };
  }

  if (expectedType === 'string' && typeof value !== 'string') {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be a string`,
        'INVALID_FIELD_TYPE',
        { fieldName, value, expectedType }
      )
    };
  }

  if (expectedType === 'array' && !Array.isArray(value)) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be an array`,
        'INVALID_FIELD_TYPE',
        { fieldName, value, expectedType }
      )
    };
  }

  return {
    success: true,
    data: value
  };
}

/**
 * 验证可选字段
 */
export function validateOptionalField(
  obj: Record<string, unknown>,
  fieldName: string,
  expectedType: string = 'string'
): Result<unknown, KernelError> {
  const value = obj[fieldName];
  
  if (value === undefined || value === null) {
    return {
      success: true,
      data: undefined
    };
  }

  if (expectedType === 'string' && typeof value !== 'string') {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be a string`,
        'INVALID_FIELD_TYPE',
        { fieldName, value, expectedType }
      )
    };
  }

  if (expectedType === 'array' && !Array.isArray(value)) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be an array`,
        'INVALID_FIELD_TYPE',
        { fieldName, value, expectedType }
      )
    };
  }

  return {
    success: true,
    data: value
  };
}
