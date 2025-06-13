import { createI18n } from "vue-i18n";
import en_us from "./en-US.json";
import zh_cn from "./zh-CN.json";
import { EventType,EventSystem } from "@/scripts/core/EventSystem";
import { ref } from "vue";

import "@/assets/styles/styleController";

export const i18nInstance = createI18n({
    locale: "en-US", // set locale
    fallbackLocale: "zh-CN", // set fallback locale
    legacy: false, // you must set `false`, to use Composition API
    messages: {
        "en-US": en_us,
        "zh-CN": zh_cn,
    },
});

export type I18nLocale = "en-US" | "zh-CN";
export let currentLanguage : I18nLocale = "en-US"; // 默认语言
export const currentLanguageRef = ref<I18nLocale>(currentLanguage); // 当前语言的引用


export const setI18nLocale = (locale: I18nLocale) => {
    // debug
    console.log(`设置语言从 ${i18nInstance.global.locale.value} 到 ${locale}`);
    i18nInstance.global.locale.value = locale;
    currentLanguage = locale;
    currentLanguageRef.value = locale;

    EventSystem.trigger(EventType.languageChange, locale);
};

// 暴露它的翻译函数
export const $t = (key: string) => {
    return i18nInstance.global.t(key);
};


//-==== 一个简单的翻译
export type TranslatedText = Record<I18nLocale, string>;
/** @function
 * @desc 获取当前语言的翻译文本
 * @param {TranslatedText} text
 * @returns {string} 返回当前语言的翻译文本，如果当前语言没有对应的文本，则返回英文文本
 */
// export function getTranslatedText(text: TranslatedText): string {
//     if (text === undefined || text === null) {
//         console.error('getTranslatedText error: text is undefined or null');
//         return '';
//     }
//     // 如果当前语言没有对应的文本，返回 英文文本
//     if (!text[currentLanguage] || text[currentLanguage] === '') {
//         console.error('getTranslatedText error: text is empty for current language', currentLanguage);
//         return text['en-US'] || '';
//     }
//     return text[currentLanguage];
// }

// 之前的 getTranslatedText 函数 有点问题，因为当语言发生变化时，它不会自动更新，所以我们需要一个响应式的版本
import { computed } from "vue";
export function getTranslatedText(text: TranslatedText) {
    if (text === undefined || text === null) {
        console.error('getTranslatedText error: text is undefined or null');
    }
    // 如果当前语言没有对应的文本，报错
    if (!text[currentLanguage] || text[currentLanguage] === '') {
        console.error('getTranslatedText error: text is empty for current language', currentLanguage);
    }
    // 返回一个响应式的计算属性
    return computed(() => text[currentLanguageRef.value] || text['en-US'] || '');
}