import { type IFileSystem } from "@/shared/types/filesystem";
import { rustFileSystem } from "@/shared/services/RustFileSystem";

class ServiceContainer {
    private _fs: IFileSystem;
    public get fs(): IFileSystem {
        return this._fs;
    }
    public setFileSystem(ifs: IFileSystem): void {
        this._fs = ifs;
    }

    constructor() {
        this._fs = rustFileSystem;
    }
}

export const globalServiceContainer = new ServiceContainer();