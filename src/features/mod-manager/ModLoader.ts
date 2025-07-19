// 加载 Mod 并导出几个公共的变量
import { ModInfo } from './ModInfo';
import type {ModConfig} from './ModMetadata';
import { isDirectoryExists, getDirectoryList } from "@/shared/services/FileHelper";
// import { join } from "@tauri-apps/api/path";
import { RebindableRef } from '@/deprecation/RebindableRef';
import { $t_snack } from '@/shared/composables/use-snack';
import { computed, ref } from 'vue';
import { calculateIndexStructure } from '@/shared/utils/caculate-index';

export class ModLoader {
    public static modSourceFoldersRef: RebindableRef<string[]> = new RebindableRef<string[]>([]);
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
    private static _mods: ModInfo[] = [];
    static modsRef = ref<ModInfo[]>([]);

    static get mods(): ModInfo[] {
        return this._mods;
    }

    static set mods(value: ModInfo[]) {
        this._mods = value;
        this.modsRef.value = value;
    }

    // 计算分类索引结构
    static categoryIndexStructure = computed(() => {
        // 计算索引结构
        // 收集所有的分类
        const allCategories: string[] = [];
        ModLoader.modsRef.value.forEach(mod => {
            if (mod.metadata.category && mod.metadata.category.getRef().value) {
                allCategories.push(mod.metadata.category.getRef().value);
            }
        });

        console.log('ModLoader.categoryIndexStructure: allCategories', allCategories);

        // 计算索引结构
        return calculateIndexStructure(allCategories);
    });

    // 计算所有的tag
    static allTags = computed(() => {
        // 收集所有的标签
        const allTags: string[] = [];
        ModLoader.modsRef.value.forEach(mod => {
            if (mod.metadata.tags && mod.metadata.tags.getRef().value) {
                allTags.push(...mod.metadata.tags.getRef().value);
            }
        });

        console.log('ModLoader.tagIndexStructure: allTags', allTags);

        // 计算索引结构
        return calculateIndexStructure(allTags);
    });

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
        console.trace('ModLoader.loadMods: called from', new Error(), 'load from', this.modSourceFoldersRef.value);
        let startTime = Date.now();

        this.mods = [];

        if (this.modSourceFoldersRef.value.length === 0) {
            console.warn('ModLoader.loadMods: no mod source folder');
            $t_snack('modLoader.noModSourceFolder', 'warning');
            return [];
        }

        // 默认配置
        const defaultConfig: ModConfig = {
            keepModNameAsModFolderName: true
        };

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
                    let modInfo = await ModInfo.createMod(mod, defaultConfig);
                    this._mods.push(modInfo);
                }
            }));
        })).then(() => {
            console.log(`ModLoader.loadMods: loaded ${this.mods.length} mods in ${Date.now() - startTime}ms`);
            // 同步到响应式引用
            this.modsRef.value = [...this._mods];
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
        // let modInfo = new ModInfo(modPath);
        const defaultConfig: ModConfig = {
            keepModNameAsModFolderName: true
        };
        let modInfo = await ModInfo.createMod(modPath, defaultConfig);
        this._mods.push(modInfo);
        this.modsRef.value = [...this._mods];

        return modInfo;
    }

    public static getModByID(id: string): ModInfo | undefined {
        return this.mods.find(mod => mod.metadata.id.value === id);
    }
}

// 测试一下