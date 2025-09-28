/**
 * 本地化助手模块
 * 提供国际化相关的纯函数
 */

import { 
  LanguageCode, 
  LocalizationKey, 
  LocalizationValue, 
  LocalizationData, 
  LanguagePack,
  LocalizationOptions,
  LocalizationResult,
  LanguageDetectionResult,
  LocalizationStatistics,
  LocalizationError
} from './types';
import { Result, KernelError } from '@/kernels/types';

// 默认语言
const DEFAULT_LANGUAGE: LanguageCode = 'zh-CN';

// 支持的语言列表
const SUPPORTED_LANGUAGES: LanguageCode[] = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR'];

// 默认本地化选项
const DEFAULT_OPTIONS: Required<LocalizationOptions> = {
  fallbackLanguage: 'zh-CN',
  interpolation: true,
  pluralization: true
};

/**
 * 验证语言代码
 */
export function validateLanguageCode(code: string): Result<LanguageCode, KernelError> {
  if (!code || typeof code !== 'string') {
    return {
      success: false,
      error: new KernelError(
        'Language code must be a non-empty string',
        'INVALID_LANGUAGE_CODE',
        { code }
      )
    };
  }

  const normalizedCode = code.trim() as LanguageCode;
  if (!SUPPORTED_LANGUAGES.includes(normalizedCode)) {
    return {
      success: false,
      error: new KernelError(
        'Unsupported language code',
        'UNSUPPORTED_LANGUAGE_CODE',
        { code: normalizedCode, supportedLanguages: SUPPORTED_LANGUAGES }
      )
    };
  }

  return {
    success: true,
    data: normalizedCode
  };
}

/**
 * 验证本地化键
 */
export function validateLocalizationKey(key: string): Result<LocalizationKey, KernelError> {
  if (!key || typeof key !== 'string' || key.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Localization key must be a non-empty string',
        'INVALID_LOCALIZATION_KEY',
        { key }
      )
    };
  }

  const normalizedKey = key.trim();
  if (!/^[a-zA-Z0-9._-]+$/.test(normalizedKey)) {
    return {
      success: false,
      error: new KernelError(
        'Localization key contains invalid characters',
        'INVALID_KEY_FORMAT',
        { key: normalizedKey }
      )
    };
  }

  return {
    success: true,
    data: normalizedKey
  };
}

/**
 * 验证本地化数据
 */
export function validateLocalizationData(data: unknown): Result<LocalizationData, KernelError> {
  if (!data || typeof data !== 'object') {
    return {
      success: false,
      error: new KernelError(
        'Localization data must be an object',
        'INVALID_LOCALIZATION_DATA',
        { data }
      )
    };
  }

  return {
    success: true,
    data: data as LocalizationData
  };
}

/**
 * 创建语言包
 */
export function createLanguagePack(
  code: LanguageCode,
  name: string,
  nativeName: string,
  data: LocalizationData
): Result<LanguagePack, KernelError> {
  const codeValidation = validateLanguageCode(code);
  if (!codeValidation.success) {
    return codeValidation;
  }

  const dataValidation = validateLocalizationData(data);
  if (!dataValidation.success) {
    return dataValidation;
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Language name must be a non-empty string',
        'INVALID_LANGUAGE_NAME',
        { name }
      )
    };
  }

  if (!nativeName || typeof nativeName !== 'string' || nativeName.trim().length === 0) {
    return {
      success: false,
      error: new KernelError(
        'Native language name must be a non-empty string',
        'INVALID_NATIVE_NAME',
        { nativeName }
      )
    };
  }

  return {
    success: true,
    data: {
      code: codeValidation.data,
      name: name.trim(),
      nativeName: nativeName.trim(),
      data: dataValidation.data
    }
  };
}

/**
 * 获取本地化值
 */
export function getLocalizationValue(
  key: LocalizationKey,
  languagePack: LanguagePack,
  options: LocalizationOptions = {}
): Result<string, KernelError> {
  const keyValidation = validateLocalizationKey(key);
  if (!keyValidation.success) {
    return keyValidation;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedKey = keyValidation.data;

  // 从语言包中获取值
  const value = getNestedValue(languagePack.data, normalizedKey);
  if (value !== undefined) {
    return {
      success: true,
      data: String(value)
    };
  }

  // 如果启用了回退语言且当前语言不是回退语言
  if (opts.fallbackLanguage && languagePack.code !== opts.fallbackLanguage) {
    return {
      success: false,
      error: new KernelError(
        'Key not found in current language, fallback required',
        'KEY_NOT_FOUND',
        { key: normalizedKey, language: languagePack.code, fallbackLanguage: opts.fallbackLanguage }
      )
    };
  }

  return {
    success: false,
    error: new KernelError(
      'Key not found',
      'KEY_NOT_FOUND',
      { key: normalizedKey, language: languagePack.code }
    )
  };
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: LocalizationData, key: string): LocalizationValue | undefined {
  const keys = key.split('.');
  let current = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = current[k] as LocalizationData;
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' || typeof current === 'number' || typeof current === 'boolean' 
    ? current 
    : undefined;
}

/**
 * 设置本地化值
 */
export function setLocalizationValue(
  key: LocalizationKey,
  value: LocalizationValue,
  languagePack: LanguagePack
): Result<LanguagePack, KernelError> {
  const keyValidation = validateLocalizationKey(key);
  if (!keyValidation.success) {
    return keyValidation;
  }

  const normalizedKey = keyValidation.data;
  const newData = { ...languagePack.data };
  setNestedValue(newData, normalizedKey, value);

  return {
    success: true,
    data: {
      ...languagePack,
      data: newData
    }
  };
}

/**
 * 设置嵌套值
 */
function setNestedValue(obj: LocalizationData, key: string, value: LocalizationValue): void {
  const keys = key.split('.');
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object') {
      current[k] = {};
    }
    current = current[k] as LocalizationData;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * 检查键是否存在
 */
export function hasLocalizationKey(
  key: LocalizationKey,
  languagePack: LanguagePack
): boolean {
  const keyValidation = validateLocalizationKey(key);
  if (!keyValidation.success) {
    return false;
  }

  return getNestedValue(languagePack.data, keyValidation.data) !== undefined;
}

/**
 * 获取所有键
 */
export function getAllLocalizationKeys(languagePack: LanguagePack): string[] {
  return extractKeys(languagePack.data);
}

/**
 * 提取所有键
 */
function extractKeys(obj: LocalizationData, prefix = ''): string[] {
  const keys: string[] = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof value === 'object' && value !== null) {
      keys.push(...extractKeys(value as LocalizationData, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
}

/**
 * 检测语言
 */
export function detectLanguage(
  text: string,
  availableLanguages: LanguageCode[]
): LanguageDetectionResult {
  // 这里应该实现实际的语言检测逻辑
  // 目前返回默认语言作为占位符
  return {
    detectedLanguage: DEFAULT_LANGUAGE,
    confidence: 0.5,
    alternatives: availableLanguages.filter(lang => lang !== DEFAULT_LANGUAGE)
  };
}

/**
 * 获取本地化统计信息
 */
export function getLocalizationStatistics(
  languagePacks: LanguagePack[]
): LocalizationStatistics {
  const totalKeys = languagePacks.length > 0 ? getAllLocalizationKeys(languagePacks[0]).length : 0;
  const languages = languagePacks.map(pack => pack.code);
  
  let translatedKeys = 0;
  let missingKeys = 0;

  if (languagePacks.length > 0) {
    const referencePack = languagePacks[0];
    const referenceKeys = getAllLocalizationKeys(referencePack);
    
    for (const pack of languagePacks) {
      for (const key of referenceKeys) {
        if (hasLocalizationKey(key, pack)) {
          translatedKeys++;
        } else {
          missingKeys++;
        }
      }
    }
  }

  const completionRate = totalKeys > 0 ? (translatedKeys / (totalKeys * languagePacks.length)) * 100 : 0;

  return {
    totalKeys,
    translatedKeys,
    missingKeys,
    completionRate: Math.round(completionRate * 100) / 100,
    languages
  };
}

/**
 * 验证语言包完整性
 */
export function validateLanguagePackIntegrity(
  languagePack: LanguagePack,
  referencePack?: LanguagePack
): LocalizationError[] {
  const errors: LocalizationError[] = [];
  
  if (!referencePack) {
    return errors;
  }

  const referenceKeys = getAllLocalizationKeys(referencePack);
  const packKeys = getAllLocalizationKeys(languagePack);

  // 检查缺失的键
  for (const key of referenceKeys) {
    if (!packKeys.includes(key)) {
      errors.push({
        key,
        language: languagePack.code,
        message: `Missing key: ${key}`,
        type: 'MISSING_KEY'
      });
    }
  }

  // 检查多余的键
  for (const key of packKeys) {
    if (!referenceKeys.includes(key)) {
      errors.push({
        key,
        language: languagePack.code,
        message: `Extra key: ${key}`,
        type: 'INVALID_FORMAT'
      });
    }
  }

  return errors;
}

/**
 * 合并语言包
 */
export function mergeLanguagePacks(
  basePack: LanguagePack,
  overridePack: LanguagePack
): Result<LanguagePack, KernelError> {
  if (basePack.code !== overridePack.code) {
    return {
      success: false,
      error: new KernelError(
        'Cannot merge language packs with different codes',
        'INCOMPATIBLE_LANGUAGE_PACKS',
        { baseCode: basePack.code, overrideCode: overridePack.code }
      )
    };
  }

  const mergedData = deepMerge(basePack.data, overridePack.data);

  return {
    success: true,
    data: {
      ...basePack,
      data: mergedData
    }
  };
}

/**
 * 深度合并对象
 */
function deepMerge(target: LocalizationData, source: LocalizationData): LocalizationData {
  const result = { ...target };

  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = deepMerge(
        (result[key] as LocalizationData) || {},
        value as LocalizationData
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/**
 * 获取支持的语言列表
 */
export function getSupportedLanguages(): LanguageCode[] {
  return [...SUPPORTED_LANGUAGES];
}

/**
 * 检查语言是否支持
 */
export function isLanguageSupported(code: string): boolean {
  return SUPPORTED_LANGUAGES.includes(code as LanguageCode);
}

/**
 * 获取默认语言
 */
export function getDefaultLanguage(): LanguageCode {
  return DEFAULT_LANGUAGE;
}
