/**
 * Tauri 应用入口文件
 * 使用新架构的服务和模块
 */

import 'sober';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

// 导入新架构的服务
import { defaultAppService } from '@/services/app-service';
import { defaultConfigService } from '@/services/config-service';
import { defaultModService } from '@/services/mod-service';
import { defaultPluginService } from '@/services/plugin-service';
import { defaultUiService } from '@/services/ui-service';

// 导入工具函数
import { getArgv, type Argv } from '@/kernels/utils';
import * as path from '@tauri-apps/api/path';
import { listen } from '@tauri-apps/api/event';

// 导入组件
import App from './App.vue';
import { createRouteConfig } from '@/modules/router';

// 禁用 tab 切换焦点
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
  }
});

// 初始化应用
async function initializeApp() {
  try {
    // 初始化服务（这些服务不需要显式初始化）
    // await defaultAppService.initialize();
    // await defaultConfigService.initialize();
    // await defaultModService.initialize();
    // await defaultPluginService.initialize();
    // await defaultUiService.initialize();

    // 获取命令行参数
    const argv: Argv = await getArgv();
    console.log('Application arguments:', argv);

    // 创建路由配置
    const routeConfig = createRouteConfig();
    const router = createRouter({
      history: createWebHistory(),
      routes: routeConfig
    });

    // 创建 Vue 应用
    const app = createApp(App);
    
    // 注册服务到全局属性
    (app.config.globalProperties as any)['$appService'] = defaultAppService;
    (app.config.globalProperties as any)['$configService'] = defaultConfigService;
    (app.config.globalProperties as any)['$modService'] = defaultModService;
    (app.config.globalProperties as any)['$pluginService'] = defaultPluginService;
    (app.config.globalProperties as any)['$uiService'] = defaultUiService;

    // 使用路由
    app.use(router);

    // 挂载应用
    app.mount('#app');

    // 设置事件监听器
    setupEventListeners();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// 设置事件监听器
function setupEventListeners() {
  // 监听 Tauri 事件
  listen('tauri://update-available', (event) => {
    console.log('Update available:', event.payload);
  });

  listen('tauri://update-download-progress', (event) => {
    console.log('Update download progress:', event.payload);
  });

  listen('tauri://update-downloaded', (event) => {
    console.log('Update downloaded:', event.payload);
  });

  // 监听应用事件
  defaultAppService.on('app:ready', () => {
    console.log('Application is ready');
  });

  defaultModService.on('mod:loaded', (data: any) => {
    console.log('Mod loaded:', data);
  });

  defaultConfigService.on('config:changed', (data: any) => {
    console.log('Config changed:', data);
  });
}

// 启动应用
initializeApp();