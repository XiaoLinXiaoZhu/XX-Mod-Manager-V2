// 加载 Mod 并导出几个公共的变量
import { ModInfo } from './ModInfo';
import { isDirectoryExists,getDirectoryList } from "./FileHelper";
// import { join } from "@tauri-apps/api/path";
import { useGlobalConfig } from '../core/GlobalConfigLoader';
import { Ref ,ref} from 'vue';

export class ModLoader {
    public static modSourceFoldersRef :Ref<string[]> = ref([]);
    static async addModSourceFolder(folder: string) {
        // check一下是否存在
        if (folder === undefined || folder === null || folder === '') {
            console.warn('ModLoader.addModSourceFolder: folder is empty');
            return;
        }
        if (!await isDirectoryExists(folder)) {
            throw new Error(`ModLoader.addModSourceFolder: folder does not exist: ${folder}`);
        }
        if (!this.modSourceFoldersRef.value.includes(folder))
            this.modSourceFoldersRef.value.push(folder);
    }
    static removeModSourceFolder(folder: string) {
        this.modSourceFoldersRef.value = this.modSourceFoldersRef.value.filter(f => f !== folder);
    }

    // 加载 Mod
    static mods: ModInfo[] = [];
    
    private static afterLoadCallbacks: ((mods: ModInfo[]) => void)[] = [];

    static onAfterLoad(callback: (mods: ModInfo[]) => void) {
        if (typeof callback !== 'function') {
            throw new Error('ModLoader.onAfterLoad: callback must be a function');
        }
        this.afterLoadCallbacks.push(callback);
    }

    private static triggerAfterLoadCallbacks() {
        this.afterLoadCallbacks.forEach(callback => {
            try {
                callback(this.mods);
            } catch (error) {
                console.error('ModLoader.triggerAfterLoadCallbacks: error in callback', error);
            }
        });
    }

    static async loadMods() {
        // 检查一下调用堆栈
        console.trace('ModLoader.loadMods: called from', new Error(),'load from',this.modSourceFoldersRef.value);
        let startTime = Date.now();

        this.mods = [];

        if (this.modSourceFoldersRef.value.length === 0) {
            // throw new Error('ModLoader.loadMods: no mod source folder');
            console.warn('ModLoader.loadMods: no mod source folder');
            return [];
        }

        // 读取所有的 mod 文件夹
        await Promise.all(this.modSourceFoldersRef.value.map(async folder => {
            let mods = await getDirectoryList(folder);
            // 过滤掉非目录的文件
            await Promise.all(mods.map(async mod => {
                // debug
                // console.log('ModLoader.loadMods: mod', mod);
                if (await isDirectoryExists(mod)) {
                    // let modInfo = new ModInfo(mod);
                    // 这里需要使用异步加载
                    let modInfo = await ModInfo.createMod(mod);
                    this.mods.push(modInfo);
                }
            }));
        })).then(() => {
            console.log(`ModLoader.loadMods: loaded ${this.mods.length} mods in ${Date.now() - startTime}ms`);
        });

        // 触发回调函数
        this.triggerAfterLoadCallbacks();
        // 返回 mod 列表

        return this.mods;
    }

    static async loadMod(modPath: string) {
        if (modPath === undefined || modPath === null || modPath === '') {
            throw new Error('ModLoader.loadMod: modPath is empty');
        }
        if (!await isDirectoryExists(modPath)) {
            throw new Error(`ModLoader.loadMod: modPath does not exist: ${modPath}`);
        }
        let modInfo = new ModInfo(modPath);
        this.mods.push(modInfo);

        return modInfo;
    }

    public static getModByID(id: string): ModInfo | undefined {
        return this.mods.find(mod => mod.id.value === id);
    }
}

// 测试一下