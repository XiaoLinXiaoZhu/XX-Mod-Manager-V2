/**
 * 国际化系统兼容桥接层
 * 提供旧国际化系统的兼容接口
 */

import { createI18n } from "vue-i18n";
import { computed } from 'vue';
import { resolveResource } from '@tauri-apps/api/path';
import type { I18nLocale } from "@/shared/types/local";
import { globalServiceContainer } from "@/shared/services/ServiceContainer";

// 默认语言文件内容
const DEFAULT_MESSAGES = {
  "en-US": {
    "message": {
      "hello": "Hello, World",
      "alert": {
        "emptyModSourceOrTarget": "mod destination folder or mod source folder is empty"
      }
    }
  },
  "zh-CN": {
    "message": {
      "hello": "你好，世界",
      "alert": {
        "emptyModSourceOrTarget": "mod目标文件夹或mod源文件夹为空"
      }
    }
  }
};

/**
 * 兼容的本地化助手类
 * 提供与旧系统相同的API，但使用新的国际化模块
 */
export class LocalHelper {
  i18nInstance = createI18n({
    locale: "en-US", // set locale
    fallbackLocale: "en-US", // set fallback locale
    legacy: false, // you must set `false`, to use Composition API
    messages: DEFAULT_MESSAGES,
  });

  constructor() {
    console.log('LocalHelper initialized');
    this.loadLanguageFiles();
  }

  private async loadLanguageFiles() {
    try {
      const en_usPath = await resolveResource("locals/en-US.json");
      const zh_cnPath = await resolveResource("locals/zh-CN.json");

      // read the files
      const en_usContent = await globalServiceContainer.fs.readFile(en_usPath, false);
      const zh_cnContent = await globalServiceContainer.fs.readFile(zh_cnPath, false);

      // set the messages
      this.i18nInstance.global.setLocaleMessage("en-US", JSON.parse(en_usContent));
      this.i18nInstance.global.setLocaleMessage("zh-CN", JSON.parse(zh_cnContent));
    } catch (error) {
      console.warn('Failed to load language files, using defaults:', error);
    }
  }

  public currentLanguageRef = computed({
    get: () => this.i18nInstance.global.locale.value as I18nLocale,
    set: (locale: I18nLocale) => {
      this.i18nInstance.global.locale.value = locale;
    }
  });

  public async switchToLocalFile() {
    const en_usPath = await resolveResource("locals/en-US.json");
    const zh_cnPath = await resolveResource("locals/zh-CN.json");

    // read the files
    const en_usContent = await globalServiceContainer.fs.readFile(en_usPath, false);
    const zh_cnContent = await globalServiceContainer.fs.readFile(zh_cnPath, false);

    // set the messages
    this.i18nInstance.global.setLocaleMessage("en-US", JSON.parse(en_usContent));
    this.i18nInstance.global.setLocaleMessage("zh-CN", JSON.parse(zh_cnContent));
  }

  public $t = (key: string, namedValue?: Record<string, unknown>) => {
    return this.i18nInstance.global.t(key, namedValue || {});
  };

  public $rt = (key: string, namedValue?: Record<string, unknown>) => {
    return this.i18nInstance.global.rt(key, namedValue || {});
  };

  public getTranslatedText = (key: string, namedValue?: Record<string, unknown>) => {
    return this.i18nInstance.global.t(key, namedValue || {});
  };

  public setI18nLocale = (locale: I18nLocale) => {
    this.i18nInstance.global.locale.value = locale;
  };
}

// 创建全局本地化助手实例
const globalLocalHelper = new LocalHelper();

// 导出兼容的国际化接口
export const i18nInstance = globalLocalHelper.i18nInstance;
export const currentLanguageRef = globalLocalHelper.currentLanguageRef;
export const setI18nLocale = globalLocalHelper.setI18nLocale.bind(globalLocalHelper);
export const getTranslatedText = globalLocalHelper.getTranslatedText.bind(globalLocalHelper);
export const $rt = globalLocalHelper.$rt.bind(globalLocalHelper);
export const $t = globalLocalHelper.$t.bind(globalLocalHelper);
