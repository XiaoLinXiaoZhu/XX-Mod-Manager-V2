import { SettingBarData } from "@/features/settings/settingBarConfig";
import { setI18nLocale } from "@/features/i18n";
import { I18nLocaleList ,type I18nLocale} from "@/shared/types/local";
import { setTheme, Theme } from "@/assets/styles/styleController";
import { GlobalConfig } from "@/core/config/GlobalConfigLoader";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { ref } from "vue";

const getSettingSectionData = () => {
    //- ========================== 常规设置 ========================== -//
    //-------------------- 语言 ------------------//
    let languageData: SettingBarData = {
        name: 'language',
        dataRef: GlobalConfig.language,
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
            GlobalConfig.language.value = value as I18nLocale;
            return value; // 返回新的语言代码
        }
    }    

    //-------------------- 主题 ------------------//
    let themeData: SettingBarData = {
        name: 'theme',
        dataRef: GlobalConfig.theme,
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
                GlobalConfig.theme.value = value as Theme;
                return value; // 返回新的主题
            }
        }
    }

    // 只是提供一个按钮，不绑定数据
    const refreshDuleToPlugin: SettingBarData = {
        name: 'refreshDuleToPlugin',
        dataRef: ref(false),
        type: 'iconButton',
        displayName: 'Refresh to apply plugin',
        description: 'Application needs to be refreshed to apply plugin changes',
        buttonName: 'Refresh',
        t_displayName: {
            "zh-CN": '刷新以应用更改',
            "en-US": 'Refresh to apply plugin'
        },
        t_description: {
            "zh-CN": '应用更改需要刷新',
            "en-US": 'Application needs to be refreshed to apply plugin changes'
        },
        t_buttonName: {
            "zh-CN": '刷新',
            "en-US": 'Refresh'
        },
        icon: `                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path
                                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z">
                            </path>
                        </svg>`,
        callback: () => {
            // const { ipcRenderer } = require('electron');
            // ipcRenderer.send('refresh-main-window');
            console.log('refreshDuleToPlugin clicked, refreshing the main window');
            // 这里可以使用 Tauri 的 API 来刷新窗口
            const currentWebview = getCurrentWebview();
            currentWebview.window.close();
        }
    };

    return {
        languageData,
        themeData,
        refreshDuleToPlugin
    }
};


export default getSettingSectionData;
