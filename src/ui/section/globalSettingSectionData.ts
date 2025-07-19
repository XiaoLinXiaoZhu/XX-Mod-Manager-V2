import { SettingBarData } from "@/features/settings/settingBarConfig";
import { setI18nLocale, I18nLocaleList } from "@/shared/composables/localHelper";
import { ConfigLoader } from "@/core/config/ConfigLoader";
import { Theme, setTheme } from "@/assets/styles/styleController";

const getSettingSectionData = () => {
    //- ========================== 常规设置 ========================== -//
    //-------------------- 语言 ------------------//
    let languageData: SettingBarData = {
        name: 'language',
        dataRef: ConfigLoader.language.getRef(),
        type: 'select',
        displayName: 'Language',
        description: '', t_displayName: {
            "zh-CN": '语言',
            "en-US": 'Language'
        },
        options: [{
            value: 'en-US', t_value: {
                "zh-CN": 'English',
                "en-US": 'English'
            }
        },
        {
            value: 'zh-CN', t_value: {
                "zh-CN": '简体中文',
                "en-US": '简体中文'
            }
        }
        ],
        onChange: (value) => {
            console.log('language changed:', value);
            // 检查 value 是否为有效的语言代码(通过 I18nLocaleList)
            if (!I18nLocaleList.includes(value as any)) {
                console.error(`Invalid language code: ${value}`);
                return 'en-US'; // 如果无效，返回默认语言
            }
            setI18nLocale(value);
            return value; // 返回新的语言代码
        }
    }    

    //-------------------- 主题 ------------------//
    let themeData: SettingBarData = {
        name: 'theme',
        dataRef: ConfigLoader.theme.getRef(),
        type: 'select',
        displayName: 'Theme',
        description: '', t_displayName: {
            "zh-CN": '主题',
            "en-US": 'Theme'
        },
        options: [{
            value: 'auto', t_value: {
                "zh-CN": '自动',
                "en-US": 'Auto'
            }
        },
        {
            value: 'dark', t_value: {
                "zh-CN": '暗色',
                "en-US": 'Dark'
            }
        },
        {
            value: 'light', t_value: {
                "zh-CN": '亮色',
                "en-US": 'Light'
            }
        }
        ],
        onChange: (value) => {
            console.log('theme changed:', value);
            if (!value || !['auto', 'dark', 'light'].includes(value as string)) {
                console.error(`Invalid theme value: ${value}`);
                return 'dark'; // 如果无效，返回默认主题
            } else {
                setTheme(value as Theme);
                return value; // 返回新的主题
            }
        }
    }

    return {
        languageData,
        themeData,
    }
};


export default getSettingSectionData;
