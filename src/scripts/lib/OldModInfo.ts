import { basename, dirname } from "@tauri-apps/api/path";
import { join } from "@tauri-apps/api/path";
import { readFile, writeFile, isFileExists, renameDirectory } from "./FileHelper";
import crypto from "crypto";

export type ModMetaDataItem<T = any> = {
    key: string;
    value: T;
}

export class ModMetaData {
    public items: ModMetaDataItem[] = [];

    public add(key: string, value: any) {
        this.items.push({ key, value });
    }

    public set<T>(key: string, value: T) {
        const item = this.items.find(item => item.key === key);
        if (item) {
            item.value = value;
        } else {
            this.add(key, value);
        }
    }

    public get<T>(key: string): T | null {
        const item = this.items.find(item => item.key === key);
        if (item) {
            return item.value as T;
        }
        return null;
    }

    public copy(): ModMetaData {
        // 深拷贝
        const metaData = new ModMetaData();
        for (const item of this.items) {
            metaData.add(item.key, item.value);
        }
        return metaData;
    }
}

export class ModInfo {
    public static ifKeepModNameAsModFolderName: boolean = false; // 是否保持 mod 名称和文件夹名称一致
    public static modDataTemplate: ModMetaData = new ModMetaData();
    public static setModDataTemplate(template: ModMetaData) {
        ModInfo.modDataTemplate = template;
    }

    public id: string;
    public location: string;
    public name: string;
    public newMod = false; // 是否是新的模块

    // 其他的数据为非核心数据，可以通过模板进行定义
    public metaData: ModMetaData = new ModMetaData();
    public async getMetaDataPath() {
        return await join(this.location, 'mod.json');
    }

    constructor(location: string) {
        this.location = location;
        this.id = '';
        this.name = "";
        this.metaData = ModInfo.modDataTemplate.copy();

        basename(location).then((name) => {
            this.name = name;
            this.init(location);
        });
    }

    private async init(location: string) {
        let needSave = false;
        // 读取模块元数据
        const metaDataPath = await join(location, 'mod.json');
        if (await isFileExists(metaDataPath)) {
            const rawData = await readFile(metaDataPath, true);
            let metaData: Record<string, any> = {};
            try {
                metaData = JSON.parse(rawData);
            } catch (e) {
                console.error(`解析模块元数据失败：${metaDataPath}`, rawData);
            }

            // id 为必须的字段，如果没有则生成一个
            this.id = metaData['id'] || '';
            if (!this.id) {
                this.generateID();
                needSave = true;
            }

            // 对于modName，如果开启了保持一致，则需要保持一致，否则如果为空，则使用文件夹名称
            // const modFolderName = path.basename(location);
            const modFolderName = await basename(location);
            if (ModInfo.ifKeepModNameAsModFolderName && this.name !== modFolderName) {
                this.name = modFolderName;
                needSave = true;
            }
            if (!ModInfo.ifKeepModNameAsModFolderName) {
                this.name = metaData['modName'] || this.name;
            }

            // 读取模板中定义的数据
            for (const item of ModInfo.modDataTemplate.items) {
                const value = metaData[item.key];
                if (value !== undefined) {
                    this.metaData.set(item.key, value);
                }
                else {
                    // 如果没有这个字段，则需要保存
                    needSave = true;
                }
            }
        }
        else {
            this.newMod = true;
            // 生成一个 id
            this.generateID();

            console.warn(`未找到模块元数据文件：${metaDataPath}`);
            needSave = true;
        }

        // 将模块元数据写入文件
        if (needSave) {
            this.saveMetaData();
        }
    }

    generateID() {
        // 生成一个随机的 id
        // id 由 mod文件夹内的文件的 hash 值生成

        // 生成一个 hash 值
        const hash = crypto.createHash('md5');
        hash.update(this.location);
        this.id = hash.digest('hex');
        return this.id;
    }

    public async setMetaDataFromJson(json: JSON) {
        // 将 json 字符串转化为对象
        let metaData: Record<string, any> = {};
        // 处理一下，防止 json 解析失败
        // 这里使用了深拷贝，防止引用问题
        try {
            metaData = JSON.parse(JSON.stringify(json));
        } catch (e) {
            console.error(`解析模块元数据失败：${this.location}`, json);
        }

        //debug
        console.log(`设置模块元数据：${this.location}`, metaData);

        // id 为必须的字段，如果没有则生成一个
        this.id = metaData['id'] || '';
        if (!this.id) {
            metaData["id"] = this.generateID();
        }

        // 保存modName 和 location
        // 如果开启了保持mod名称和文件夹名称，那么当更改 modName 时，文件夹名称需要随着更改
        if (ModInfo.ifKeepModNameAsModFolderName && metaData['name'] !== this.name) {
            // 更改文件夹名称
            // 确认有无重复的文件夹名称
            const newModFolderName = metaData['name'];
            // debug
            console.log(`更改模块名称：${this.name} -> ${newModFolderName} in folder ${this.location}`);
            // const newModFolderPath = path.join(path.dirname(this.location), newModFolderName);
            const newModFolderPath = await join(await dirname(this.location), newModFolderName);
            if (await isFileExists(newModFolderPath)) {
                console.error(`模块名称重复：${newModFolderName} 已存在`);
                return;
            }
            // 重命名文件夹
            // fs.renameSync(this.location, newModFolderPath);
            await renameDirectory(this.location, newModFolderPath)
            // 更新文件夹名称
            this.name = newModFolderName;
            // 更新文件路径
            this.location = newModFolderPath;
            // id保持不变
        }
        if (!ModInfo.ifKeepModNameAsModFolderName) {
            // 两个格式不一样，一个是 name，而metadata 是 modName
            this.name = metaData['name'] || this.name;
            this.location = metaData['location'] || this.location;
        }

        // 读取模板中定义的数据
        for (const item of ModInfo.modDataTemplate.items) {
            const value = metaData[item.key];
            if (value !== undefined) {
                this.metaData.set(item.key, value);
            }
        }

        // debug
        console.log(`模块元数据：${this.location} from`, json, this);
    }

    public async saveMetaData() {
        // 保存模块元数据到文件
        const metaDataPath = await this.getMetaDataPath();
        const metaData: Record<string, any> = {};
        for (const item of this.metaData.items) {
            metaData[item.key] = item.value;
        }
        // 添加上 id 和 location 以及 modName
        metaData['id'] = this.id;
        metaData['location'] = this.location;
        metaData['modName'] = this.name;
        await writeFile(metaDataPath, JSON.stringify(metaData, null, 4), true);
        console.log(`保存模块元数据成功：${metaDataPath}`);
    }

    // public rename(newName: string, callback: (err: any) => void) {
    //     // 重命名mod
    //     if (!fs.existsSync(this.location)) {
    //         console.error(`模块不存在：${this.location}`);
    //         callback(new Error(`模块不存在：${this.location}`));
    //         return false;
    //     }
    //     // 确认有无重复的文件夹名称
    //     const newModFolderName = newName;
    //     const newModFolderPath = path.join(path.dirname(this.location), newModFolderName);
    //     if (fs.existsSync(newModFolderPath)) {
    //         console.error(`模块名称重复：${newModFolderName} 已存在`);
    //         callback(new Error(`模块名称重复：${newModFolderName} 已存在`));
    //         return false;
    //     }
    //     // 重命名文件夹
    //     try {
    //         fs.renameSync(this.location, newModFolderPath);
    //     } catch (err) {
    //         console.error(`重命名模块失败：${this.location} -> ${newModFolderPath}`, err);
    //         callback(err);
    //         return false;
    //     }
    //     // 更新文件夹名称
    //     if (ModInfo.ifKeepModNameAsModFolderName) {
    //         this.name = newModFolderName;
    //     }
    //     // 更新文件路径
    //     this.location = newModFolderPath;
    //     return true;
    // }
    public async rename(newName: string, onError: (err: any) => void) {
        // 重命名mod
        if (!await isFileExists(this.location)) {
            console.error(`模块不存在：${this.location}`);
            onError(new Error(`模块不存在：${this.location}`));
            return false;
        }
        // 确认有无重复的文件夹名称
        const newModFolderName = newName;
        const newModFolderPath = await join(await dirname(this.location), newModFolderName);
        if (await isFileExists(newModFolderPath)) {
            console.error(`模块名称重复：${newModFolderName} 已存在`);
            onError(new Error(`模块名称重复：${newModFolderName} 已存在`));
            return false;
        }
        // 重命名文件夹
        try {
            await renameDirectory(this.location, newModFolderPath);
        } catch (err) {
            console.error(`重命名模块失败：${this.location} -> ${newModFolderPath}`, err);
            onError(err);
            return false;
        }
        // 更新文件夹名称
        if (ModInfo.ifKeepModNameAsModFolderName) {
            this.name = newModFolderName;
        }
        // 更新文件路径
        this.location = newModFolderPath;
        return true;
    }
}

//测试代码
const modDataTemplate = new ModMetaData();
modDataTemplate.add('author', 'Unknown');
modDataTemplate.add('character', 'Unknown');
modDataTemplate.add('url', 'Unknown');
modDataTemplate.add('tags', []);
modDataTemplate.add('category', 'Unknown');
modDataTemplate.add('description', 'no description');
modDataTemplate.add('hotkeys', []);
modDataTemplate.add('preview', 'Unknown');
ModInfo.setModDataTemplate(modDataTemplate);

// const modInfo = new ModInfo("E:\\1myProgramFile\\electron Files\\TestMod");
// console.log(modInfo.id);
// console.log(modInfo.metaData.get<string>('author'));
// console.log(modInfo.metaData.get<string>('character'));
// console.log(modInfo.metaData.get<string>('category'));
// console.log(modInfo.metaData.get<string>('tags'));
// console.log(modInfo.metaData.get<string>('hotkeys'));
// console.log(modInfo.metaData.get<string>('preview'));