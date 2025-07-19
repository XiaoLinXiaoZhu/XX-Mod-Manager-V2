import { Storage } from "@/core/storage/Storage";
import { getDirectoryList, getFullPath, isFileExists } from "@/shared/services/FileHelper";
import { hash256 } from "@/shared/utils/SimpleHash";
import { isAbsolute } from "@tauri-apps/api/path";

// 这个用来代替之前的直接读取文件夹的方式，改用PresetHelper来管理

// 预设文件夹下有n个文件，每个文件都是一个preset
// 用preset文件的名字作为preset展示的名字，实际上我们还是用id来标识preset
// preset文件的内容是一个json，包含了preset的所有信息
/* preset的结构
{
    "id": "presetId",
    "name": "presetName",
    "location": "presetLocation",
    "description": "presetDescription",
    "modIds": ["modId1", "modId2", ...],
        // 实验性功能的配置
    "useExperimentalFeature": true,
    "experimentalFeatureConfig": {
        // 继承其他preset的id
        "inheritPresets": ["presetId1", "presetId2", ...],
    }
}
*/


class ModPreset extends Storage {
    public _strictMode = true; // 严格模式，开启后如果没有配置 _filePath 则无法使用 set，但是仍然可以获得配置的引用以及 get 方法

    public id = this.useStorage("id", "");
    public name = this.useStorage("name", "");
    public location = this.useStorage("location", "");
    public description = this.useStorage("description", "");
    public modIds = this.useStorage("modIds", [] as string[]);
    public useExperimentalFeature = this.useStorage("useExperimentalFeature", false);
    public experimentalFeatureConfig = this.useStorage("experimentalFeatureConfig", {
        inheritPresets: [] as string[],
    });

    public static totalCount = 0; // 统计模块数量
    private constructor() {
        super("ModPreset" + ModPreset.totalCount);
        ModPreset.totalCount++;
    }
    public static async loadFrom(filePath: string): Promise<ModPreset> {
        const preset = new ModPreset();
        await preset.loadFrom(filePath);
        // 初始化处理
        if (!preset.id.value || preset.id.value === "") {
            preset.id.value = hash256(filePath);
        }
        // location 设置为 filePath，且确保是绝对路径
        try {
            if (await isAbsolute(preset.location.value)) {
                preset.location.value = filePath;
            } else {
                preset.location.value = await getFullPath(filePath);
            }
        } catch (error) {
            console.error("Error resolving file path:", error);
            preset.location.value = filePath; // 如果出错，直接使用原始路径
        }

        return preset;
    }
    public getModIds(): string[] {
        if (!this.useExperimentalFeature) {
            return this.modIds.value;
        }

        console.log(`${this.name} is using experimental feature, get mod ids from inherited presets`);

        // 首先收集所有继承的预设
        let inheritedPresets: ModPreset[] = [];
        // 可能存在链式继承，所以需要递归查找
        const collectInheritedPresets = (preset: ModPreset) => {
            if (preset.useExperimentalFeature.value && preset.experimentalFeatureConfig.value.inheritPresets.length > 0) {
                preset.experimentalFeatureConfig.value.inheritPresets.forEach((id: string) => {
                    const inheritedPreset = modPresetLoader.modPresets.find(p => p.id.value === id);
                    if (inheritedPreset 
                        && !inheritedPresets.includes(inheritedPreset) 
                        && this.id.value !== inheritedPreset.id.value
                        && preset.id.value !== inheritedPreset.id.value // 确保不包含自己和当前预设
                    ) {
                        inheritedPresets.push(inheritedPreset);
                        collectInheritedPresets(inheritedPreset); // 递归查找
                    }
                });
            }
        }
        collectInheritedPresets(this);

        // 收集所有继承的 modIds
        let inheritedModIds: string[] = [];
        inheritedPresets.forEach(preset => {
            inheritedModIds = inheritedModIds.concat(preset.modIds.value);
        });

        // 去重
        inheritedModIds = [...new Set(inheritedModIds)];

        // 防止潜在的引用
        inheritedModIds = JSON.parse(JSON.stringify(inheritedModIds));

        return inheritedModIds;
    }
}


class ModPresetLoader {
    public modPresets: ModPreset[] = [];
    public modPresetFolders: string[] = [];

    /**
     * 计算指定文件夹下的所有预设文件
     * @param directory 预设文件夹的路径
     * @returns 
     */
    private async getPresetFiles(directory: string): Promise<string[]> {
        const files: string[] = [];
        // 读取目录下的所有文件
        const filePaths = await getDirectoryList(directory);
        for (const filePath of filePaths) {
            if (await isFileExists(filePath) && filePath.endsWith(".json")) {
                files.push(filePath);
            }
        }
        return files;
    }
    private async loadPresetsFromDirectory(directory: string): Promise<void> {
        const presetFiles = await this.getPresetFiles(directory);
        for (const file of presetFiles) {
            try {
                const preset = await ModPreset.loadFrom(file);
                this.modPresets.push(preset);
            } catch (error) {
                console.error(`Failed to load preset from ${file}:`, error);
            }
        }
    }
    public async loadPresets(): Promise<void> {
        this.modPresets = []; // 清空之前的预设
        if (this.modPresetFolders.length === 0) {
            console.warn("No preset folders configured.");
            return;
        }
        for (const folder of this.modPresetFolders) {
            try {
                await this.loadPresetsFromDirectory(folder);
            } catch (error) {
                console.error(`Error loading presets from ${folder}:`, error);
            }
        }
    }
}

export const modPresetLoader = new ModPresetLoader();
export type { ModPreset, ModPresetLoader };