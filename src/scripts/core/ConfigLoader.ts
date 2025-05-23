// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { readFile, writeFile, isFileExists, getAppdataDir } from '@/scripts/lib/FileHelper';
import { Ref, ref } from 'vue';
import { join } from '@tauri-apps/api/path';

type StorageValue<T> = {
  value: T;
  set: (newValue: T) => Promise<void>;
  getRef: () => Ref<T>;
};

class ConfigLoaderClass {
    private _data: Record<string, any> = {};
    private _filePath: string = '';

    async loadDefaultConfig(): Promise<void> {
        const appPath = await getAppdataDir();
        const defaultConfigPath = await join(appPath, 'config.json');
        await this.loadFrom(defaultConfigPath);
    }

    async loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取配置`);
        // 如果之前的 filePath 存在，且不等于当前的 filePath
        // 则删除之前读取的配置
        if (this._filePath && this._filePath !== filePath) {
            // 删除之前的配置
            // debug
            console.log(`删除之前的配置 ${this._filePath}`);
            this._data = {};
        }
        this._filePath = filePath;
        try {
            const fileExists = await isFileExists(filePath);
            if (fileExists) {
                const rawData = await readFile(filePath, true);
                // debug
                console.log(`从 ${filePath} 读取配置`, rawData);
                await this.mergeData(JSON.parse(rawData));
            } else {
                // 如果文件不存在，则创建一个空的配置文件
                await writeFile(filePath, JSON.stringify({}), true);
                console.log(`文件 ${filePath} 不存在，已创建空配置文件`);
            }
        } catch (e) {
            console.warn('读取配置失败，使用空对象');
        }
    }

    async mergeData(data: Record<string, any>): Promise<void> {
        // 处理合并数据
        // 因为当程序在 loadFrom 之前 调用了 useStorage.set() 方法
        // 这时候 _data 会被赋值
        // 如果直接加载配置，会导致 _data 中的值被覆盖
            // 所以这里需要先合并数据
            // 1. 如果 _data 中有值，则不论是否传入了值，都使用 _data 中的值
            // 2. 如果 _data 中没有值，则使用传入的值
        // debug
        console.log('合并数据', data, this._data);
        for (const key in data) {
            if (this._data[key] === undefined) {
                this._data[key] = data[key];
            }
        }
        // debug
        console.log('合并后的数据', this._data);
        await this.save();
    }

    async save(): Promise<void> {
        // debug
        console.log('保存配置', this._filePath, this._data);
        await writeFile(
            this._filePath,
            JSON.stringify(this._data, null, 2),
            true
        );
    }

    useStorage<T>(key: string, defaultValue: T): StorageValue<T> {
        const storedValue = this._data[key] !== undefined ? this._data[key] : defaultValue;
        const value = ref<T>(storedValue);

        const set = async (newValue: T) => {
            value.value = newValue;
            this._data[key] = newValue;
            await this.save();
        };

        const getRef = () => {
            return value as Ref<T>;
        };

        return {
            value: value.value,
            set,
            getRef
        };
    }
}

export const ConfigLoader = new ConfigLoaderClass();
export const useStorage = ConfigLoader.useStorage.bind(ConfigLoader);