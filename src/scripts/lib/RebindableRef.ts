import { ref, watch, type Ref, type UnwrapRef,type WatchHandle } from "vue"

type RebindableRefCallback<T> = (newValue: UnwrapRef<T>) => void | ((newValue: UnwrapRef<T>, oldValue: UnwrapRef<T>) => void);
export class RebindableRef<T> {
    private _ref: Ref<UnwrapRef<T>>;
    private _watchers: WatchHandle[] = [];
    private _callbacks: Array<RebindableRefCallback<T>> = [];
    private _onRebindCallbacks: Array<(newRef: Ref<UnwrapRef<T>>, oldRef: Ref<UnwrapRef<T>>) => void> = [];

    constructor(initialValue: T) {
        this._ref = ref(initialValue) as Ref<UnwrapRef<T>>;
    }

    get value(): UnwrapRef<T> {
        return this._ref.value;
    }

    set value(newValue: UnwrapRef<T>) {
        this._ref.value = newValue;
    }

    get ref(): Ref<UnwrapRef<T>> {
        return this._ref;
    }

    rebind(newRef: Ref<UnwrapRef<T>>) {
        let needRefresh = true;
        let oldValue = this._ref.value;
        const oldRef = this._ref;
        if (oldValue === newRef.value) {
            needRefresh = false;
        }
        this._ref = newRef;

        // 重新绑定所有的监听器
        this._watchers.forEach((stop) => stop());
        this._watchers = [];

        // 重新绑定所有的回调
        for (const callback of this._callbacks) {
            const watcher = watch(this._ref, (newValue) => {
                callback(newValue);
            });
            this._watchers.push(watcher);
        }

        // 触发 onRebind 回调
        for (const cb of this._onRebindCallbacks) {
            cb(newRef, oldRef);
        }

        // 如果需要刷新，则触发所有的回调
        // debug
        console.log('Rebinding', this._ref.value, 'to', newRef.value, 'needRefresh:', needRefresh);
        if (needRefresh) {
                this._callbacks.forEach(callback => {
                if (callback.length === 2) {
                    (callback as (newValue: UnwrapRef<T>, oldValue: UnwrapRef<T>) => void)(this._ref.value, oldValue);
                } else {
                    callback(this._ref.value);
                }
            });
        }
    }

    watch(callback: RebindableRefCallback<T>): () => void {
        // debug
        const watcher = watch(this._ref, (newValue, oldValue) => {
            if (callback.length === 2) {
                (callback as (newValue: UnwrapRef<T>, oldValue: UnwrapRef<T>) => void)(newValue, oldValue);
            } else {
                callback(newValue);
            }
        });
        this._watchers.push(watcher);
        this._callbacks.push(callback);

        return () => {
            const index = this._watchers.indexOf(watcher);
            if (index !== -1) {
                this._watchers.splice(index, 1);
                watcher();
            }
            const callbackIndex = this._callbacks.indexOf(callback);
            if (callbackIndex !== -1) {
                this._callbacks.splice(callbackIndex, 1);
            }
        }
    }

    onRebind(cb: (newRef: Ref<UnwrapRef<T>>, oldRef: Ref<UnwrapRef<T>>) => void): () => void {
        this._onRebindCallbacks.push(cb);
        return () => {
            const idx = this._onRebindCallbacks.indexOf(cb);
            if (idx !== -1) {
                this._onRebindCallbacks.splice(idx, 1);
            }
        };
    }
}
