export class CachedObject {
    private _cache: Record<string, any> = {};
    public caculateCache = (): Record<string, any> => {
        // Perform cache calculation logic here
        return {};
    };
    private inited: boolean = false;
    private checkInit(): void {
        if (!this.inited) {
            this.caculateCache();
            this.inited = true;
        }
    }
    constructor(caculateCache?: () => Record<string, any>) {
        if (caculateCache) {
            this.caculateCache = caculateCache;
        }
    }

    // 强制同步，发生较大变更时使用
    public syncCache(): void {
        this.caculateCache();
    }

    // 差异更新，发生小变更时使用
    public setCache(key: string, value: any): void {
        this.checkInit();
        this._cache[key] = value;
    }

    public getCache(key: string): any {
        this.checkInit();
        return this._cache[key];
    }


    public getAllCache(): Record<string, any> {
        this.checkInit();
        return { ...this._cache };
    }
}