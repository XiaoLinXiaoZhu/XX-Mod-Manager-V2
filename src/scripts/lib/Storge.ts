// 之前的configloader.ts 有一些地方非常麻烦这里想要优化一下：
import { readFile, writeFile, isFileExists } from '@/scripts/lib/FileHelper';
import { Ref, ref } from 'vue';

export type StorageValue<T> = {
    value: T;
    set: (newValue: T) => Promise<void>;
    getRef: () => Ref<T>;
};

export class Storage {
    public storageName: string = '';
    protected _data: Record<string, any> = {};
    protected _refCache: Record<string, Ref<any>> = {};
    protected _filePath: string = '';

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
                // const copyData = JSON.parse(JSON.stringify(this._data));
                // console.log(`从 ${filePath} 读取配置`, rawData,JSON.parse(rawData));
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

    async mergeData(data: Record<string, any>, force: boolean = false): Promise<void> {
        // 处理合并数据
        // 因为当程序在 loadFrom 之前 调用了 useStorage.set() 方法
        // 这时候 _data 会被赋值
        // 如果直接加载配置，会导致 _data 中的值被覆盖
        // 所以这里需要先合并数据
        let needSave = false;
        const newData = JSON.parse(JSON.stringify(data));
        const oldData = JSON.parse(JSON.stringify(this._data));
        const ifRefExistThenSave = (key:string,value:any) =>{
            if (this._refCache[key]) {
                this._refCache[key].value = value;
            }
        }
        // 如果 _data 中没有值，则无需合并
        if (Object.keys(this._data).length === 0) {
            this._data = data;
            // 如果 refCache 中有值，则更新 refCache 中的值
            for (const key in data) {
                ifRefExistThenSave(key,data[key])
            }
            return;
        }

        // debug
        // console.log('合并数据', data, this._data);

        if (force) {
            // 覆盖模式，新旧数据优先保留新数据
            for (const key in data) {
                this._data[key] = data[key];
                ifRefExistThenSave(key,data[key])
            }
        } else {
            // debug
            console.log("no force");
            // 非覆盖模式：
            // 如果不是两个都有值，那么哪个有值选哪个
            for (const key in data) {
                if (Array.isArray(this._data[key]) || Array.isArray(data[key])) {
                    if (this._data[key].length < 0 || data[key].length < 0) {
                        // 直接合并
                        this._data[key] = Array.from(new Set([...(Array.isArray(this._data[key]) ? this._data[key] : []), ...(Array.isArray(data[key]) ? data[key] : [])]));
                        ifRefExistThenSave(key,this._data[key])
                    } else {
                        // 合并后去重
                        this._data[key] = Array.from(new Set([...(Array.isArray(this._data[key]) ? this._data[key] : []), ...(Array.isArray(data[key]) ? data[key] : [])]));
                        ifRefExistThenSave(key, this._data[key]);
                    }
                    continue;
                }
                // 常规值处理
                if (this._data[key] === undefined || this._data[key] === null || this._data[key] === ''){
                    // 使用data
                    this._data[key] = data[key];
                    ifRefExistThenSave(key,data[key]);
                    continue;
                }
                if (data[key] === undefined || data[key] === null || data[key] === ""){
                    // 不发生变化，忽略传入的值
                    continue;
                }
                // 两个都有值，认为本地的值更新
            }
        }
        console.log('合并数据', newData, oldData, "->", this._data);

        if (needSave) {
            await this.save();
        }
    }

    async save(): Promise<void> {
        // debug
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
                    this.save();
                }
            }
            const storedValue = this._data[key];
            valueRef = ref<T>(storedValue);
            this._refCache[key] = valueRef;
        }
        console.log(`useStorage from ${this.storageName} \n`, key, this._data[key]);

        const storage = this;
        return {
            get value() {
                return valueRef!.value;
            },
            set value(newValue: T) {
                valueRef!.value = newValue;
                storage._data[key] = newValue;
                storage.save();
            },
            set: async (newValue: T) => {
                valueRef!.value = newValue;
                this._data[key] = newValue;
                await this.save();
            },
            getRef: () => valueRef!,
        };
    }
}