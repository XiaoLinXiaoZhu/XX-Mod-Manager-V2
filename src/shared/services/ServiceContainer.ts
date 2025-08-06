import { type IFileSystem } from "@/shared/types/filesystem";
import { rustFileSystem } from "@/shared/services/RustFileSystem";

class ServiceContainer {
    private _fs: IFileSystem;
    public get fs(): IFileSystem {
        return this._fs;
    }
    public setFileSystem(ifs: IFileSystem): void {
        this._fs = ifs;
        // 通知所有监听器
        this._fsListeners.forEach(listener => listener(ifs));
    }

    constructor() {
        this._fs = rustFileSystem;
    }

    private _fsListeners: Array<(fs: IFileSystem) => void> = [];
    // 可选：提供监听接口（通常用于测试或特殊场景）
    public onFileSystemChange(listener: (fs: IFileSystem) => void): () => void {
        this._fsListeners.push(listener);
        return () => {
            const index = this._fsListeners.indexOf(listener);
            if (index > -1) this._fsListeners.splice(index, 1);
        };
    }
}

export const globalServiceContainer = new ServiceContainer();