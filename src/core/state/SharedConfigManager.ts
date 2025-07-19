// 这里用于管理共享配置
// 通过 RebindableRef 来实现状态的响应式存在比较大的问题
// 所以说改为：
// 1. 直接使用 ComputedRef
// 2. 通过改变 同步源 来实现跟随 配置的变化
import { computed, WritableComputedRef } from "vue";
import { Storage } from "../storage/Storage";
import { I18nLocale } from "@/shared/composables/localHelper";
import { EventSystem, EventType } from "../event/EventSystem";
import { ConfigLoader } from "../config/ConfigLoader";
import { GlobalConfigLoader } from "../config/GlobalConfigLoader";
import { Theme } from "@/assets/styles/styleController";

class SharedConfigManager {
    private updateSource?: Storage;

    public setUpdateSource(source: Storage) {
        this.updateSource = source;
    }

    private buildComputedRef<T>(key: string, defaultValue: T): WritableComputedRef<T> {
        return computed({
            get: () => {
                if (!this.updateSource) {
                    console.warn(`SharedConfigManager: updateSource is not set, returning default value for ${key}`);
                    return defaultValue;
                }
                const ref = this.updateSource.useStorage(key, defaultValue).getRef();
                return ref.value;
            },
            set: (value: T) => {
                if (!this.updateSource) {
                    console.warn(`SharedConfigManager: updateSource is not set, cannot set value for ${key}`);
                    return;
                }
                const ref = this.updateSource.useStorage(key, value).getRef();
                ref.value = value;
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
export const sharedConfigManager = new SharedConfigManager();