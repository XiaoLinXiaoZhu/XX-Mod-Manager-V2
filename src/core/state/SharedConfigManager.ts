// 这里用于管理共享配置
// 通过 RebindableRef 来实现状态的响应式存在比较大的问题
// 所以说改为：
// 1. 直接使用 ComputedRef
// 2. 通过改变 同步源 来实现跟随 配置的变化
import { computed, WritableComputedRef, ref } from "vue";
import { Storage } from "../storage/Storage";
import { I18nLocale } from "@/shared/composables/localHelper";
import { EventSystem, EventType } from "../event/EventSystem";
import { ConfigLoader } from "../config/ConfigLoader";
import { GlobalConfigLoader } from "../config/GlobalConfigLoader";
import { Theme } from "@/assets/styles/styleController";

class SharedConfigManager {
    // 使用响应式的 ref 来存储 updateSource，这样可以触发 computed 的重新计算
    private updateSource = ref<Storage | undefined>(undefined);

    public setUpdateSource(source: Storage) {
        // debug
        console.log('👉🏻 SharedConfigManager: setUpdateSource', source);
        this.updateSource.value = source;
    }

    private buildComputedRef<T>(key: string, defaultValue: T): WritableComputedRef<T> {
        return computed({
            get: () => {
                const source = this.updateSource.value;
                if (!source) {
                    console.warn(`SharedConfigManager: updateSource is not set, returning default value for ${key}`);
                    return defaultValue;
                }
                
                const ref = source.useStorage(key, defaultValue).getRef();
                if (!ref) {
                    console.warn(`SharedConfigManager: no ref found for ${key}, returning default value`);
                    return defaultValue;
                }
                return ref.value;
            },
            set: (value: T) => {
                const source = this.updateSource.value;
                if (!source) {
                    console.warn(`SharedConfigManager: updateSource is not set, cannot set value for ${key}`);
                    return;
                }
                // debug
                console.log(`SCM[${source.storageName}]: Setting ${key} to`, value);
                source.useStorage(key, value).value = value;
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