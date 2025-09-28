/**
 * 日期验证器
 * 提供通用的日期验证功能
 */

import { Result, KernelError } from '@/kernels/types';

/**
 * 验证日期字符串是否有效
 */
export function validateDateString(
  dateString: string,
  fieldName: string
): Result<string, KernelError> {
  if (!dateString || typeof dateString !== 'string') {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} must be a string`,
        'INVALID_DATE_STRING',
        { fieldName, dateString }
      )
    };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return {
      success: false,
      error: new KernelError(
        `${fieldName} is not a valid date`,
        'INVALID_DATE',
        { fieldName, dateString }
      )
    };
  }

  return {
    success: true,
    data: dateString
  };
}

/**
 * 验证日期字符串是否有效（可选）
 */
export function validateOptionalDateString(
  dateString: string | undefined,
  fieldName: string
): Result<string | undefined, KernelError> {
  if (!dateString) {
    return {
      success: true,
      data: undefined
    };
  }

  return validateDateString(dateString, fieldName);
}

/**
 * 检查日期是否有效
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}
