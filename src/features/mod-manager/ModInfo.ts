import { basename, dirname } from "@tauri-apps/api/path";
import { join } from "@tauri-apps/api/path";
import { isFileExists, renameDirectory, getDirectoryList, copyFile } from "@/shared/services/FileHelper";
import { Storage, type StorageValue } from "@/core/plugin/Storge";
import { EmptyImage, getImage, releaseImage, writeImageFromBase64, type ImageUrl, type Base64DataUrl } from "@/shared/services/ImageHelper";
import { computed, ref, type Ref } from "vue";
import { useConfig } from "@/core/config/ConfigLoader";
import { isRefObject } from "@/shared/utils/RefHelper";
import { hash256 } from "@/shared/utils/SimpleHash";

export type UnreactiveModInfo = {
    id: string;
    name: string;
    location: string;
    url: string;
    addDate: string;
    JSONVersion: number;
    category: string;
    tags: string[];
    preview: string;
    hotkeys: { key: string, description: string }[];
    description: string;
    getReactiveModInfo: () => ModInfo;
    getPreviewUrl: (reload?: boolean) => Promise<ImageUrl>;
};

export class ModInfo extends Storage {
    // 严格模式，开启后如果没有配置 _filePath 则无法使用 set，但是仍然可以获得配置的引用以及 get 方法
    // 这样可以保证本地数据不被“污染”
    public _strictMode: boolean = true; // 开启严格模式，确保在未加载配置前无法使用 set 方法
    public static get ifKeepModNameAsModFolderName(): boolean {
        return useConfig("keepModNameAsModFolderName", false).value;
    }

    public id = this.useStorage("id", ""); // 模块的唯一标识符，默认为空
    public name = this.useStorage("modName", ""); // 模块的名称，默认为空
    public location = this.useStorage("location", ""); // 模块的文件夹路径，默认为空
    public url = this.useStorage("url", ""); // 模块的下载地址，默认为空
    public addDate = this.useStorage("addDate", ""); // 用于存储添加日期
    public JSONVersion = this.useStorage("JSONVersion", 1); // 模块的 JSON 版本，默认为 1

    public category = this.useStorage("category", ""); // 模块的分类，默认为空
    public tags = this.useStorage("tags", [] as string[]); // 模块的标签，默认为空数组

    public preview = this.useStorage("preview", ""); // 模块的预览图路径，默认为空
    public hotkeys = this.useStorage("hotkeys", [] as { key: string, description: string }[]); // 模块的快捷键，默认为空数组
    public description = this.useStorage("description", ""); // 模块的描述，默认为空

    public newMod = false; // 是否是新的模块

    public static totalCount = 0; // 统计模块数量

    private constructor() {
        super("ModInfo" + ++ModInfo.totalCount);
    }

    // 只能够使用 createMod 方法来创建 ModInfo 实例
    // 这样可以确保 ModInfo 实例的 location 被正确设置
    public static async createMod(location: string): Promise<ModInfo> {
        const modInfo = new ModInfo();
        const configFile = await join(location, 'mod.json');
        if (!await isFileExists(configFile)) {
            modInfo.newMod = true;
        }
        await modInfo.loadFrom(configFile);
        modInfo.location.set(location); // 确保 location 被设置
        const modFolderName = await basename(location);
        modInfo.storageName = modFolderName;

        if (modInfo.addDate.value === "") {
            // 如果添加日期为空，则设置为当前时间
            modInfo.addDate.set(new Date().toISOString());
        }
        if (modInfo.id.value === "") {
            // 如果 id 为空，则生成一个新的 id
            modInfo.id.set(hash256(location));
        }
        if (modInfo.name.value === "") {
            // 如果名称为空，则设置为文件夹名称
            modInfo.name.set(modFolderName);
        }

        // 如果开启了保持 mod 名称和文件夹名称一致
        // 则需要将 mod 名称和文件夹名称一致
        if (ModInfo.ifKeepModNameAsModFolderName && modInfo.name.value !== modFolderName) {
            modInfo.name.set(modFolderName);
        }

        return modInfo;
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
            if (await this.changeFolderName(metaData['name'])) {
                this.name.set(metaData['name']);
            }
        }

        this.mergeData(metaData, true);
    }
    public convertToUnreactive(): UnreactiveModInfo {
        return {
            id: this.id.value,
            name: this.name.value,
            location: this.location.value,
            url: this.url.value,
            addDate: this.addDate.value,
            JSONVersion: this.JSONVersion.value,
            category: this.category.value,
            tags: this.tags.value,
            preview: this.preview.value,
            hotkeys: this.hotkeys.value,
            description: this.description.value,
            getReactiveModInfo: () => this,
            getPreviewUrl: async (reload: boolean = false) => {
                return await this.getPreviewUrl(reload);
            }
        };
    }

    public async changeFolderName(newName: string): Promise<boolean> {
        const newModFolderPath = await join(await dirname(this.location.value), newName);
        if (await isFileExists(newModFolderPath)) {
            console.error(`模块名称重复：${newName} 已存在`);
            return false;
        }
        await this.changeLocation(newModFolderPath);
        return true;
    }
    private async changeLocation(newLocation: string) {
        await renameDirectory(this.location.value, newLocation);
        this._filePath = await join(newLocation, 'mod.json');
        this.location.set(newLocation);
    }
    public async findDefaultImagePath() {
        if (!this.location.value) {
            console.warn(`ModInfo.findDefaultImagePath: 模块位置未设置`);
            return "";
        }
        const defaultImagePath = [
            "preview.png",
            "preview.jpg",
            "preview.jpeg",
            "preview.webp",
            "preview.gif",
            "preview.bmp",
        ]
        for (const imagePath of defaultImagePath) {
            console.log(`ModInfo.findDefaultImagePath: 尝试寻找默认图片：${this.location.value}/${imagePath}`);
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
        console.warn(`ModInfo.findDefaultImagePath: 没有找到默认图片`);
        return "";
    }


    public async getPreviewPath() {
        const checkImageExists = async (imagePath: string): Promise<boolean> => {
            const fullPath = await join(this.location.value, imagePath);
            return await isFileExists(fullPath);
        }

        const imagePath = this.preview.value;
        if (!imagePath) {
            console.warn(`ModInfo.getPreviewPath: 预览图路径未设置，尝试寻找默认图片`);
            const defaultImagePath = await this.findDefaultImagePath();
            if (defaultImagePath && defaultImagePath !== "") {
                console.log(`ModInfo.getPreviewPath: 找到默认图片：${defaultImagePath}`);
                return await join(this.location.value, defaultImagePath);
            }
            return "";
        }
        // 检查预览图是否存在
        if (await checkImageExists(imagePath)) {
            return await join(this.location.value, imagePath);
        }
        console.warn(`ModInfo.getPreviewPath: 预览图不存在：${imagePath}`);
        // 如果预览图不存在，则尝试寻找默认图片
        const defaultImagePath = await this.findDefaultImagePath();
        if (defaultImagePath && defaultImagePath !== "") {
            console.log(`ModInfo.getPreviewPath: 找到默认图片：${defaultImagePath}`);
            return await join(this.location.value, defaultImagePath);
        }
        return "";
    }

    private ifGettedPreviewUrl = false;
    private readonly _previewUrlRef: Ref<string> = ref(EmptyImage);
    // public get previewUrlRef(): Ref<string> {
    //     // 懒加载，直到第一次调用 getPreviewUrl 时才加载
    //     if (!this.ifGettedPreviewUrl) {
    //         this.ifGettedPreviewUrl = true;
    //         this.reloadPreview();
    //     }
    //     return this._previewUrlRef;
    // }
    public previewUrlRef = computed(() => {
        // 懒加载，直到第一次调用 getPreviewUrl 时才加载
        if (!this.ifGettedPreviewUrl) {
            this.ifGettedPreviewUrl = true;
            this.reloadPreview();
        }
        return this._previewUrlRef;
    });

    public async reloadPreview() {
        console.time("ModInfo.reloadPreview" + this.storageName);
        const imagePath = await this.getPreviewPath();
        if (imagePath) {
            const imageUrl = await getImage(imagePath, true);
            if (imageUrl) {
                if (!isRefObject(this._previewUrlRef)) {
                    console.error(`In Mod ${this.name.value} ModInfo.reloadPreview: _previewUrlRef is not a Ref object.`);
                }
                this._previewUrlRef.value = imageUrl;
            }
        }
        console.timeEnd("ModInfo.reloadPreview" + this.storageName);
    }
    public async getPreviewUrl(reload: boolean = false): Promise<ImageUrl> {
        try {
            const imagePath = await this.getPreviewPath();

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
        const currentPreviewPath = await this.getPreviewPath();
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

    public async setPreviewByBase64(base64: Base64DataUrl) {
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
        const currentPreviewPath = await this.getPreviewPath();

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

