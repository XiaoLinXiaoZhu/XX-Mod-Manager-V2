// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { getAppdataDir } from '@/shared/services/FileHelper';
import { join } from '@tauri-apps/api/path';
import { Storage } from '../storage/Storage';
import { Theme } from '@/assets/styles/styleController';
import { I18nLocale } from '@/shared/types/local';
import { LocalHelper } from '@/features/i18n/LocalHelperClass';

class GlobalConfigLoaderClass extends Storage {
    constructor() {
        super('global config');
        this._strictMode = true; // 开启严格模式，确保在未加载配置前无法使用 set 方法
        console.log(`GlobalConfigLoaderClass 初始化`);
    }
    async loadDefaultConfig(): Promise<void> {
        const appPath = await getAppdataDir();
        const defaultConfigPath = await join(appPath, 'config.json');
        // debug
        console.log(`加载全局配置文件: ${defaultConfigPath}`);
        await this.loadFrom(defaultConfigPath);

        const localHelper = new LocalHelper();
        localHelper.setI18nLocale(this.language.value);
    }


    //- ================= 配置项，方便其他地方直接使用 ============= -//
    language = this.useStorage('language', 'zh-CN' as I18nLocale);
    theme = this.useStorage('theme', 'dark' as Theme);
}

export const GlobalConfigLoader = new GlobalConfigLoaderClass();
export const useGlobalConfig = GlobalConfigLoader.useStorage.bind(GlobalConfigLoader);