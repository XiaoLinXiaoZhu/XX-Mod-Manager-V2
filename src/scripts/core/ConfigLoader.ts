// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { getAppdataDir } from '@/scripts/lib/FileHelper';
import { join } from '@tauri-apps/api/path';
import { Storage } from '../lib/Storge';

class ConfigLoaderClass extends Storage {
    public storageName: string = 'config';
    async loadDefaultConfig(): Promise<void> {
        const appPath = await getAppdataDir();
        const defaultConfigPath = await join(appPath, 'config.json');
        await this.loadFrom(defaultConfigPath);
    }
}

export const ConfigLoader = new ConfigLoaderClass();
export const useConfig = ConfigLoader.useStorage.bind(ConfigLoader);