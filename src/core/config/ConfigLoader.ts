import { join } from '@tauri-apps/api/path';
// import { StorageValue,Storage } from '../storage/Storage';
import { Storage } from '@xlxz/utils';
import { I18nLocale } from '@/shared/types/local';
import { setTheme, Theme } from '@/assets/styles/styleController';
import { LocalHelper } from '@/features/i18n/LocalHelperClass';

class SubConfigLoaderClass extends Storage {

    constructor() {
        super('local config');
        console.log(`SubConfigLoaderClass 初始化`);
    }

    async loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取本地配置`);
        await super.loadFrom(filePath);
        // 特殊配置一下 presetFolder
        // 如果 presetFolder 没有设置，则使用 filePath 下的 presets 文件夹
        if (!this.presetFolder.value || this.presetFolder.value === '') {
            this.presetFolder.value = await join(filePath, 'presets');
        }

        this.refreshStates();
        return;
    }

    async refreshStates(): Promise<void> {
        console.log(`刷新本地配置状态`);
        // set 一下语言
        const localHelper = new LocalHelper();
        localHelper.setI18nLocale(this.language.value);

        // set 一下主题
        setTheme(this.theme.value);

    }

    //-------------------- 语言 ------------------//
    language = this.useConfig('language', 'zh-CN' as I18nLocale, true);
    theme = this.useConfig('theme', 'dark' as Theme, true);
    //-------------------- 是否使用上次使用的预设 ------------------//
    ifStartWithLastPreset = this.useConfig('ifStartWithLastPreset', false);

    modSourceFolders = this.useConfig('modSourceFolders', [] as string[]);
    modTargetFolder = this.useConfig('modTargetFolder', '');
    presetFolder = this.useConfig('presetFolder', '');

    ifUseTraditionalApply = this.useConfig('ifUseTraditionalApply', false);
    ifKeepModNameAsModFolderName = this.useConfig('ifKeepModNameAsModFolderName', false);
    
    //-------------------- 新手引导 ------------------//
    firstLoad = this.useConfig('firstLoad', true, true);

}

export const ConfigLoader = new SubConfigLoaderClass();
export const useConfig = ConfigLoader.useConfig.bind(ConfigLoader);