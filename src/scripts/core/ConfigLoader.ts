import { StorageValue,Storage } from '../lib/Storge';
import { useGlobalConfig } from './GlobalConfigLoader';

class SubConfigLoaderClass extends Storage {
    public storageName: string = 'local config';

    // useConfig 方法,当没有获取的值时，先尝试从 GlobalConfigLoader 中获取,如果它也没有，则返回默认值
    useConfig<T>(key: string, defaultValue: T, useGlobal: boolean = true): StorageValue<T> {
        return useGlobal ? this.useStorage(key, useGlobalConfig(key, "" as any).value || defaultValue) : this.useStorage(key, defaultValue);
    }
}

export const ConfigLoader = new SubConfigLoaderClass();
export const useConfig = ConfigLoader.useConfig.bind(ConfigLoader);