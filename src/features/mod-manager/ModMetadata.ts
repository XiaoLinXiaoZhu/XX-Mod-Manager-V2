import { basename } from "@tauri-apps/api/path";
import { Storage } from "@/core/storage/Storage";
import { hash256 } from "@/shared/utils/SimpleHash";

export interface ModConfig {
    keepModNameAsModFolderName: boolean;
}

// 基础的类，用于存储 mod 的 元数据
export class ModMetadata extends Storage {
    private static counter = 0;
    public _strictMode: boolean = true;
    
    public readonly id = this.useStorage("id", "");
    public readonly name = this.useStorage("modName", "");
    public readonly location = this.useStorage("location", "");
    public readonly url = this.useStorage("url", "");
    public readonly addDate = this.useStorage("addDate", "");
    public readonly JSONVersion = this.useStorage("JSONVersion", 1);
    public readonly category = this.useStorage("category", "");
    public readonly tags = this.useStorage("tags", [] as string[]);
    public readonly preview = this.useStorage("preview", "");
    public readonly description = this.useStorage("description", "");
    public readonly hotkeys = this.useStorage("hotkeys", [] as { key: string, description: string }[]);

    // public get metadata() {
    //     return this;
    // }

    constructor(private _config: ModConfig) {
        super("ModMetadata" + ++ModMetadata.counter);
    }
    public getConfig(): ModConfig {
        return this._config;
    }

    public toUnreactive() {
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
            description: this.description.value
        };
    }

    public async initialize(location: string) {
        const modFolderName = await basename(location);
        this.location.value = location;
        this.storageName = modFolderName;

        if (this.addDate.value === "") {
            this.addDate.value = new Date().toISOString();
        }
        if (this.id.value === "") {
            this.id.value = hash256(location);
        }
        if (this.name.value === "") {
            this.name.value = modFolderName;
        }
        if (this._config.keepModNameAsModFolderName && this.name.value !== modFolderName) {
            this.name.value = modFolderName;
        }
    }
}