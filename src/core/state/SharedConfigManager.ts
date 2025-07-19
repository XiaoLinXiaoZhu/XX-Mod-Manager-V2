// 这里用于管理共享配置
// 通过 RebindableRef 来实现状态的响应式存在比较大的问题
// 所以说改为：
// 1. 直接使用 ComputedRef
// 2. 通过改变 同步源 来实现跟随 配置的变化
import { computed, WritableComputedRef, ref, watch } from "vue";
import { Storage } from "../storage/Storage-old";
import { I18nLocale } from "@/shared/composables/localHelper";
import { EventSystem, EventType } from "../event/EventSystem";
import { ConfigLoader } from "../config/ConfigLoader";
import { GlobalConfigLoader } from "../config/GlobalConfigLoader";
import { Theme } from "@/assets/styles/styleController";
import { isRefObject } from "@/shared/utils/RefHelper";

class SharedConfigManager {
    // 使用响应式的 ref 来存储 updateSource，这样可以触发 computed 的重新计算
    private updateSource = ref<Storage | undefined>(undefined);
    private watcherHandlers: Record<string, () => void> = {};
    private _refCache: Record<string, any> = {
        language: ref<I18nLocale>('zh-CN1231' as I18nLocale), // 默认语言
        theme: ref<Theme>('dark' as Theme) // 默认主题
    };

    public setUpdateSource(source: Storage) {
        // debug
        console.log('👉🏻 SharedConfigManager: setUpdateSource', source);
        this.updateSource.value = source;

        // 清除之前的 watcher
        for (const key in this.watcherHandlers) {
            if (this.watcherHandlers[key]) {
                this.watcherHandlers[key]();
            }
        }
        this.watcherHandlers = {};

        // 重新绑定 watcher
        const languageStorage = source.useStorage('language', 'zh-CN' as I18nLocale);
        this._refCache.language.value = languageStorage.getRef().value;
        this.watcherHandlers.language = watch(languageStorage?.getRef(), (newValue) => {
            // debug
            console.log('SharedConfigManager: language changed to', newValue);
            // 更新语言
            this._refCache.language.value = newValue;
        });
        const themeStorage = source.useStorage('theme', 'dark' as Theme);
        this._refCache.theme.value = themeStorage.getRef().value;
        this.watcherHandlers.theme = watch(themeStorage?.getRef(), (newValue) => {
            // debug
            console.log('SharedConfigManager: theme changed to', newValue);
            // 更新主题
            this._refCache.theme.value = newValue;
        });
    }

private buildComputedRef<T>(key: string, defaultValue: T): WritableComputedRef<T> {
    return computed({
        get: () => {
            return this._refCache[key]?.value ?? this.updateSource.value?.useStorage(key, defaultValue).value ?? defaultValue;
        },
        set: (value: T) => {
            const source = this.updateSource.value;
            if (!source) {
                console.warn(`SharedConfigManager: updateSource is not set, cannot set value for ${key}`);
                return;
            }
            // debug
            console.log(`SCM[${source.storageName}]: Setting ${key} to`, value);
            // 只调用一次 useStorage，避免创建新的 Ref
            const storage = source.useStorage(key, defaultValue);
            if (!isRefObject(storage)) {
                console.warn(`SCM[${source.storageName}]: ${key} is not a Ref`);
                // this._refCache[key] = ref(value);
            } else {
                // debug
                console.log(`SCM[${source.storageName}]: ${key} is a Ref, updating value`);
            }
            storage.value = value;
            // 使用已经获取的 storage 引用来检查值
            console.log(`SCM[${source.storageName}]: ${key} is now`, storage.value);
        }
    });
}

    public language = this.buildComputedRef<I18nLocale>('language', 'zh-CN' as I18nLocale);
    public theme = this.buildComputedRef<Theme>('theme', 'dark' as Theme);
}

EventSystem.on(EventType.routeChanged, (changeInfo: { to: string, from: string }) => {
  //-================================
  //-🔄 路由变化时，重新绑定
  //-================================
  //debug
  console.log('Route changed from', changeInfo.from, 'to', changeInfo.to);
  if (changeInfo.to === 'Main') {
    sharedConfigManager.setUpdateSource(GlobalConfigLoader);
  }
  else {
    sharedConfigManager.setUpdateSource(ConfigLoader);
  }
});

// 重新绑定事件
EventSystem.on(EventType.initDone, () => {
  // debug
  console.log('MainPage initDone event triggered');
  sharedConfigManager.setUpdateSource(GlobalConfigLoader);
});

export const sharedConfigManager = new SharedConfigManager();