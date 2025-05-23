import { TranslatedText } from "./TranslatedText"; 
import { invoke } from "@tauri-apps/api/core";

/* @enum
 * @desc 用于标记 Snack 的类型
 * none, info, success, warning, error
 */
type SnackType = 'none' | 'info' | 'success' | 'warning' | 'error';

/** @function   
 * @desc 弹出 Snack 提示    
 * @param {string} message
 * @param {SnackType} type
 */
async function snack(message: string, type: SnackType = 'info') {
    // ipcRenderer.send('snack', message, type);
    // snackType是type的首字母大写版本
    const snackType = type.charAt(0).toUpperCase() + type.slice(1);
    invoke('snack', { message, snackType, duration: 3000, align: 'Top' }).then((res) => {
    }).catch((err) => {
        console.error('snack error', err);
    });
}

/** @function
 * @desc 弹出 Snack 提示，会自动根据当前语言环境获取文本
 * @param {TranslatedText} message
 * @param {SnackType} type
 */
async function t_snack(message: TranslatedText, type: SnackType = 'info') {
    // 检查是否为 TranslatedText
    if (!message || typeof message !== 'object' || !message.get) {
        message  = TranslatedText.fromObject(message);
    }
    snack(message.get(), type);
}


export { snack, t_snack,type SnackType };