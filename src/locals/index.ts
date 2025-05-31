import { createI18n } from "vue-i18n";
import en_us from "./en-US.json";
import zh_cn from "./zh-CN.json";
import { EventType,EventSystem } from "@/scripts/core/EventSystem";
import { ref } from "vue";

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
export let currentLanguageRef = ref<I18nLocale>(currentLanguage); // 当前语言的引用

export const setI18nLocale = (locale: I18nLocale) => {
    i18nInstance.global.locale.value = locale;
    currentLanguage = locale;
    currentLanguageRef.value = locale;

    EventSystem.trigger(EventType.languageChange, locale);
};

// 暴露它的翻译函数
export const $t = (key: string) => {
    return i18nInstance.global.t(key);
};