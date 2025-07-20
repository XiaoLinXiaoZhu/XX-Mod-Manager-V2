import { isFileExists, readFile, writeFile } from "@/shared/services/FileHelper";
import { Ref, shallowRef } from "vue";
import {CachedObject} from "@/shared/utils/CachedObject";
import { isRefObject } from "@/shared/utils/RefHelper";
import { Debouncer } from "@/shared/utils/Debouncer";

export class Storage {
    public _strictMode: boolean = true; // 是否开启严格模式
    public get canSet(): boolean {
        const canSet = !this._strictMode || (!!this._filePath && this._filePath !== '');
        if (!canSet) {
            console.warn(`Storage ${this.storageName} 处于严格模式，且未设置文件路径，无法使用 set 方法`);
        }
        return canSet;
    }
    public storageName: string = '';
    protected _filePath: string = '';
    protected _storageValues: Record<string, StorageValue<any>> = {};
    private _saveDebouncer: Debouncer; // 防抖器

    constructor(name?: string) {
        if (name) {
            this.storageName = name;
        }
        // 初始化防抖器
        this._saveDebouncer = new Debouncer(() => this._doSaveToFile(), 300);
    }

    public mergeData(data: Record<string, any>, force: boolean = true): void {
        // debug
        const oldData = this.toObject();
        if (force) {
            this._mergeDataForce(data);
        } else {
            this._mergeData(data);
        }
        const newData = this.toObject();
        console.log(`Storage ${this.storageName} 数据合并前后对比:`,
            "\n旧数据:", oldData,
            "\n传入数据:", data,
            "\n合并后数据:", newData,
            );

    }

    private _mergeData(data: Record<string, any>): void {
        // 非强制合并，保留已有的值，只合并新值，或者空值
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                if (value === undefined || value === null || value === '' || 
                    (Array.isArray(value) && value.length === 0) || 
                    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
                    continue; // 跳过空值和空数组/空对象
                }
                if (!this._storageValues[key]) {
                    this._storageValues[key] = new StorageValue(key, value, this);
                } else {
                    // 如果已经存在，当前值为空，则更新为新值
                    const currentValue = this._storageValues[key].value;
                    if (currentValue === undefined || currentValue === null || currentValue === '' || 
                        (Array.isArray(currentValue) && currentValue.length === 0) || 
                        (typeof currentValue === 'object' && !Array.isArray(currentValue) && Object.keys(currentValue).length === 0)) {
                        this._storageValues[key].value = value;
                    }
                }
            }
        }
    }

    private _mergeDataForce(data: Record<string, any>): void {
        // 强制合并，覆盖已有的值
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const value = data[key];
                if (value === undefined || value === null || value === '' || 
                    (Array.isArray(value) && value.length === 0) || 
                    (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
                    continue; // 跳过空值和空数组/空对象
                }
                if (!this._storageValues[key]) {
                    this._storageValues[key] = new StorageValue(key, value, this);
                } else {
                    // 如果已经存在，直接更新值
                    this._storageValues[key].value = value;
                }
            }
        }
    }

    public async loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取配置`,new Error());
        this._filePath = filePath;
        try {
            const fileExists = await isFileExists(filePath);
            if (fileExists) {
                const rawData = await readFile(filePath, true);
                console.log(`读取到配置文件 ${filePath} 的内容`, rawData);
                await this.mergeData(JSON.parse(rawData));
            } else {
                console.log(`文件 ${filePath} 不存在，已创建空配置文件`);
                await writeFile(filePath, JSON.stringify({}), true);
            }
        } catch (e) {
            console.warn('读取配置失败，使用空对象', e);
        }
    }

    public useStorage<T>(key: string, defaultValue: T): StorageValue<T> {
        if (!this._storageValues[key]) {
            this._storageValues[key] = new StorageValue(key, defaultValue, this);
        }
        return this._storageValues[key] as StorageValue<T>;
    }

    private _cache:CachedObject = new CachedObject(this.caculateCache.bind(this));
    private caculateCache(): Record<string, any> {
        const cache: Record<string, any> = {};
        for (const key in this._storageValues) {
            if (this._storageValues.hasOwnProperty(key)) {
                cache[key] = this._storageValues[key].value;
            }
        }
        return cache;
    }
    public updateValue<T>(key: string, value: T): void {
        // 更新缓存中的值
        this._cache.setCache(key, value);

        this.saveToFile();
    }

    public async saveToFile(immediate: boolean = true): Promise<void> {
        if (!this._filePath) {
            console.warn('没有设置文件路径，无法保存数据');
            return;
        }

        // 如果需要立即保存，清除防抖定时器并直接保存
        if (immediate) {
            return this._saveDebouncer.invokeImmediate();
        }

        // 使用防抖机制
        this._saveDebouncer.invoke();
    }

    private async _doSaveToFile(): Promise<void> {
        try {
            // 使用缓存数据保存
            await writeFile(this._filePath, JSON.stringify(this._cache.getAllCache(), null, 2), true);
            console.log(`数据已保存到 ${this._filePath}`);
        } catch (e) {
            console.error('保存数据失败', e);
        }
    }

    /**
     * 设置防抖延迟时间
     * @param delay 延迟时间（毫秒）
     */
    public setSaveDebounceDelay(delay: number): void {
        this._saveDebouncer.setDelay(delay);
    }

    /**
     * 清理防抖定时器，通常在组件销毁时调用
     */
    public dispose(): void {
        this._saveDebouncer.dispose();
    }

    public toObject(): Record<string, any> {
        // 返回存储的对象，处理为普通对象
        const obj: Record<string, any> = {};
        for (const key in this._storageValues) {
            if (this._storageValues.hasOwnProperty(key)) {
                obj[key] = this._storageValues[key].value;
            }
        }
        return obj;
    }

    public print(): void {
        // 打印当前存储的数据，处理为 object
        const dataToPrint: Record<string, any> = this.toObject();
        console.log(`Storage ${this.storageName} 数据:`, JSON.stringify(dataToPrint, null, 2));
    }
}

export class StorageValue<T> {
    // 告诉 Vue 不要对这个对象进行响应式处理
    public __v_skip = true;

    private parentStorage: Storage;
    private _key: string;
    private _refImpl: Ref<T>;
    
    
    
    get refImpl(): Ref<T> {
        if (!isRefObject(this._refImpl)) {
            console.error(`[ERROR] StorageValue.refImpl 不是 Ref 对象!`, {
                "key": this._key,
                "_refImpl": this._refImpl,
                "_refImpl类型": typeof this._refImpl
            });
            // 尝试修复：重新创建 Ref
            // this._refImpl = shallowRef(this._refImpl as any);
        }
        return this._refImpl;
    }

    get value(): T {
        return this._refImpl.value;
    }

    set value(newValue: T) {
        if (!this.parentStorage.canSet) {
            return;
        }
        this._refImpl.value = newValue;
        // update the parent storage if it exists
        this.parentStorage.updateValue(this._key, newValue);
    }

    constructor(key: string, value: T, parentStorage: Storage) {
        // use shallowRef to avoid deep reactivity issues
        this._refImpl = shallowRef(value);
        this.parentStorage = parentStorage;
        this._key = key;
    }
};
