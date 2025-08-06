// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { globalServiceContainer } from '@/shared/services/ServiceContainer';
import { join } from '@tauri-apps/api/path';
// import { Storage } from '../storage/Storage';
import { Storage, StorageProperty,StorageClass } from '@xlxz/utils';
import { setTheme, type Theme } from '@/assets/styles/styleController';
import { type I18nLocale } from '@/shared/types/local';
import { LocalHelper } from '@/features/i18n/LocalHelperClass';
import { ref } from 'vue';

const globalConfigStorage = new Storage(globalServiceContainer.fs, 'global config');


@StorageClass(globalConfigStorage)
class GlobalConfigClass {
    @StorageProperty("language") language = ref<I18nLocale>('zh-CN' as I18nLocale);
    @StorageProperty("theme") theme = ref<Theme>('dark' as Theme);
    @StorageProperty("ifStartWithLastPreset") ifStartWithLastPreset = ref<boolean>(false);
    @StorageProperty("modSourceFolders") modSourceFolders = ref<string[]>([]);
    @StorageProperty("modTargetFolder") modTargetFolder = ref<string>('');
    @StorageProperty("presetFolder") presetFolder = ref<string>('');
    @StorageProperty("ifUseTraditionalApply") ifUseTraditionalApply = ref<boolean>(false);
    @StorageProperty("ifKeepModNameAsModFolderName") ifKeepModNameAsModFolderName = ref<boolean>(false);
    @StorageProperty("firstLoad") firstLoad = ref<boolean>(true);
    @StorageProperty("disabledPlugins") disabledPlugins = ref<string[]>([]);
    @StorageProperty("lastUsedGameRepo") lastUsedGameRepo = ref<string>(''); // 最近使用的游戏仓库路径
    @StorageProperty("checkUpdatesOnStart") checkUpdatesOnStart = ref<boolean>(true); // 是否在启动时检查更新

    constructor() {
        console.log(`GlobalConfigClass 初始化`);
    }

    async loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取全局配置`);
        await globalConfigStorage.loadFrom(filePath);
        // 特殊配置一下 presetFolder
        // 如果 presetFolder 没有设置，则使用 filePath 下的 presets 文件夹
        if (!this.presetFolder.value || this.presetFolder.value === '') {
            this.presetFolder.value = await join(filePath, 'presets');
        }
        this.refreshStates();
        return;
    }

    async loadDefaultConfig(): Promise<void> {
        const configDir = await globalServiceContainer.fs.getConfigDir();
        const defaultConfigPath = await join(configDir, 'config.json');
        // debug
        console.log(`加载全局配置文件: ${defaultConfigPath}`);
        await this.loadFrom(defaultConfigPath);
    }

    async refreshStates(): Promise<void> {
        console.log(`刷新全局配置状态`);
        // set 一下语言
        const localHelper = new LocalHelper();
        localHelper.setI18nLocale(this.language.value);

        // set 一下主题
        setTheme(this.theme.value);
    }

    async clearAllConfigs(): Promise<void> {
        globalConfigStorage.reset();
    }

    async print(): Promise<void> {
        const configData = await globalConfigStorage.toObject();
        console.log('=== GlobalConfig 数据 ===');
        console.log(JSON.stringify(configData, null, 2));
    }
}

export const GlobalConfig = new GlobalConfigClass();
export const useGlobalConfig = globalConfigStorage.useStorage.bind(globalConfigStorage);
