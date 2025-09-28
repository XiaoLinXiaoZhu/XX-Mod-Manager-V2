/**
 * 通知系统兼容桥接层
 * 提供旧通知系统的兼容接口
 */

import { Snackbar } from "sober";
import { $t, currentLanguageRef } from './i18n-bridge';
import type { TranslatedText } from "@/shared/types/local";

/**
 * Snack 类型枚举
 */
export enum SnackType {
  none = 'none',
  info = 'info',
  success = 'success',
  warning = 'warning',
  error = 'error'
}

/**
 * 兼容的 snack 函数
 * 提供与旧系统相同的API
 */
export function snack(
  message: TranslatedText,
  type: SnackType = SnackType.info,
  duration: number = 3000
): void {
  const translatedMessage = typeof message === 'string' ? message : $t(message.key, message.namedValue);
  
  Snackbar.show({
    message: translatedMessage,
    type: type,
    duration: duration
  });
}

/**
 * 兼容的 $t_snack 函数
 * 提供与旧系统相同的API
 */
export function $t_snack(
  message: TranslatedText,
  type: SnackType = SnackType.info,
  duration: number = 3000
): void {
  snack(message, type, duration);
}

/**
 * 兼容的 t_snack 函数
 * 提供与旧系统相同的API
 */
export function t_snack(
  message: TranslatedText,
  type: SnackType = SnackType.info,
  duration: number = 3000
): void {
  snack(message, type, duration);
}
