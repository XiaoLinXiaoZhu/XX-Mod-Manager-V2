// 这里用于管理共享配置
// 使用 RebindableRef 来实现状态的响应式绑定
// 通过 rebind 方法来切换不同的配置源
import { Storage } from "../storage/Storage";
import { I18nLocale } from "@/shared/types/local";
import { EventSystem, EventType } from "../event/EventSystem";
import { ConfigLoader } from "../config/ConfigLoader";
import { GlobalConfigLoader } from "../config/GlobalConfigLoader";
import { Theme } from "@/assets/styles/styleController";
import { RebindableRef } from "@/shared/composables/RebindableRef";

class SharedConfigManager {
    // 使用 RebindableRef 来管理配置项
    private _language: RebindableRef<I18nLocale>;
    private _theme: RebindableRef<Theme>;
    
    // 当前绑定的存储源
    private _currentSource: Storage | undefined = undefined;

    constructor() {
        // 初始化 RebindableRef 实例，设置默认值
        this._language = new RebindableRef<I18nLocale>('zh-CN' as I18nLocale);
        this._theme = new RebindableRef<Theme>('dark' as Theme);
    }

    public setUpdateSource(source: Storage) {
        // debug
        console.log('👉🏻 SharedConfigManager: setUpdateSource', source);
        
        // 记录当前源
        this._currentSource = source;

        // 获取存储中的配置项并绑定到 RebindableRef
        const languageStorage = source.useStorage('language', 'zh-CN' as I18nLocale);
        const themeStorage = source.useStorage('theme', 'dark' as Theme);

        // 使用 rebind 方法将 RebindableRef 绑定到存储的 ref
        this._language.rebind(languageStorage.refImpl);
        this._theme.rebind(themeStorage.refImpl);

        // debug
        console.log('SharedConfigManager: language bound to', languageStorage.refImpl.value);
        console.log('SharedConfigManager: theme bound to', themeStorage.refImpl.value);
    }

    // 暴露配置项的 ref，可以在 Vue 组件中直接使用
    public get language() {
        return this._language.ref;
    }

    public get theme() {
        return this._theme.ref;
    }

    // 获取当前绑定的存储源信息
    public getCurrentSource(): Storage | undefined {
        return this._currentSource;
    }

    // 清理资源
    public dispose() {
        this._language.dispose();
        this._theme.dispose();
        this._currentSource = undefined;
    }
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
  console.log('initDone event triggered');
  sharedConfigManager.setUpdateSource(GlobalConfigLoader);
});

export const sharedConfigManager = new SharedConfigManager();