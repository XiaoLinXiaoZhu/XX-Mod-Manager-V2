// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { readFile, writeFile, isFileExists } from '@/shared/services/FileHelper';
import { ensureRef, isRefObject } from '@/shared/utils/RefHelper';
import { Ref, ref, shallowRef } from 'vue';

export type StorageValue<T> = {
    value: T;
    getRef: () => Ref<T>;
};

export class Storage {
    public storageName: string = '';
    protected _data: Record<string, any> = {};
    protected _refCache: Record<string, Ref<any>> = {};
    protected _filePath: string = '';
    // 严格模式，开启后如果没有配置 _filePath 则无法使用 set，但是仍然可以获得配置的引用以及 get 方法
    // 主要用于防止在没有加载配置的情况下使用 set 方法
    public _strictMode: boolean = false;

    constructor(name?: string) {
        if (name) {
            this.storageName = name;
        }
        // console.log(`Storage ${this.storageName} 初始化`);
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
                console.log(`读取到配置文件 ${filePath} 的内容`, rawData);
                await this.mergeData(JSON.parse(rawData));
            } else {
                // 如果文件不存在，则创建一个空的配置文件
                await writeFile(filePath, JSON.stringify({}), true);
                console.log(`文件 ${filePath} 不存在，已创建空配置文件`);
            }
        } catch (e) {
            console.warn('读取配置失败，使用空对象', e);
        }
    }

    async mergeData(data: Record<string, any>, force: boolean = false): Promise<void> {
        // 处理合并数据
        // 因为当程序在 loadFrom 之前 调用了 useStorage.set() 方法
        // 这时候 _data 会被赋值
        // 如果直接加载配置，会导致 _data 中的值被覆盖
        // 所以这里需要先合并数据
        let needSave = false;
        const newData = JSON.parse(JSON.stringify(data));
        const oldData = JSON.parse(JSON.stringify(this._data));
        const ifRefExistThenSave = (key: string, value: any) => {
            if (this._refCache[key] && isRefObject(this._refCache[key])) {
                // 如果存在且是有效的 Ref，直接更新值
                this._refCache[key].value = value;
            } else {
                // 如果不存在或不是有效的 Ref，清理并重新创建
                if (this._refCache[key]) {
                    console.warn(`_refCache[${key}] 不是有效的 Ref，移除并重新创建`);
                    delete this._refCache[key];
                }
                // 重新创建 Ref
                this._refCache[key] = shallowRef(value);
            }
            // return;
            // if (this._refCache[key]) {
            //     this._refCache[key].value = value;
            // }
        }
        // 如果 _data 中没有值，则无需合并
        if (Object.keys(this._data).length === 0) {
            this._data = data;
            // 如果 refCache 中有值，则更新 refCache 中的值
            for (const key in data) {
                ifRefExistThenSave(key, data[key])
            }
            return;
        }

        // debug
        // console.log('合并数据', data, this._data);

        if (force) {
            // 覆盖模式，新旧数据优先保留新数据
            for (const key in data) {
                this._data[key] = data[key];
                ifRefExistThenSave(key, data[key])
            }
        } else {
            // debug
            console.log("no force");
            // 非覆盖模式：
            // 如果不是两个都有值，那么哪个有值选哪个
            for (const key in data) {
                if (Array.isArray(this._data[key]) || Array.isArray(data[key])) {
                    // 安全地获取数组长度，如果不是数组则视为长度 0
                    const currentLength = Array.isArray(this._data[key]) ? this._data[key].length : 0;
                    const newLength = Array.isArray(data[key]) ? data[key].length : 0;

                    if (currentLength <= 0 || newLength <= 0) {
                        // 直接合并
                        this._data[key] = Array.from(new Set([...(Array.isArray(this._data[key]) ? this._data[key] : []), ...(Array.isArray(data[key]) ? data[key] : [])]));
                        ifRefExistThenSave(key, this._data[key])
                    } else {
                        // 合并后去重
                        this._data[key] = Array.from(new Set([...(Array.isArray(this._data[key]) ? this._data[key] : []), ...(Array.isArray(data[key]) ? data[key] : [])]));
                        ifRefExistThenSave(key, this._data[key]);
                    }
                    continue;
                }
                // 常规值处理
                if (this._data[key] === undefined || this._data[key] === null || this._data[key] === '') {
                    // 使用data
                    this._data[key] = data[key];
                    ifRefExistThenSave(key, data[key]);
                    continue;
                }
                if (data[key] === undefined || data[key] === null || data[key] === "") {
                    // 不发生变化，忽略传入的值
                    continue;
                }
                // 两个都有值，认为本地的值更新
            }
        }
        console.log('合并数据', newData, oldData, "->", this._data);

        if (needSave) {
            await this.saveToFile();
        }
    }

    /**
     * @deprecated 请使用 saveToFile() 代替
     */
    async save(): Promise<void> {
        // 已弃用，推荐使用 saveToFile()
        await this.saveToFile();
    }

    async saveToFile(): Promise<void> {
        if (!this._filePath) {
            console.warn(`${this.storageName} 没有文件路径，无法保存配置`, new Error());
            return;
        }

        console.log('保存配置', this._filePath, this._data);
        await writeFile(
            this._filePath,
            JSON.stringify(this._data, null, 2),
            true
        );
        console.log(`配置已保存到 ${this._filePath}`);
        return;
    }


    public async print() {
        console.log("ModInfo", this, "\nData", this._data);
    }

    useStorage<T>(key: string, defaultValue: T): StorageValue<T> {
        let valueRef = this._refCache[key] || undefined;
        if (!valueRef) {
            if (this._data[key] === undefined || this._data[key] === null || this._data[key] === '') {
                // 如果没有值，且默认值不为空，则使用默认值
                if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
                    this._data[key] = defaultValue;
                }
            }
            const storedValue = this._data[key];
            valueRef = ref<T>(storedValue);
            this._refCache[key] = valueRef;
        }

        if (!isRefObject(valueRef)) {
            console.warn(`Storage ${this.storageName} 的 ${key} 不是一个 Ref，可能是数据不一致导致的`);
            // valueRef = ref<T>(valueRef as T);
            // this._refCache[key] = valueRef;
        }

        console.log(`useStorage from ${this.storageName} `, this._refCache, "\n", key, this._data[key]);

        const storage = this;
        return {
            get value() {
                return valueRef!.value;
            },
            set value(newValue: T) {
                if (storage._strictMode && !storage._filePath) {
                    throw new Error(`Storage ${storage.storageName} is in strict mode, cannot set value without file path.`);
                }
                // debug
                console.log(`💔[Debug]:current environment`, valueRef);
                valueRef!.value = newValue;
                storage._data[key] = newValue;
                console.log(`Storage ${storage.storageName} set ${key} to`, newValue);
                storage.saveToFile();
            },
            getRef: () => valueRef!,
        };
    }
}