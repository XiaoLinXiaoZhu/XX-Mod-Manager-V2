/**
 * 国际化模块类型定义
 * 定义国际化相关的类型和接口
 */

// 语言代码
export type LanguageCode = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';

// 兼容旧版本的国际化类型
export type I18nLocale = 'en-US' | 'zh-CN';
export type TranslatedText = Record<I18nLocale, string>;
export const I18nLocaleList: I18nLocale[] = ['en-US', 'zh-CN'];

// 本地化键值
export type LocalizationKey = string;

// 本地化值
export type LocalizationValue = string | number | boolean;

// 本地化数据
export interface LocalizationData {
  [key: string]: LocalizationValue | LocalizationData;
}

// 语言包
export interface LanguagePack {
  code: LanguageCode;
  name: string;
  nativeName: string;
  data: LocalizationData;
}

// 本地化选项
export interface LocalizationOptions {
  fallbackLanguage?: LanguageCode;
  interpolation?: boolean;
  pluralization?: boolean;
}

// 本地化结果
export interface LocalizationResult {
  success: boolean;
  value?: string;
  error?: string;
  key: string;
  language: LanguageCode;
}

// 语言检测结果
export interface LanguageDetectionResult {
  detectedLanguage: LanguageCode;
  confidence: number;
  alternatives: LanguageCode[];
}

// 本地化统计
export interface LocalizationStatistics {
  totalKeys: number;
  translatedKeys: number;
  missingKeys: number;
  completionRate: number;
  languages: LanguageCode[];
}

// 本地化错误
export interface LocalizationError {
  key: string;
  language: LanguageCode;
  message: string;
  type: 'MISSING_KEY' | 'INVALID_FORMAT' | 'INTERPOLATION_ERROR' | 'PLURALIZATION_ERROR';
}
