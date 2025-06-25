import { StorageValue,Storage } from '../lib/Storge';
import { useGlobalConfig } from './GlobalConfigLoader';

class SubConfigLoaderClass extends Storage {

    constructor() {
        super('local config');
        this._strictMode = true; // 开启严格模式，确保在未加载配置前无法使用 set 方法
        // debug
        console.log(`SubConfigLoaderClass 初始化`);
    }

    // useConfig 方法,当没有获取的值时，先尝试从 GlobalConfigLoader 中获取,如果它也没有，则返回默认值
    useConfig<T>(key: string, defaultValue: T, useGlobal: boolean = false): StorageValue<T> {
        return useGlobal ? this.useStorage(key, useGlobalConfig(key, "" as any).value || defaultValue) : this.useStorage(key, defaultValue);
    }

    loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取本地配置`);
        return super.loadFrom(filePath);
    }

    async clearAllConfigs(): Promise<void> {
        console.log(`清除所有本地配置`);
        this._data = {};
        this._refCache = {};
        await this.saveToFile(); // 保存到文件
        return;
    }
}

export const ConfigLoader = new SubConfigLoaderClass();
export const useConfig = ConfigLoader.useConfig.bind(ConfigLoader);