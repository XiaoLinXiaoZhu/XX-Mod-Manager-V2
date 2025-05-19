import { createI18n } from "vue-i18n";
import en_us from "./en-US.json";
import zh_cn from "./zh-CN.json";
import { EventType,EventSystem } from "@/scripts/core/EventSystem";

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

export const setI18nLocale = (locale: I18nLocale) => {
    i18nInstance.global.locale.value = locale;

    EventSystem.trigger(EventType.languageChange, locale);
};
