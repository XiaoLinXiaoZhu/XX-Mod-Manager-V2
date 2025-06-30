// 这是 Tauri 应用的入口文件
// 这里会初始化 Vue 应用，设置路由和国际化等
import 'sober';
import { GlobalConfigLoader, useGlobalConfig } from './core/config/GlobalConfigLoader';
import { ConfigLoader } from './core/config/ConfigLoader';

import { getArgv, type Argv } from './shared/utils/Argv';
import * as path from '@tauri-apps/api/path';
import { listen } from '@tauri-apps/api/event';
import { $t_snack } from './shared/composables/use-snack';


//-===============================
//-🔧 添加事件钩子
//-===============================
import { EventSystem, EventType } from './core/event/EventSystem';

//- 禁用 tab 切换焦点
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
    }
});

//- 禁用右键菜单
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

//- 禁用 webview 默认拖拽
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


//--------- wakeUp 事件监听器 ---------
//-初次打开时展示教程页面
EventSystem.on(EventType.wakeUp, () => {
    //debug
    console.log('wakeUp event triggered');
});
EventSystem.on(EventType.wakeUp, async () => {
    $t_snack("message.hello", "success");
});


listen('wake-up', (event) => {
    // debug
    console.log('wakeUp event received', event);
    EventSystem.trigger(EventType.wakeUp);
});

//-===============================
//-🔢 argv 解析,加载全局配置
//-===============================
const argv: Argv = await getArgv();
console.log('XXMM Start With Argv:', argv);

if (argv.custom_config_folder) {
    // 全局配置从这里加载
    await GlobalConfigLoader.loadFrom(await path.resolve(".\\"));
} else {
    // 全局配置从默认路径加载
    await GlobalConfigLoader.loadDefaultConfig();
}

//-===============================
//-🔰 vue 和 router 挂载
//-===============================
import { createApp } from 'vue'
import App from './App.vue'
import router from './features/router/index';
import { i18nInstance } from './shared/composables/localHelper';

const vueApp = createApp(App);

vueApp.use(router);
vueApp.use(i18nInstance);

vueApp.mount('#app');

//-===============================
//-🧐 响应Argv参数
//-===============================
import { repos, getRepos } from './features/repository/Repo.ts';
// 如果有 repo 参数，则设置为当前仓库
await getRepos(); // 确保仓库列表已加载
if (argv.repo) {
    if (repos && repos.value.length > 0) {
        // 找到名称对应的仓库
        const repo = repos.value.find(r => r.name === argv.repo);
        if (repo) {
            const lastUsedGameRepo = useGlobalConfig('lastUsedGameRepo', '');
            lastUsedGameRepo.value = repo.configLocation;

            // 加载仓库配置
            ConfigLoader.loadFrom(repo.configLocation).then(() => {
                // 跳转到 modList 页面
                router.push({ name: 'modList' });
            }).catch((err) => {
                console.error('加载仓库配置失败:', err);
                $t_snack('message.loadRepoConfigFailed', 'error');
            });
        } else {
            console.warn('未找到指定的仓库:', argv.repo);
        }
    }
}

//- 初始化完成，各个模块可以开始工作了
EventSystem.on(EventType.initDone, () => {
    console.log('XXMM 初始化完成');
});
EventSystem.trigger(EventType.initDone);

//- updatecheck
import { checkForUpdates } from './features/updater/UpdateChecker';
const ifCheckUpdatesOnStart = useGlobalConfig('checkUpdatesOnStart', false);
EventSystem.on(EventType.wakeUp, async () => {
// debug
console.log('MainPage: 监听到唤醒事件，检查更新');
if (ifCheckUpdatesOnStart.value) {
    checkForUpdates();
}
});

//-================================
//-🧩 插件加载
//-================================
// import IPluginLoader from './core/plugin/PluginLoader';
// await IPluginLoader.Init().then(() => {
//     console.log('插件加载完成');
// }).catch((err) => {
//     console.error('插件加载失败', err);
// });

//-================================
//-🪟 主窗口准备就绪
//-================================
import { invoke } from '@tauri-apps/api/core';

invoke('main_window_ready');