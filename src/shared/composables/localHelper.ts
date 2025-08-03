import { createI18n } from "vue-i18n";
import en_us from "../../../src-tauri/resources/locals/en-US.json";
import zh_cn from "../../../src-tauri/resources/locals/zh-CN.json";
import { computed, ComputedRef, Ref, ref, watch } from "vue";
import {type I18nLocale, type TranslatedText,I18nLocaleList } from "@/shared/types/local";
import "@/assets/styles/styleController";
import { sharedConfigManager } from "@/core/state/SharedConfigManager";

export const i18nInstance = createI18n({
    locale: "en-US", // set locale
    fallbackLocale: "en-US", // set fallback locale
    legacy: false, // you must set `false`, to use Composition API
    messages: {
        "en-US": en_us,
        "zh-CN": zh_cn,
    },
});



export const currentLanguageRef = sharedConfigManager.language;

watch(currentLanguageRef, (newLocale) => {
    // 检查是否是有效的语言代码
    if (!I18nLocaleList.includes(newLocale as I18nLocale)) {
        console.error(`Invalid language code: ${newLocale}`);
        return;
    }
    console.log(`当前语言已设置为: ${newLocale}`);
    // 设置 i18n 的语言
    i18nInstance.global.locale.value = newLocale;
});

export const setI18nLocale = (locale: I18nLocale) => {
    // debug
    console.log(`设置语言从 ${i18nInstance.global.locale.value} 到 ${locale}`   );
    currentLanguageRef.value = locale;

    // EventSystem.trigger(EventType.languageChange, locale);s
};

// 暴露它的翻译函数
export const $t = (key: string,namedValue?: Record<string, any>) => {
    if (namedValue === undefined || namedValue === null) {
        return i18nInstance.global.t(key);
    }
    return i18nInstance.global.t(key,namedValue);
};

// 暴露一个响应式的计算属性，获取当前语言的翻译
export const $rt = (key: string, namedValue?: Record<string, any>): ComputedRef<string> => {
    return computed(() => {
        // 引用一下 currentLanguageRef 使其 更随其变更
        if (currentLanguageRef.value === undefined || currentLanguageRef.value === null) {
            console.error('当前语言未设置，无法获取翻译');
            return key; // 返回原始 key
        }
        if (namedValue === undefined || namedValue === null) {
            // debug
            console.log(`获取翻译: ${key}，当前语言: ${currentLanguageRef.value}`);
            // 返回当前语言的翻译
            return i18nInstance.global.t(key);
        }
        // debug
        console.log(`获取翻译: ${key}，当前语言: ${currentLanguageRef.value}，带参数:`, namedValue);
        // 返回当前语言的翻译，带参数
        // 这里的 namedValue 是一个对象，包含了需要替换的变量
        return i18nInstance.global.t(key, namedValue);
    });
};


//-==== 一个简单的翻译

/** @function
 * @desc 获取当前语言的翻译文本，响应式
 * @param {TranslatedText} text
 * @returns {ComputedRef<string>}
 * @note 如果当前语言没有对应的文本，则返回英文文本或空字符串
 */
export function getTranslatedText(text: TranslatedText) {
    if (text === undefined || text === null) {
        console.error('getTranslatedText error: text is undefined or null');
    }
    // 如果当前语言没有对应的文本，报错
    if (!text[currentLanguageRef.value] || text[currentLanguageRef.value] === '') {
        console.error('getTranslatedText error: text is empty for current language', currentLanguageRef.value);
    }
    // 返回一个响应式的计算属性
    return computed(() => (true ? "" : "⚙️") + (text[currentLanguageRef.value as I18nLocale] || text['en-US'] || ''));
}