import { Snackbar } from "sober";
import { $t,currentLanguageRef } from "../../compat/legacy-bridge";
import { type TranslatedText } from "@/shared/types/local";

/** @enum
 * @desc 用于标记 Snack 的类型
 * none, info, success, warning, error
 */
export type SnackType = 'none' | 'info' | 'success' | 'warning' | 'error';

/** @enum
 * @desc 用于标记 Snack 的对齐方式
 * auto, top, bottom
 */
export type SnackAlign = 'auto' | 'top' | 'bottom';

/** @function
 * @desc 弹出 Snack 提示
 * @param {string} message
 * @param {SnackType} type
 * @param {number} duration
 * @param {SnackAlign} align
 */

export async function snack(message: string, type: SnackType = 'info', duration: number = 3000, align: SnackAlign = 'top') {
    Snackbar.builder({
        text: message,
        type: type,
        duration,
        align,
    }).show();
}

/** @function
 * @desc 弹出 Snack 提示，会自动根据当前语言环境获取文本
 * @param {TranslatedText} message
 * @param {SnackType} type
 * @param {number} duration
 * @param {SnackAlign} align
 * @note message 是一个对象，包含多语言文本
 */
export async function t_snack(message: TranslatedText, type: SnackType = 'info', duration: number = 3000, align: SnackAlign = 'top') {
    // 根据currentLanguage获取文本
    if (message === undefined || message === null) {
        console.error('t_snack error: message is undefined or null');
        return;
    }
    if (!message[currentLanguageRef.value] || message[currentLanguageRef.value] === '') {
        console.error('t_snack error: message is empty');
        return;
    }
    snack(message[currentLanguageRef.value], type, duration, align);
}

export async function $t_snack(message: string, type: SnackType = 'info', duration: number = 3000, align: SnackAlign = 'top') {
    const translatedMessage = $t(message);
    if (translatedMessage === message) {
        // 如果翻译失败，直接使用原始消息
        await snack(message, type, duration, align);
    }
    else {
        // 如果翻译成功，使用翻译后的消息
        await snack(translatedMessage, type, duration, align);
    }
}

// 监听 Snack 事件
import { listen } from '@tauri-apps/api/event';
listen('snack', (event) => {
    // debug
    const payload = event.payload as any;
    let message = payload[0];
    let snackType = payload[1];
    let duration = payload[2];
    let align = payload[3];
    // 确保 snackType 和 align 是全部小写
    snackType = snackType.toLowerCase() as "error" | "none" | "info" | "success" | "warning";
    align = align.toLowerCase() as "auto" | "top" | "bottom";
    // debug
    console.log('snack event payload:', message, snackType, duration, align);
    snack(message, snackType, duration, align);
});
