/**
 * 通用防抖器类
 */
export class Debouncer {
    private _timer: NodeJS.Timeout | null = null;
    private _delay: number;
    private _fn: () => void | Promise<void>;

    constructor(fn: () => void | Promise<void>, delay: number = 300) {
        this._fn = fn;
        this._delay = delay;
    }

    /**
     * 调用防抖函数
     */
    public invoke(): void {
        this.cancel();
        this._timer = setTimeout(() => {
            this._fn();
            this._timer = null;
        }, this._delay);
    }

    /**
     * 立即执行函数，绕过防抖
     */
    public invokeImmediate(): void | Promise<void> {
        this.cancel();
        return this._fn();
    }

    /**
     * 取消防抖
     */
    public cancel(): void {
        if (this._timer) {
            clearTimeout(this._timer);
            this._timer = null;
        }
    }

    /**
     * 设置防抖延迟时间
     * @param delay 延迟时间（毫秒）
     */
    public setDelay(delay: number): void {
        this._delay = delay;
    }

    /**
     * 获取当前延迟时间
     */
    public getDelay(): number {
        return this._delay;
    }

    /**
     * 检查是否有待执行的防抖任务
     */
    public isPending(): boolean {
        return this._timer !== null;
    }

    /**
     * 清理资源
     */
    public dispose(): void {
        this.cancel();
    }
}
