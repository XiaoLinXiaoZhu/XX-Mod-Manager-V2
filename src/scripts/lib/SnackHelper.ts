import { invoke } from "@tauri-apps/api/core";
import { $t,currentLanguage,TranslatedText } from "../../../src-tauri/resources/locals/index";



/* @enum
 * @desc 用于标记 Snack 的类型
 * none, info, success, warning, error
 */
export type SnackType = 'none' | 'info' | 'success' | 'warning' | 'error';

/** @function   
 * @desc 弹出 Snack 提示    
 * @param {string} message
 * @param {SnackType} type
 */
export async function snack(message: string, type: SnackType = 'info') {
    // ipcRenderer.send('snack', message, type);
    // snackType是type的首字母大写版本
    const snackType = type.charAt(0).toUpperCase() + type.slice(1);
    invoke('snack', { message, snackType, duration: 3000, align: 'Top' }).then((_res) => {
    }).catch((err) => {
        console.error('snack error', err);
    });
}

/** @function
 * @desc 弹出 Snack 提示，会自动根据当前语言环境获取文本
 * @param {TranslatedText} message
 * @param {SnackType} type
 */
export async function t_snack(message: TranslatedText, type: SnackType = 'info') {
    // 根据currentLanguage获取文本
    if (message === undefined || message === null) {
        console.error('t_snack error: message is undefined or null');
        return;
    }
    if (!message[currentLanguage] || message[currentLanguage] === '') {
        console.error('t_snack error: message is empty');
        return;
    }
    snack(message[currentLanguage], type);
}

export async function $t_snack(message: string, type: SnackType = 'info') {
    const translatedMessage = $t(message);
    if (translatedMessage === message) {
        // 如果翻译失败，直接使用原始消息
        await snack(message, type);
    }
    else {
        // 如果翻译成功，使用翻译后的消息
        await snack(translatedMessage, type);
    }
}
