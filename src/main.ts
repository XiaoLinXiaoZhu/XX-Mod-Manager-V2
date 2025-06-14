import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.ts';
import { i18nInstance, setI18nLocale } from '@/locals/index.ts';
import 'sober'
import { EventSystem, EventType } from './scripts/core/EventSystem.ts';

//-================ 检查更新 =================

import { emit, listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';


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

//-======== 禁用 webview 默认拖拽
window.addEventListener('dragover', (e) => {
    e.preventDefault(); // 阻止默认行为，防止 Webview 打开文件
}, false);

window.addEventListener('drop', (e) => {
    e.preventDefault(); // 同样阻止默认行为
    // 可选：你可以在这里触发你自己的 drop 处理逻辑
    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        console.log('用户拖入了文件:', [...e.dataTransfer.files]);
        // 这里可以调用你自己的文件处理函数
    }
}, false);

//-======= 接收 wakeUp 事件 =======-//
// 这里的事件是从 rust 端发过来的
listen('wake-up', (event) => {
    // debug
    console.log('wakeUp event received', event);
    EventSystem.trigger(EventType.wakeUp);
});

//-======= 接收 snack 事件 =======-//
import { Snackbar } from 'sober';
listen('snack', (event) => {
    // debug
    console.log('snack event received', event);
    const payload = event.payload as any;
    let message = payload[0];
    let snackType = payload[1];
    let duration = payload[2];
    let align = payload[3];
    // 确保 snackType 和 align 是全部小写
    snackType = snackType.toLowerCase() as "error" | "none" | "info" | "success" | "warning";
    align = align.toLowerCase() as "auto" | "top" | "bottom";
    // debug
    console.log('snack ' + message + ' ' + snackType + ' ' + duration + ' ' + align);
    Snackbar.builder({
        text: message,
        type: snackType,
        duration,
        align,
    }).show();
});


EventSystem.on(EventType.wakeUp, async () => {
    $t_snack("message.hello", "success");
});

import { init } from './scripts/core/XXMMCore.ts';
import { $t_snack } from './scripts/lib/SnackHelper.ts';
init();
