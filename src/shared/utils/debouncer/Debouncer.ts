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

/**
 * 防抖装饰器函数类型
 */
export type DebouncerDecoratorOptions = {
    delay?: number;
    leading?: boolean;
    trailing?: boolean;
};

/**
 * 防抖装饰器 - 用于类方法的防抖处理
 * @param delay 防抖延迟时间（毫秒），默认300ms
 * @param options 配置选项
 * @returns 装饰器函数
 *
 * @example
 * ```typescript
 * class MyClass {
 *   @debouncerDecorater(500)
 *   handleInput() {
 *     console.log('处理输入');
 *   }
 *
 *   @debouncerDecorater(300, { leading: true, trailing: false })
 *   handleClick() {
 *     console.log('处理点击');
 *   }
 * }
 * ```
 */
export function debouncerDecorater(delay: number = 300, options: DebouncerDecoratorOptions = {}) {
    const { leading = true, trailing = true } = options;

    return function (
        target: any,
        propertyKey: string | symbol,
        descriptor: PropertyDescriptor
    ): void {
        if (!descriptor || typeof descriptor.value !== 'function') {
            throw new Error('@debouncerDecorater can only be applied to methods');
        }

        const originalMethod = descriptor.value;
        const debouncers = new WeakMap<any, Map<string | symbol, Debouncer>>();

        descriptor.value = function (this: any, ...args: any[]): any {
            // 获取或创建当前实例的防抖器映射
            let instanceDebouncers = debouncers.get(this);
            if (!instanceDebouncers) {
                instanceDebouncers = new Map();
                debouncers.set(this, instanceDebouncers);
            }

            // 获取或创建当前方法的防抖器
            let debouncer = instanceDebouncers.get(propertyKey);
            if (!debouncer) {
                debouncer = new Debouncer(() => {
                    originalMethod.apply(this, args);
                }, delay);
                instanceDebouncers.set(propertyKey, debouncer);
            } else {
                // 更新防抖器的函数引用，确保参数是最新的
                debouncer.cancel();
                debouncer = new Debouncer(() => {
                    originalMethod.apply(this, args);
                }, delay);
                instanceDebouncers.set(propertyKey, debouncer);
            }

            if (leading && !debouncer.isPending()) {
                // 如果是首次调用且启用了leading，立即执行
                return originalMethod.apply(this, args);
            }

            if (trailing) {
                // 启用trailing，延迟执行
                debouncer.invoke();
            }
        };
    };
}

/**
 * 简化的防抖装饰器（仅指定延迟时间）
 * @param delay 防抖延迟时间（毫秒）
 * @returns 装饰器函数
 */
export function debounce(delay: number = 300): MethodDecorator {
    return debouncerDecorater(delay);
}

// 类型守卫，确保装饰器正确使用
export function isMethodDecorator(target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor): boolean {
    return descriptor && typeof descriptor.value === 'function';
}
