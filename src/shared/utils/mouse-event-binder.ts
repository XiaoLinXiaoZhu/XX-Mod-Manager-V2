/**
 * 鼠标事件绑定工具
 * 提供响应式的鼠标事件处理功能
 */

import { Ref, ref, UnwrapRef } from "vue";

export type MouseEventBindedValue<T> = {
    valueRef: Ref<T> | Ref<UnwrapRef<T>>;
    onMouseDown?: MouseEventCallback<T> | null;
    onMouseUp?: MouseEventCallback<T> | null;
    onMouseEnter?: MouseEventCallback<T> | null;
    onMouseLeave?: MouseEventCallback<T> | null;
    onMouseMove?: MouseEventCallback<T> | null;
    onMouseOver?: MouseEventCallback<T> | null;
    onMouseOut?: MouseEventCallback<T> | null;
    onWheel?: MouseEventCallback<T> | null;
    onContextMenu?: MouseEventCallback<T> | null;
    onClick?: MouseEventCallback<T> | null;
    onDblClick?: MouseEventCallback<T> | null;
};

export type MouseEventCallback<T> = (event: MouseEvent, value: Ref<T> | Ref<UnwrapRef<T>>) => void;

export class MouseEventBinder<T> {
    public mouseEventBindedValue: MouseEventBindedValue<T>;
    public valueRef: Ref<T> | Ref<UnwrapRef<T>>;
    
    get value(): T | UnwrapRef<T> {
        return this.valueRef.value;
    }
    
    set value(newValue: T) {
        this.valueRef.value = newValue;
    }
    
    constructor(value: T) {
        this.valueRef = ref(value);
        this.mouseEventBindedValue = {
            valueRef: this.valueRef,
            onMouseDown: null,
            onMouseUp: null,
            onMouseEnter: null,
            onMouseLeave: null,
            onMouseMove: null,
            onMouseOver: null,
            onMouseOut: null,
            onWheel: null,
            onContextMenu: null,
            onClick: null,
            onDblClick: null
        };
    }

    public bindMouseDown(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseDown = callback;
        return this;
    }
    
    public bindMouseUp(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseUp = callback;
        return this;
    }
    
    public bindMouseEnter(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseEnter = callback;
        return this;
    }
    
    public bindMouseLeave(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseLeave = callback;
        return this;
    }
    
    public bindMouseMove(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseMove = callback;
        return this;
    }
    
    public bindMouseOver(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseOver = callback;
        return this;
    }
    
    public bindMouseOut(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onMouseOut = callback;
        return this;
    }
    
    public bindWheel(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onWheel = callback;
        return this;
    }
    
    public bindContextMenu(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onContextMenu = callback;
        return this;
    }
    
    public bindClick(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onClick = callback;
        return this;
    }
    
    public bindDblClick(callback: MouseEventCallback<T>): MouseEventBinder<T> {
        this.mouseEventBindedValue.onDblClick = callback;
        return this;
    }
    
    public getRef(): Ref<T> | Ref<UnwrapRef<T>> {
        return this.mouseEventBindedValue.valueRef;
    }

    public bindEvent<K extends keyof MouseEventBindedValue<T>>(
        eventName: K,
        callback: MouseEventBindedValue<T>[K]
    ): MouseEventBinder<T> {
        if (this.mouseEventBindedValue[eventName] !== undefined) {
            this.mouseEventBindedValue[eventName] = callback;
        } else {
            throw new Error(`Event ${eventName} is not a valid mouse event.`);
        }
        return this;
    }

    public mount(element: HTMLElement): void {
        for (const [eventName, callback] of Object.entries(this.mouseEventBindedValue)) {
            if (callback !== null && typeof callback === 'function') {
                element.addEventListener(eventName, callback as EventListener);
            }
        }
    }
}

export class MouseEventBinderBatch {
    // 批量绑定鼠标事件的值
    public mouseEventBinders: MouseEventBinder<any>[] = [];
    
    public add(value: MouseEventBinder<any>): MouseEventBinderBatch {
        this.mouseEventBinders.push(value);
        return this;
    }
    
    public listAll(): MouseEventBinder<any>[] {
        console.log('Listing all mouse event binded values:', this.mouseEventBinders);
        return this.mouseEventBinders;
    }
    
    public mountAll(element: HTMLElement): void {
        // 只为每种事件类型绑定一个监听器，触发所有对应的回调
        const eventNames: (keyof MouseEventBindedValue<any>)[] = [
            "onMouseDown", "onMouseUp", "onMouseEnter", "onMouseLeave",
            "onMouseMove", "onMouseOver", "onMouseOut", "onWheel",
            "onContextMenu", "onClick", "onDblClick"
        ];

        eventNames.forEach(eventKey => {
            // 去掉 "on" 前缀并小写第一个字母，得到 DOM 事件名
            const domEvent = eventKey.replace(/^on/, '').toLowerCase();
            element.addEventListener(domEvent, (event: Event) => {
                for (const mouseEventBinder of this.mouseEventBinders) {
                    const callback = mouseEventBinder.mouseEventBindedValue[eventKey];
                    if (callback && typeof callback === 'function') {
                        callback(event as MouseEvent, mouseEventBinder.valueRef);
                    }
                }
            });
        });
    }
}
