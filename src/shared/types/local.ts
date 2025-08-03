export type I18nLocale = "en-US" | "zh-CN";
export type TranslatedText = Record<I18nLocale, string>;
export const I18nLocaleList: I18nLocale[] = ["en-US", "zh-CN"]; // 支持的语言列表