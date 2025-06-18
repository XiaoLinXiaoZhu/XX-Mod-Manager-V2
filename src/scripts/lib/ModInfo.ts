import { basename, dirname } from "@tauri-apps/api/path";
import { join } from "@tauri-apps/api/path";
import { isFileExists, renameDirectory, getDirectoryList, copyFile } from "./FileHelper";
import { Storage, type StorageValue } from "./Storge";
import { EmptyImage, getImage, releaseImage, writeImageFromBase64 } from "./ImageHelper";
import { ref, type Ref } from "vue";

function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash >>> 0; // Unsigned
}

function generateModId(modPath: string): string {
    return simpleHash(modPath).toString(16); // 转为十六进制
}

console.log(generateModId("C:/mods/skyrim_mods/cool_armor_mod/"));

export class ModInfo extends Storage {
    public static ifKeepModNameAsModFolderName: boolean = false; // 是否保持 mod 名称和文件夹名称一致
    static createID(path: string): string {
        // 生成一个随机的 id
        // id 由 mod文件夹路径 + timestamp 组成
        const timestamp = Date.now();
        const hash = simpleHash(path + "-" + timestamp);
        return hash.toString(16);
    }

    public id: StorageValue<string> | undefined;
    public name: StorageValue<string> | undefined;
    public location: StorageValue<string> | undefined;
    public url: StorageValue<string> | undefined; // 模块的下载地址
    public addDate: StorageValue<string> | undefined;

    public newMod = false; // 是否是新的模块

    public static totalCount = 0; // 统计模块数量

    constructor(location: string, canEmpty: boolean = false) {
        super("ModInfo" + ++ModInfo.totalCount);

        // location 是mod的文件夹路径
        if (!location) {
            // 如果没有传入 location，则警告
            if (!canEmpty) {
                console.error("ModInfo: location is not set");
            }
            return;
        }
        join(location, 'mod.json').then(async (path) => {
            this.addDate = this.useStorage("addDate", new Date().toISOString()); // 用于存储添加日期
            if (!await isFileExists(path)) {
                this.newMod = true;
                this.addDate.set(new Date().toISOString()); // 如果是新 mod，则设置添加日期为当前时间
            }
            await this.loadFrom(path);
            this.location = this.useStorage("location", location);
            this.location.set(location); // 确保 location 被设置
            const modFolderName = await basename(location);
            this.storageName = modFolderName;
            this.name = this.useStorage("name", modFolderName);
            this.id = this.useStorage("id", ModInfo.createID(location));
            this.url = this.useStorage("url", ""); // 模块的下载地址，默认为空

            // 如果开启了保持 mod 名称和文件夹名称一致
            // 则需要将 mod 名称和文件夹名称一致
            if (ModInfo.ifKeepModNameAsModFolderName && this.name.value !== modFolderName) {
                this.name.set(modFolderName);
            }
        });
    }
    static async createMod(location: string) {
        // 创建一个新的 mod
        // location 是mod的文件夹路径
        const Mod = new ModInfo("", true);
        if (!location) {
            console.error("ModInfo: location is not set");
        }
        const modMetaDataPath = await join(location, 'mod.json');
        if (!await isFileExists(modMetaDataPath)) {
            Mod.newMod = true;
        }
        //debug
        // console.log("ModInfo.createMod: modMetaDataPath", modMetaDataPath);

        await Mod.loadFrom(modMetaDataPath);
        Mod.location = Mod.useStorage("location", location);
        const modFolderName = await basename(location);
        //debug
        Mod.name = Mod.useStorage("name", modFolderName);
        Mod.id = Mod.useStorage("id", ModInfo.createID(location));
        // 如果开启了保持 mod 名称和文件夹名称一致
        // 则需要将 mod 名称和文件夹名称一致
        if (ModInfo.ifKeepModNameAsModFolderName && Mod.name.value !== modFolderName) {
            Mod.name.set(modFolderName);
        }
        // 如果没有设置 mod 名称，则使用文件夹名称
        // 因为使用了 useStorage，所以这里不需要使用 set

        // 尝试加载图片
        await Mod.reloadPreview();

        return Mod;
    }

    public async setMetaDataFromJson(json: JSON) {
        let metaData: Record<string, any> = {};
        // 处理一下，防止 json 解析失败
        try { metaData = JSON.parse(JSON.stringify(json)); }
        catch (e) {
            console.error(`解析模块元数据失败：${this.location}`, json);
        }

        if (ModInfo.ifKeepModNameAsModFolderName && metaData['name'] !== this.name.value) {
            // 更改文件夹名称
            await this.changeFolderName(metaData['name']);
        }

        this.mergeData(metaData, true);
    }

    private async changeFolderName(newName: string) {
        const newModFolderPath = await join(await dirname(this.location.value), newName);
        if (await isFileExists(newModFolderPath)) {
            console.error(`模块名称重复：${newName} 已存在`);
            return;
        }
        await this.changeLocation(newModFolderPath);
    }
    private async changeLocation(newLocation: string) {
        await renameDirectory(this.location.value, newLocation);
        this._filePath = await join(newLocation, 'mod.json');
        this.location.set(newLocation);
    }
    public async findDefaultImagePath() {
        const defaultImagePath = [
            "preview.png",
            "preview.jpg",
            "preview.jpeg",
            "preview.webp",
            "preview.gif",
            "preview.bmp",
        ]
        for (const imagePath of defaultImagePath) {
            const path = await join(this.location.value, imagePath);
            if (await isFileExists(path)) {
                return imagePath;
            }
        }

        // 如果没有找到默认图片，则寻找目录下的第一个图片
        const files = await getDirectoryList(this.location.value);
        for (const file of files) {
            const ext = file.split('.').pop();
            if (ext && ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
                return await basename(file);
            }
        }

        // 如果没有找到任何图片，则返回空
        return "";
    }


    public async getImagePath() {
        const imagePath = this.useStorage("preview", await this.findDefaultImagePath());
        console.log("ModInfo.getImagePath of " + this.storageName + ": imagePath", imagePath.value);
        if (imagePath.value) {
            return await join(this.location.value, imagePath.value);
        }
        return "";
    }

    private ifGettedPreviewUrl = false;
    private _previewUrlRef: Ref<string> = ref(EmptyImage);
    public get previewUrlRef(): Ref<string> {
        // 懒加载，直到第一次调用 getPreviewUrl 时才加载
        if (!this.ifGettedPreviewUrl) {
            this.ifGettedPreviewUrl = true;
            this.reloadPreview();
        }
        return this._previewUrlRef;
    }
    public async reloadPreview() {
        console.time("ModInfo.reloadPreview" + this.storageName);
        const imagePath = await this.getImagePath();
        if (imagePath) {
            const imageUrl = await getImage(imagePath, true);
            if (imageUrl) {
                this._previewUrlRef.value = imageUrl;
            }
        }
        console.timeEnd("ModInfo.reloadPreview" + this.storageName);
    }
    public async getPreviewUrl(reload: boolean = false): Promise<string> {
        try {
            const imagePath = await this.getImagePath();

            if (!imagePath) {
                console.error(`预览图不存在：${imagePath}`);
                return EmptyImage;
            }

            const imageUrl = await getImage(imagePath, reload);

            if (!imageUrl) {
                console.error(`预览图不存在：${imagePath}`);
                return EmptyImage;
            }

            console.log("获取预览图成功:", imageUrl);
            return imageUrl;
        } catch (error) {
            console.error("获取预览图出错:", error);
            return EmptyImage;
        }
    }

    //- =============== 编辑预览图 ===============
    public async setPreviewByPath(previewPath: string) {
        // debug
        console.log("ModInfo" + this.storageName + ".setPreviewByPath: previewPath", previewPath);
        // 1. 先检查预览图是否存在
        if (!await isFileExists(previewPath)) {
            console.error(`预览图不存在：${previewPath}`);
            return;
        }

        // 2. 如果存在，检查预览图格式
        const previewExt = previewPath.split('.').pop() || "";
        if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(previewExt)) {
            console.error(`预览图格式不支持：${previewPath}`);
            return;
        }

        // 3. 如果格式支持,检查预览图是否和现在的一致
        const currentPreviewPath = await this.getImagePath();
        if (currentPreviewPath === previewPath) {
            console.log(`预览图已经是最新的：${previewPath}`);
            return;
        }

        // 3. 如果格式支持，则将预览图复制到 mod 文件夹下
        const newPreviewFileName = "preview." + previewExt;
        const newPreviewPath = await join(this.location.value, newPreviewFileName);
        await copyFile(previewPath, newPreviewPath);

        // 4. 设置预览图路径，只保存文件名
        this.useStorage("preview", await this.findDefaultImagePath()).set(newPreviewFileName);

        // 5. 重新加载读取预览图
        releaseImage(currentPreviewPath);
        await this.reloadPreview();
        return this.previewUrlRef.value;
    }

    public async setPreviewByBase64(base64: string) {
        // 1. 先检查 base64 是否有效
        if (!base64.startsWith("data:image/")) {
            console.error(`无效的 base64 数据：${base64}`);
            return;
        }

        // 1.1 检查 base64 是否包含数据
        if (!base64.includes(",")) {
            console.error(`无效的 base64 数据：${base64}`);
            return;
        }

        // 1.2 检查 base64 是否包含图片格式
        const ext = base64.split(';')[0].split('/')[1];
        if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
            console.error(`预览图格式不支持：${ext}`);
            return;
        }

        // 2. 创建一个临时文件来保存 base64 数据
        const currentPreviewPath = await this.getImagePath();

        const newPreviewFileName = "preview." + ext;
        const newPreviewPath = await join(this.location.value, newPreviewFileName);

        await writeImageFromBase64(newPreviewPath, base64);

        // 3. 设置预览图路径
        this.useStorage("image", newPreviewFileName);

        // 4. 重新加载读取预览图
        releaseImage(currentPreviewPath);
        await this.reloadPreview();
        return this.previewUrlRef.value;
    }
    

    public async addHotkey(key: string, description: string) {
        if (!key && !description) {
            console.log("ModData.addHotkey: key and description are required");
            return;
        }
        const hotkeys = this.useStorage("hotkeys", [] as { key: string, description: string }[]);
        hotkeys.value.push({ key, description });
    }
    public async removeHotkey(key: string) {
        if (key === undefined) {
            console.log("ModData.removeHotkey: key is required");
            return;
        }
        const hotkeys = this.useStorage("hotkeys", [] as { key: string, description: string }[]);
        const index = hotkeys.value.findIndex((hotkey) => hotkey.key === key);
        if (index !== -1) {
            hotkeys.value.splice(index, 1);
        }
    }
}

