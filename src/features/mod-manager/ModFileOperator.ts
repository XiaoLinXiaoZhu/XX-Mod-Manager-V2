import { dirname, join } from "@tauri-apps/api/path";
import { renameDirectory, isFileExists } from "@/shared/services/FileHelper";
import type { ModMetadata } from "./ModMetadata";

export class ModFileOperator {
    constructor(private _metadata: ModMetadata) {}

    public async changeFolderName(newName: string): Promise<boolean> {
        const parentDir = await dirname(this._metadata.location.value);
        const newPath = await join(parentDir, newName);
        
        if (await isFileExists(newPath)) return false;
        
        await renameDirectory(this._metadata.location.value, newPath);
        this._metadata.location.value = newPath;
        return true;
    }

    public async changeLocation(newLocation: string) {
        await renameDirectory(this._metadata.location.value, newLocation);
        this._metadata.location.value = newLocation;
    }
}