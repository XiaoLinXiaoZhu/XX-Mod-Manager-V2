import { checkForUpdates } from '@/scripts/core/UpdateChecker.ts';
import { ConfigLoader, useConfig } from '@/scripts/core/ConfigLoader.ts';
import { getArgv } from '../lib/Argv';
import { isDirectoryExists } from '../lib/FileHelper';
import { invoke } from '@tauri-apps/api/core';
import { setI18nLocale, I18nLocale } from '@/locals';
import { snack } from '../lib/SnackHelper';
import { ModLoader } from '@/scripts/lib/ModLoader';

//-================ 主进程入口 =================
export async function init() {
    const argv = await getArgv() as any;
    // 如果有 useCustomConfig 参数，则加载自定义配置
    if (argv.useCustomConfig && await isDirectoryExists(argv.useCustomConfig)) {
        await ConfigLoader.loadFrom(argv.useCustomConfig);
    } else {
        // 如果没有 useCustomConfig 参数，则加载默认配置
        await ConfigLoader.loadDefaultConfig();
    }

    //--- 检查更新 ---
    const ifCheckUpdatesOnStart = useConfig('checkUpdatesOnStart', false);
    if (ifCheckUpdatesOnStart.value) {
        checkForUpdates();
    }

    //--- 加载默认配置 ---
    const language = useConfig('language', 'zh-CN' as I18nLocale);
    // 设置语言
    setI18nLocale(language.value);

    ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource").then(() => {
        console.log('ModLoader: addModSourceFolder success');
        ModLoader.loadMods();
    }).catch((err) => {
        console.error('ModLoader: addModSourceFolder error', err);
    });

    snack('欢迎使用 XXMM', "info");








    // 加载完毕，触发事件
    invoke('main_window_ready');
}