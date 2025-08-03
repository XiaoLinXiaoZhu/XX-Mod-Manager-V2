import { SettingBarData, SettingBarDataMulitiDir } from "@/features/settings/settingBarConfig";
import { setI18nLocale } from "@/features/i18n";
import { I18nLocaleList } from "@/shared/types/local";
import { ref } from 'vue';
import { ConfigLoader } from "@/core/config/ConfigLoader";
import { Theme, setTheme } from "@/assets/styles/styleController";
import router from "@/features/router";
import { t_snack } from "@/shared/composables/use-snack";
import { getCurrentWebview } from "@tauri-apps/api/webview";

const getSettingSectionData = () => {
    //- ========================== 常规设置 ========================== -//
    //-------------------- 语言 ------------------//
    let languageData: SettingBarData = {
        name: 'language',
        dataRef: ConfigLoader.language.refImpl,
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
        dataRef: ConfigLoader.theme.refImpl,
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
    //-------------------- 是否使用上次使用的预设 ------------------//
    let ifStartWithLastPresetData: SettingBarData = {
        name: 'ifStartWithLastPreset',
        dataRef: ConfigLoader.ifStartWithLastPreset.refImpl,
        type: 'boolean',
        displayName: 'Start With Last Preset',
        description: 'Whether to start with the last preset used', t_displayName: {
            "zh-CN": '使用上次预设',
            "en-US": 'Start With Last Preset'
        },
        t_description: {
            "zh-CN": '程序启动时是否使用上次使用的预设',
            "en-US": 'Whether to use the last preset used when the program starts'
        },
        onChange: (value) => {
            ifStartWithLastPresetData.dataRef.value = value; // 更新 dataRef 的值
        }
    }    //-------------------- 模组目标文件夹 ------------------//
    let modTargetFolderData: SettingBarData = {
        name: 'modTargetFolder',
        dataRef: ConfigLoader.modTargetFolder.refImpl,
        type: 'dir',
        displayName: 'Mod Target Folder',
        description: 'The folder of the mod target', t_displayName: {
            "zh-CN": 'mod 目标文件夹',
            "en-US": 'Mod Target Folder'
        },
        t_description: {
            "zh-CN": 'mod目标文件夹为modLoader读取mod的位置，一般为Mods文件夹',
            "en-US": 'Mod target directory is the location where modLoader reads mod, usually the Mods folder'
        },
        onChange: (value) => {
            ConfigLoader.modTargetFolder.value = value; // 更新 dataRef 的值
        }
    }    //-------------------- 模组源文件夹 ------------------//
    let modSourceFoldersData: SettingBarDataMulitiDir = {
        name: 'modSourceFolders',
        dataRef: ConfigLoader.modSourceFolders.refImpl,
        type: 'dir:multi', // 现在支持多选文件夹了
        // type: 'dir',
        displayName: 'Mod Source Folders',
        description: 'The folders of the mod source', t_displayName: {
            "zh-CN": 'mod来源文件夹',
            "en-US": 'Mod Source Folders'
        },
        t_description: {
            "zh-CN": 'mod来源文件夹为程序存储mod的位置，当mod被启用时，会从这里创建链接到mod目标文件夹。',
            "en-US": 'Mod Source directory is the location where the program stores mod. When the mod is enabled, a link will be created from here to the mod target directory.'
        },
        onChange: (value) => {
            ConfigLoader.modSourceFolders.value = value
        }
    }    //-------------------- 预设文件夹 ------------------//
    let presetFolderData: SettingBarData = {
        name: 'presetFolder',
        dataRef: ConfigLoader.presetFolder.refImpl,
        type: 'dir',
        displayName: 'Preset Folder',
        description: 'The folder of the preset', t_displayName: {
            "zh-CN": '预设文件夹',
            "en-US": 'Preset Folder'
        },
        t_description: {
            "zh-CN": '预设文件夹为存储预设的位置，预设是一组mod的集合，可以通过预设一键启用多个mod',
            "en-US": 'The preset folder is the location where the preset is stored. The preset is a collection of mods that can be enabled with one click.'
        },
        onChange: (value) => {
            console.log('presetFolder changed:', value);
            presetFolderData.dataRef.value = value; // 更新 dataRef 的值
        }
    }    //-------------------- 初始化所有数据的按钮 ------------------//
    let initAllDataButton: SettingBarData = {
        name: 'initAllData',
        dataRef: ref(null),
        type: 'button',
        displayName: 'Init All Data',
        description: 'Initialize all data', t_displayName: {
            "zh-CN": '初始化所有数据',
            "en-US": 'Init All Data'
        },
        t_description: {
            "zh-CN": '初始化所有数据',
            "en-US": 'Initialize all data'
        }, buttonName: 'Init All Data',
        t_buttonName: {
            "zh-CN": '初始化所有数据',
            "en-US": 'Init All Data'
        },
        callback: () => {
            ConfigLoader.clearAllConfigs().then(() => {
                // ! 这里应该要求用户重启程序
                console.log('All data initialized successfully');
            });
        }
    }    //-------------------- 打开 firstLoad 页面的按钮 ------------------//
    let openFirstLoadButton: SettingBarData = {
        name: 'openFirstLoad',
        dataRef: ConfigLoader.firstLoad.refImpl,
        type: 'iconButton',
        displayName: 'Open First Load',
        description: 'Open First Load', t_displayName: {
            "zh-CN": '新手引导',
            "en-US": 'New User Guide'
        },
        t_description: {
            "zh-CN": '打开 新手引导 页面',
            "en-US": 'Open New User Guide Page'
        }, buttonName: 'First Load',
        t_buttonName: {
            "zh-CN": '打开 新手引导',
            "en-US": 'Open New User Guide'
        },
        callback: () => {
            // iManager.openNewWindow('firstLoad');
            // iManager.config.firstLoad = true;
            router.push({ name: 'firstLoad' });
            openFirstLoadButton.dataRef.value = true; // 更新 dataRef 的值
        }
    }

    const ifKeepModNameAsModFolderName: SettingBarData = {
        name: 'ifKeepModNameAsModFolderName',
        dataRef: ConfigLoader.ifKeepModNameAsModFolderName.refImpl,
        type: 'boolean',
        displayName: 'Keep Mod Name As Mod Folder Name',
        t_displayName: {
            "zh-CN": '保持mod名称与mod文件夹名称一致',
            "en-US": 'Keep Mod Name As Mod Folder Name'
        },
        onChange: (value) => {
            console.log('ifKeepModNameAsModFolderName changed:', value);
            ifKeepModNameAsModFolderName.dataRef.value = value;
        }
    }

    const ifUseTraditionalApply: SettingBarData = {
        name: 'ifUseTraditionalApply',
        dataRef: ConfigLoader.ifUseTraditionalApply.refImpl,
        type: 'boolean',
        displayName: 'Use Traditional Apply',
        t_displayName: {
            "zh-CN": '使用传统应用方式',
            "en-US": 'Use Traditional Apply'
        },
        description: 'If true, the mod will be applied in a traditional way',
        t_description: {
            "zh-CN": '开启后，mod将以传统方式应用，使用传统模式时，将会通过更改文件夹名称来变更mod应用状态',
            "en-US": 'If true, the mod will be applied in a traditional way, using the traditional mode, the mod application status will be changed by changing the folder name'
        },
        onChange: (value) => {
            // 检查：
            // 1. modTarget和 modSource 需要是同一个文件夹
            // 2. ifKeepModNameAsModFolderName 需要是 false

            if (value) {
                const modTargetFolder = ConfigLoader.modTargetFolder.refImpl.value;
                const modSourceFolders = ConfigLoader.modSourceFolders.refImpl.value;
                const ifKeepModNameAsModFolderName = ConfigLoader.ifKeepModNameAsModFolderName.refImpl.value;
                // 检查 modTargetFolder 是否包含在 modSourceFolders 数组中
                if (!modSourceFolders.includes(modTargetFolder)) {
                    console.log('ifUseTraditionalApply changed:', value, 'modTarget and modSource need to be the same folder');
                    // "zh-CN": '在传统模式下，mod目标和源文件夹需要是同一个文件夹',
                    // "en-US": 'modTarget and modSource need to be the same folder'
                    t_snack({
                        "zh-CN": '在传统模式下，mod目标和源文件夹需要是同一个文件夹',
                        "en-US": 'modTarget and modSource need to be the same folder'
                    }, "error")
                    return false;
                }

                if (ifKeepModNameAsModFolderName) {
                    console.log('ifUseTraditionalApply changed:', value, 'ifKeepModNameAsModFolderName need to be false');
                    t_snack({
                        "zh-CN": '使用该功能需要 关闭 保持mod名称与mod文件夹名称一致，请在 设置/常规设置 中关闭',
                        "en-US": 'ifKeepModNameAsModFolderName need to be false, please turn it off in the setting/normal setting'
                    }, "error")
                    return false;
                }
                // debug
                console.log('ifUseTraditionalApply changed:', value);
                ifUseTraditionalApply.dataRef.value = true;
            }
            else {
                // debug
                console.log('ifUseTraditionalApply changed:', value);
                ifUseTraditionalApply.dataRef.value = false;
            }
        }
    }

    const createShortOfCurrentConfig: SettingBarData = {
        name: 'createShortOfCurrentConfig',
        dataRef: ref(null),
        type: 'iconButton',
        displayName: 'Create Short Of Custom Config',
        description: 'Create Short Of Custom Config',
        buttonName: 'Create',
        t_displayName: {
            "zh-CN": '创建使用本地配置的快捷方式',
            "en-US": 'Create Short Of Current Config'
        },
        t_description: {
            "zh-CN": '创建使用本地配置的快捷方式',
            "en-US": 'Create Short Of Current Config'
        },
        t_buttonName: {
            "zh-CN": '创建快捷方式',
            "en-US": 'Create Short Cut'
        },
        onChange: (_value) => {
            console.log('createShortOfCurrentConfig changed:', createShortOfCurrentConfig.dataRef.value);

            // ! 暂时没有实现
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
        ifStartWithLastPresetData,
        modTargetFolderData,
        modSourceFoldersData,
        presetFolderData,
        initAllDataButton,
        openFirstLoadButton,
        ifKeepModNameAsModFolderName,
        ifUseTraditionalApply,
        createShortOfCurrentConfig,
        refreshDuleToPlugin
    }
};


export default getSettingSectionData;
