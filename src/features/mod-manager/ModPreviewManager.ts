import { join, basename } from "@tauri-apps/api/path";
import { isFileExists, getDirectoryList, copyFile } from "@/shared/services/FileHelper";
import { EmptyImage, getImage, releaseImage, writeImageFromBase64, type ImageUrl, type Base64DataUrl } from "@/shared/services/ImageHelper";
import { ref, computed, type Ref } from "vue";
import type { ModMetadata } from "./ModMetadata";

export class ModPreviewManager {
    private _ifGettedPreviewUrl = false;
    private readonly _previewUrlRef: Ref<string> = ref(EmptyImage);
    public previewUrlRef = computed(() => {
        if (!this._ifGettedPreviewUrl) {
            this._ifGettedPreviewUrl = true;
            this.reloadPreview();
        }
        return this._previewUrlRef;
    });

    constructor(private _metadata: ModMetadata) {}

    public async findDefaultImagePath() {
        if (!this._metadata.location.value) return "";
        
        const defaultImagePaths = [
            "preview.png", "preview.jpg", "preview.jpeg", 
            "preview.webp", "preview.gif", "preview.bmp"
        ];
        
        for (const imagePath of defaultImagePaths) {
            const path = await join(this._metadata.location.value, imagePath);
            if (await isFileExists(path)) return imagePath;
        }

        const files = await getDirectoryList(this._metadata.location.value);
        for (const file of files) {
            const ext = file.split('.').pop();
            if (ext && ['png','jpg','jpeg','webp','gif','bmp'].includes(ext)) {
                return await basename(file);
            }
        }
        return "";
    }

    public async getPreviewPath() {
        const checkExists = async (path: string) => 
            await isFileExists(await join(this._metadata.location.value, path));

        if (this._metadata.preview.value && await checkExists(this._metadata.preview.value)) {
            return await join(this._metadata.location.value, this._metadata.preview.value);
        }
        
        const defaultPath = await this.findDefaultImagePath();
        return defaultPath ? await join(this._metadata.location.value, defaultPath) : "";
    }

    public async reloadPreview() {
        const imagePath = await this.getPreviewPath();
        if (!imagePath) return;

        const imageUrl = await getImage(imagePath, true);
        if (imageUrl) this._previewUrlRef.value = imageUrl;
    }

    public async getPreviewUrl(reload = false): Promise<ImageUrl> {
        try {
            const imagePath = await this.getPreviewPath();
            return imagePath ? await getImage(imagePath, reload) : EmptyImage;
        } catch {
            return EmptyImage;
        }
    }

    public async setPreviewByPath(previewPath: string) {
        if (!await isFileExists(previewPath)) return;
        
        const ext = previewPath.split('.').pop() || "";
        if (!['png','jpg','jpeg','webp','gif','bmp'].includes(ext)) return;
        
        const currentPath = await this.getPreviewPath();
        const newFileName = `preview.${ext}`;
        const newPath = await join(this._metadata.location.value, newFileName);
        
        await copyFile(previewPath, newPath);
        this._metadata.preview.value = newFileName;

        releaseImage(currentPath);
        await this.reloadPreview();
    }

    public async setPreviewByBase64(base64: Base64DataUrl) {
        if (!base64.startsWith("data:image/") || !base64.includes(",")) return;
        
        const ext = base64.split(';')[0].split('/')[1];
        if (!['png','jpg','jpeg','webp','gif','bmp'].includes(ext)) return;
        
        const currentPath = await this.getPreviewPath();
        const newFileName = `preview.${ext}`;
        const newPath = await join(this._metadata.location.value, newFileName);
        
        await writeImageFromBase64(newPath, base64);
        this._metadata.preview.value = newFileName;

        releaseImage(currentPath);
        await this.reloadPreview();
    }
}