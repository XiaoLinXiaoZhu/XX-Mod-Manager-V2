import { LocalHelper } from "./LocalHelperClass";
const localHelper = new LocalHelper();


export const i18nInstance = localHelper.i18nInstance;
export const currentLanguageRef = localHelper.currentLanguageRef
export const setI18nLocale = localHelper.setI18nLocale.bind(localHelper);
export const getTranslatedText = localHelper.getTranslatedText.bind(localHelper);
export const $rt = localHelper.$rt.bind(localHelper);
export const $t = localHelper.$t.bind(localHelper);