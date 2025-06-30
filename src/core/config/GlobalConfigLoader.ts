// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { getAppdataDir } from '@/shared/services/FileHelper';
import { join } from '@tauri-apps/api/path';
import { Storage } from '../plugin/Storge';

class GlobalConfigLoaderClass extends Storage {
    public storageName: string = 'global config';
    async loadDefaultConfig(): Promise<void> {
        const appPath = await getAppdataDir();
        const defaultConfigPath = await join(appPath, 'config.json');
        // debug
        console.log(`加载全局配置文件: ${defaultConfigPath}`);
        await this.loadFrom(defaultConfigPath);
    }
}

export const GlobalConfigLoader = new GlobalConfigLoaderClass();
export const useGlobalConfig = GlobalConfigLoader.useStorage.bind(GlobalConfigLoader);