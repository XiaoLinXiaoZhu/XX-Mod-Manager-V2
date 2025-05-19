import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.ts';
import { i18nInstance,setI18nLocale } from './locals/index.ts';
import 'sober'
import { EventSystem, EventType } from './scripts/core/EventSystem.ts';
import { getConfig } from './scripts/core/ConfigLoader.ts';
//-================ 初始化 =================
const vueApp = createApp(App);

vueApp.use(router);
vueApp.use(i18nInstance);

//-================ 挂载 =================
vueApp.mount('#app');

setI18nLocale("en-US");

//------------ 初次打开时展示教程页面 ------------
EventSystem.on(EventType.wakeUp, () => {
    const isFirstLoad = getConfig('firstLoad') ? getConfig('firstLoad') : true;
    if (isFirstLoad) {
        // debug 
        console.log('first load, show tutorial page');
        router.push({
            name: 'Tutorial',
        });
    }
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






