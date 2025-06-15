import { checkForUpdates } from '@/scripts/core/UpdateChecker.ts';
import { GlobalConfigLoader, useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { ConfigLoader,useConfig } from './ConfigLoader';
import { getArgv } from '../lib/Argv';
import { isDirectoryExists } from '../lib/FileHelper';
import { invoke } from '@tauri-apps/api/core';
import { setI18nLocale, I18nLocale } from '@/locals';
import { snack } from '../lib/SnackHelper';
import { ModLoader } from '@/scripts/lib/ModLoader';
import { useRouter } from 'vue-router';
import { EventSystem, EventType } from './EventSystem';

//-================ 主进程入口 =================
export async function init() {
    const router = useRouter();
    const argv = await getArgv() as any;
    // 加载全局配置
    await GlobalConfigLoader.loadDefaultConfig();
    // 页面卸载时，保存全局配置
    window.addEventListener('beforeunload', () => {
        GlobalConfigLoader.save();
    });
    
    // 如果有 useCustomConfig 参数，则加载自定义配置
    if (argv.useCustomConfig && await isDirectoryExists(argv.useCustomConfig)) {
        await ConfigLoader.loadFrom(argv.useCustomConfig);
        // 页面直接跳转到 modList 页面
        router.push({ name: 'modList' });
    } else {
        // 如果没有 useCustomConfig 参数，则不加载配置
    }

    //--- 检查更新 ---
    const ifCheckUpdatesOnStart = useGlobalConfig('checkUpdatesOnStart', false);
    if (ifCheckUpdatesOnStart.value) {
        checkForUpdates();
    }

    //--- 加载默认配置 ---
    const language = useGlobalConfig('language', 'zh-CN' as I18nLocale);
    // 设置语言
    setI18nLocale(language.value);

    // ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource").then(() => {
    //     console.log('ModLoader: addModSourceFolder success');
    //     ModLoader.loadMods();
    // }).catch((err) => {
    //     console.error('ModLoader: addModSourceFolder error', err);
    // });

    snack('欢迎使用 XXMM', "info");








    // 加载完毕，触发事件，之后，如果是第一次打开程序（而不是刷新页面），则会触发 wakeUp 事件
    invoke('main_window_ready');
    EventSystem.trigger(EventType.initDone);
}