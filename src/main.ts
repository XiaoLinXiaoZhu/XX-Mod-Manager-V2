import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.ts';
import { i18nInstance, setI18nLocale } from './locals/index.ts';
import 'sober'
import { EventSystem, EventType } from './scripts/core/EventSystem.ts';

//-================ 检查更新 =================
import { checkForUpdates } from './scripts/core/UpdateChecker.ts';
import { ConfigLoader, useConfig } from './scripts/core/ConfigLoader.ts';
import { emit, listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';

// checkForUpdates();

import { ModLoader } from './scripts/lib/ModLoader.ts';
ModLoader.addModSourceFolder("D:\\GameResource\\WWMI\\ModSource").then(() => {
    console.log('ModLoader: addModSourceFolder success');
    ModLoader.loadMods();
}).catch((err) => {
    console.error('ModLoader: addModSourceFolder error', err);
});


//-================ 初始化 =================
const vueApp = createApp(App);

vueApp.use(router);
vueApp.use(i18nInstance);

//-================ 挂载 =================
vueApp.mount('#app');

setI18nLocale("en-US");

//------------ 初次打开时展示教程页面 ------------
EventSystem.on(EventType.wakeUp, () => {
    //debug
    console.log('wakeUp event triggered');
});

// 测试 唤醒事件触发
// EventSystem.trigger(EventType.wakeUp);

//-=======禁用 tab 切换焦点=======-//
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
    }
});

//-=======禁用右键菜单=======-//
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

//-======= 接收 wakeUp 事件 =======-//
// 这里的事件是从 rust 端发过来的
listen('wake-up', (event) => {
    // debug
    console.log('wakeUp event received', event);
    EventSystem.trigger(EventType.wakeUp);
});

invoke('main_window_ready');

