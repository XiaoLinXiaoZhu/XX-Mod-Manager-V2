/**
 * 可重新绑定的响应式引用
 * 提供类似于 v-model 的双向绑定功能
 */

import { Ref, ShallowRef, shallowRef, watch } from 'vue';

/**
 * 可重新绑定的响应式引用类
 * 支持动态绑定到不同的响应式引用
 */
export class RebindableRef<T> {
  // 优先使用shallow Ref 避免解析问题
  private _ref: ShallowRef<T>;
  
  public get ref() {
    return this._ref;
  }

  // value getter/setter
  public get value(): T {
    return this._ref.value;
  }
  
  public set value(newValue: T) {
    this._ref.value = newValue;
  }

  constructor(value: T) {
    this._ref = shallowRef(value);
  }

  // 实现一个类似于 v-model 的双向绑定
  private _syncSource?: Ref<T>;
  private _isUpdating: boolean = false; // 防止循环调用的标志
  private _sourceWatchHandle?: () => void;
  private _selfWatchHandle?: () => void;

  // 设置同步源
  public rebind(source: Ref<T>) {
    if (this._syncSource) {
      this._sourceWatchHandle?.();
      this._selfWatchHandle?.();
    }
    this._syncSource = source;

    // 监听源的变化，更新当前 ref
    this._sourceWatchHandle = watch(this._syncSource, (newValue) => {
      if (this._isUpdating) {
        this._isUpdating = false;
        return;
      }
      this._isUpdating = true;
      this._ref.value = newValue;
    }, {
      immediate: true,
      deep: true
    });

    // 监听当前 ref 的变化，更新源
    this._selfWatchHandle = watch(this._ref, (newValue) => {
      if (this._isUpdating) {
        this._isUpdating = false;
        return; // 防止循环调用
      }
      if (this._syncSource) {
        this._isUpdating = true;
        this._syncSource.value = newValue;
      }
    }, {
      immediate: true,
      deep: true
    });
  }

  // 解绑同步源
  public unbind() {
    this._sourceWatchHandle?.();
    this._selfWatchHandle?.();
    this._syncSource = undefined;
    this._sourceWatchHandle = undefined;
    this._selfWatchHandle = undefined;
  }

  // 清理所有资源
  public dispose() {
    this.unbind();
  }
}
