import { currentLanguage,setI18nLocale,type I18nLocale } from "@/locals";

/** @class
 * @classdesc TranslatedText 用于简化多语言文本的获取
 * @param {string} enText - 英文文本
 * @param {string} cnText - 中文文本
 */
export class TranslatedText {
    public en : string;
    public zh_cn : string;

    constructor(enText: string, cnText: string) {
        this.en = enText;
        this.zh_cn = cnText;
    }

    public getText(language: I18nLocale) {
        if (language === 'en-US') {
            return this.en;
        } else if (language === 'zh-CN') {
            return this.zh_cn;
        }

        return this.en;
    }

    /** @function
     * @desc 获取当前的文本，根据当前的语言环境
     * @returns {string} 当前的文本
     */
    public get() {
        return this.getText(currentLanguage);
    }

    public static fromObject(obj: any) {
        if (obj.en && obj.zh_cn) {
            return new TranslatedText(obj.en, obj.zh_cn);
        } else {
            console.error('TranslatedText.fromObject error: obj is invalid', obj);
            return new TranslatedText('', '');
        }
    }
}