import {StorageValue } from "@/core/storage/Storage";

// provides a way to manage mod hotkeys
export class ModHotkeyManager {
    constructor(public hotkeys: StorageValue<{ key: string, description: string }[]>) {}

    public addHotkey(key: string, description: string) {
        if (!key || !description) return;
        this.hotkeys.value = [...this.hotkeys.value, { key, description }];
    }

    public removeHotkey(key: string) {
        this.hotkeys.value = this.hotkeys.value.filter(h => h.key !== key);
    }

    public getHotkeys() {
        return this.hotkeys.value;
    }
}