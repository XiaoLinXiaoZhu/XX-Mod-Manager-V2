import { createI18n } from "vue-i18n";
import en_us from "../../../src-tauri/resources/locals/en-US.json";
import zh_cn from "../../../src-tauri/resources/locals/zh-CN.json";
import { EventType,EventSystem } from "@/scripts/core/EventSystem";
import { Ref, ref } from "vue";
import { RebindableRef } from "./RebindableRef";

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
export const currentLanguageRef: RebindableRef<I18nLocale> = new RebindableRef<I18nLocale>("en-US"); // 当前语言的引用

currentLanguageRef.watch((newLocale) => {
    // 设置 i18n 的语言
    i18nInstance.global.locale.value = newLocale;
    // debug
    console.log(`当前语言已设置为: ${newLocale}`);
});

export const setI18nLocale = (locale: I18nLocale) => {
    // debug
    console.log(`设置语言从 ${i18nInstance.global.locale.value} 到 ${locale}`);
    currentLanguageRef.value = locale;

    EventSystem.trigger(EventType.languageChange, locale);
};

// 暴露它的翻译函数
export const $t = (key: string,namedValue?: Record<string, any>) => {
    // 如果没有传入命名值，则使用空对象
    //debug currentLanguageRef
    console.log(`当前语言: ${currentLanguageRef.value}, 翻译键: ${key}, 命名值:`, namedValue || {});

    // 添加调试：检查当前语言包是否包含该键
    const messages = i18nInstance.global.messages.value;
    console.log(
        `当前语言包是否包含键 ${key}:`,messages,
        messages && key.split('.').reduce((obj, k) => obj?.[k], messages[currentLanguageRef.value] as any) !== undefined
    );

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
export function getTranslatedText(text: TranslatedText) {
    if (text === undefined || text === null) {
        console.error('getTranslatedText error: text is undefined or null');
    }
    // 如果当前语言没有对应的文本，报错
    if (!text[currentLanguageRef.value] || text[currentLanguageRef.value] === '') {
        console.error('getTranslatedText error: text is empty for current language', currentLanguageRef.value);
    }
    // 返回一个响应式的计算属性
    // return computed(() => "⚙️" + text[currentLanguageRef.ref.value] || text['en-US'] || '');
    // 因为现在 currentLanguageRef 是一个 RebindableRef，所以不能直接使用 computed
    const reactiveText :Ref<string> = ref("⚙️" + text[currentLanguageRef.value] || text['en-US'] || '');
    currentLanguageRef.watch(() => {
        reactiveText.value = "⚙️" + text[currentLanguageRef.value] || text['en-US'] || '';
    }
    );
    return reactiveText;
}