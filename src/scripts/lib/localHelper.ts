import { createI18n } from "vue-i18n";
import en_us from "../../../src-tauri/resources/locals/en-US.json";
import zh_cn from "../../../src-tauri/resources/locals/zh-CN.json";
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
export const I18nLocaleList: I18nLocale[] = ["en-US", "zh-CN"]; // 支持的语言列表
export let currentLanguage : I18nLocale = "en-US"; // 默认语言
export const currentLanguageRef = ref<I18nLocale>(currentLanguage); // 当前语言的引用

export const setI18nLocale = (locale: I18nLocale) => {
    // debug
    console.log(`设置语言从 ${i18nInstance.global.locale.value} 到 ${locale}`);
    i18nInstance.global.locale.value = locale;
    currentLanguage = locale;
    currentLanguageRef.value = locale;

    // 保存到本地存储
    useConfig("language",locale as I18nLocale).set(locale);

    EventSystem.trigger(EventType.languageChange, locale);
};

// 暴露它的翻译函数
export const $t = (key: string,namedValue?: Record<string, any>) => {
    // 如果没有传入命名值，则使用空对象
    if (namedValue === undefined || namedValue === null) {
        return i18nInstance.global.t(key);
    }
    return i18nInstance.global.t(key,namedValue);
};


//-==== 一个简单的翻译
export type TranslatedText = Record<I18nLocale, string>;
/** @function
 * @desc 获取当前语言的翻译文本，响应式
 * @param {TranslatedText} text
 * @returns {ComputedRef<string>}
 * @note 如果当前语言没有对应的文本，则返回英文文本或空字符串
 */
import { computed } from "vue";
import { useConfig } from "@/scripts/core/ConfigLoader";
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