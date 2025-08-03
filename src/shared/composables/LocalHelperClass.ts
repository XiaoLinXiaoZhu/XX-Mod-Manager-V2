import { createI18n } from "vue-i18n";
import { SingletonDecorator } from "../utils/Singleton";

import { resolveResource } from '@tauri-apps/api/path'

import en_us from "../../../src-tauri/resources/locals/en-US.json";
import zh_cn from "../../../src-tauri/resources/locals/zh-CN.json";
import { readFile } from "../services/FileHelper";

import { computed, ComputedRef, Ref, ref, watch } from "vue";
import { I18nLocale, I18nLocaleList, TranslatedText } from "@/shared/types/local";


@SingletonDecorator
export class LocalHelper {
    constructor() {
        console.log('LocalHelper initialized');
    }

    i18nInstance = createI18n({
        locale: "en-US", // set locale
        fallbackLocale: "en-US", // set fallback locale
        legacy: false, // you must set `false`, to use Composition API
        messages: {
            "en-US": en_us,
            "zh-CN": zh_cn,
        },
    });

    public currentLanguageRef = computed({
        get: () => this.i18nInstance.global.locale.value as I18nLocale,
        set: (locale: I18nLocale) => {
            this.i18nInstance.global.locale.value = locale;
        }
    })

    public async switchToLocalFile() {
        const en_usPath = await resolveResource("locals/en-US.json");
        const zh_cnPath = await resolveResource("locals/zh-CN.json");

        // read the files
        const en_usContent = await readFile(en_usPath, false);
        const zh_cnContent = await readFile(zh_cnPath, false);

        // set the messages
        this.i18nInstance.global.setLocaleMessage("en-US", JSON.parse(en_usContent));
        this.i18nInstance.global.setLocaleMessage("zh-CN", JSON.parse(zh_cnContent));
    }

    public $t = (key: string, namedValue?: Record<string, any>) => {
        if (namedValue === undefined || namedValue === null) {
            return this.i18nInstance.global.t(key);
        }
        return this.i18nInstance.global.t(key, namedValue);
    };

    public $rt = (key: string, namedValue?: Record<string, any>) => {
        return computed(() => {
            // 引用一下 currentLanguageRef 使其 更随其变更
            if (this.currentLanguageRef.value === undefined || this.currentLanguageRef.value === null) {
                console.error('当前语言未设置，无法获取翻译');
                return key; // 返回原始 key
            }
            if (namedValue === undefined || namedValue === null) {
                // debug
                console.log(`获取翻译: ${key}，当前语言: ${this.currentLanguageRef.value}`);
                return this.i18nInstance.global.t(key);
            }
            return this.i18nInstance.global.t(key, namedValue);
        });
    };

    public setI18nLocale = (locale: I18nLocale) => {
        // debug
        console.log(`设置语言从 ${this.i18nInstance.global.locale.value} 到 ${locale}`);
        this.currentLanguageRef.value = locale;
        this.i18nInstance.global.locale.value = locale;

        // EventSystem.trigger(EventType.languageChange, locale);
    };

    /** @function
     * @desc 获取当前语言的翻译文本，响应式
     * @param {TranslatedText} text
     * @returns {ComputedRef<string>}
     * @note 如果当前语言没有对应的文本，则返回英文文本或空字符串
     */
    getTranslatedText(text: TranslatedText) {
        if (text === undefined || text === null) {
            console.error('getTranslatedText error: text is undefined or null');
        }
        // 如果当前语言没有对应的文本，报错
        if (!text[this.currentLanguageRef.value] || text[this.currentLanguageRef.value] === '') {
            console.error('getTranslatedText error: text is empty for current language', this.currentLanguageRef.value);
        }
        // 返回一个响应式的计算属性
        return computed(() => (true ? "" : "⚙️") + (text[this.currentLanguageRef.value as I18nLocale] || text['en-US'] || ''));
    }
}