import { join } from "@tauri-apps/api/path";
import { isFileExists } from "@/shared/services/FileHelper";
import { ModMetadata } from "@/features/mod-manager/ModMetadata";
import { ModPreviewManager } from "@/features/mod-manager/ModPreviewManager";
import { ModFileOperator } from "@/features/mod-manager/ModFileOperator";
import { ModHotkeyManager } from "@/features/mod-manager/ModHotkeyManager";
import type { ModConfig } from "@/features/mod-manager/ModMetadata";

export class ModInfo {
    public getSelf() { return this; }
    public newMod = false;
    public static totalCount = 0;

    private _metadata: ModMetadata;
    private _previewManager: ModPreviewManager;
    private _fileOperator: ModFileOperator;
    private _hotkeyManager: ModHotkeyManager;

    public get metadata() { return this._metadata; }
    public get previewManager() { return this._previewManager; }
    public get fileOperator() { return this._fileOperator; }
    public get hotkeyManager() { return this._hotkeyManager; }

    private constructor(
        config: ModConfig,
    ) {
        this._metadata = new ModMetadata(config);
        this._previewManager = new ModPreviewManager(this._metadata);
        this._fileOperator = new ModFileOperator(this._metadata);
        this._hotkeyManager = new ModHotkeyManager(this._metadata.hotkeys);
    }

    public static async createMod(location: string, config: ModConfig): Promise<ModInfo> {
        const modInfo = new ModInfo(config);
        const configFile = await join(location, 'mod.json');

        if (!await isFileExists(configFile)) {
            modInfo.newMod = true;
        }
        
        await modInfo._metadata.loadFrom(configFile);
        await modInfo._metadata.initialize(location);
        return modInfo;
    }

    public async setMetaDataFromJson(json: JSON) {
        try {
            const metaData = JSON.parse(JSON.stringify(json));
            if (this._metadata.getConfig().keepModNameAsModFolderName &&
                metaData['name'] !== this._metadata.name.value) {
                if (await this._fileOperator.changeFolderName(metaData['name'])) {
                    this._metadata.name.value = metaData['name'];
                }
            }
            this._metadata.mergeData(metaData, true);
        } catch (e) {
            console.error(`解析模块元数据失败：${this._metadata.location.value}`, json);
        }
    }
}
