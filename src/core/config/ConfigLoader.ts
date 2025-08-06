import { join } from '@tauri-apps/api/path';
// import { StorageValue,Storage } from '../storage/Storage';
import { Storage, StorageClass, StorageProperty } from '@xlxz/utils';
import { globalServiceContainer } from '@/shared/services/ServiceContainer';
import { I18nLocale } from '@/shared/types/local';
import { setTheme, Theme } from '@/assets/styles/styleController';
import { LocalHelper } from '@/features/i18n/LocalHelperClass';
import { type Ref, ref } from 'vue';

const SubConfigStorage = new Storage(globalServiceContainer.fs, 'local config');

@StorageClass(SubConfigStorage)
class SubConfigLoaderClass {
    @StorageProperty('language') language: Ref<I18nLocale> = ref('zh-CN' as I18nLocale);
    @StorageProperty('theme') theme: Ref<Theme> = ref('dark' as Theme);
    @StorageProperty('ifStartWithLastPreset') ifStartWithLastPreset: Ref<boolean> = ref(false);
    @StorageProperty('modSourceFolders') modSourceFolders: Ref<string[]> = ref([] as string[]);
    @StorageProperty('modTargetFolder') modTargetFolder: Ref<string> = ref('');
    @StorageProperty('presetFolder') presetFolder: Ref<string> = ref('');
    @StorageProperty('ifUseTraditionalApply') ifUseTraditionalApply: Ref<boolean> = ref(false);
    @StorageProperty('ifKeepModNameAsModFolderName') ifKeepModNameAsModFolderName: Ref<boolean> = ref(false);
    @StorageProperty('firstLoad') firstLoad: Ref<boolean> = ref(true);
    @StorageProperty('disabledPlugins') disabledPlugins: Ref<string[]> = ref([] as string[]);



    constructor() {
        console.log(`SubConfigLoaderClass 初始化`);
    }

    async loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取本地配置`);
        await SubConfigStorage.loadFrom(filePath);
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

    async clearAllConfigs(): Promise<void> {
        SubConfigStorage.reset();
    }

    async print(): Promise<void> {
        const configData = await SubConfigStorage.toObject();
        console.log('=== SubConfig 数据 ===');
        console.log(JSON.stringify(configData, null, 2));
    }
}

export const SubConfig = new SubConfigLoaderClass();
export const useConfig = SubConfigStorage.useStorage.bind(SubConfigStorage);