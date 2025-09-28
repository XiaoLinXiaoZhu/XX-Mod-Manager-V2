/**
 * 新的主入口文件
 * 基于四层架构的应用启动和组装点
 */

import 'sober';
import { createApp } from 'vue';
import App from './App.vue';
import router from './features/router/index';
import { i18nInstance } from './features/i18n/index.ts';

// 导入新架构的组件
import { defaultFileSystem, defaultEventSystem } from '@/kernels';
import { defaultModService, defaultAppService } from '@/services';
import { EventType } from '@/kernels';

// 导入 Tauri API
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getArgv, type Argv } from './shared/utils/Argv';
import * as path from '@tauri-apps/api/path';

// 导入现有的配置系统（临时）
import { GlobalConfig, useGlobalConfig } from '@/core/config/GlobalConfigLoader';
import { SubConfig } from './core/config/ConfigLoader';
import { repos, getRepos } from './features/repository/Repo.ts';
import { $t_snack } from './shared/composables/use-snack';

/**
 * 应用初始化类
 * 负责应用的生命周期管理
 */
class AppInitializer {
  private isInitialized = false;
  private argv: Argv | null = null;

  /**
   * 初始化应用
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 Starting XX-Mod-Manager V2.0 with new architecture...');

      // 1. 解析命令行参数
      await this.parseArgv();

      // 2. 加载全局配置
      await this.loadGlobalConfig();

      // 3. 初始化内核层
      await this.initializeKernels();

      // 4. 初始化服务层
      await this.initializeServices();

      // 5. 设置事件监听器
      await this.setupEventListeners();

      // 6. 初始化 Vue 应用
      await this.initializeVueApp();

      // 7. 处理命令行参数
      await this.handleArgv();

      // 8. 标记为已初始化
      this.isInitialized = true;

      // 9. 发射初始化完成事件
      defaultEventSystem.emit(EventType.APP_READY);

      console.log('✅ XX-Mod-Manager V2.0 initialized successfully!');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      throw error;
    }
  }

  /**
   * 解析命令行参数
   */
  private async parseArgv(): Promise<void> {
    this.argv = await getArgv();
    console.log('📋 Command line arguments:', this.argv);
  }

  /**
   * 加载全局配置
   */
  private async loadGlobalConfig(): Promise<void> {
    if (this.argv?.custom_config_folder) {
      await GlobalConfig.loadFrom(await path.resolve(".\\"));
    } else {
      await GlobalConfig.loadDefaultConfig();
    }
    console.log('⚙️ Global configuration loaded');
  }

  /**
   * 初始化内核层
   */
  private async initializeKernels(): Promise<void> {
    // 内核层已经在导入时自动初始化
    console.log('🔧 Kernel layer initialized');
  }

  /**
   * 初始化服务层
   */
  private async initializeServices(): Promise<void> {
    // 配置 Mod 服务
    const modServiceConfig = {
      modSourceFolders: GlobalConfig.modSourceFolders.value,
      modTargetFolder: GlobalConfig.modTargetFolder.value,
      keepModNameAsModFolderName: GlobalConfig.ifKeepModNameAsModFolderName.value,
      traditionalApply: GlobalConfig.ifUseTraditionalApply.value
    };

    defaultModService.updateConfig(modServiceConfig);

    // 配置应用服务
    const appServiceConfig = {
      version: '2.0.0',
      environment: 'development', // 这里应该从环境变量获取
      debug: true,
      autoUpdate: true,
      checkUpdatesOnStart: GlobalConfig.checkUpdatesOnStart.value
    };

    defaultAppService.updateConfig(appServiceConfig);

    console.log('🎯 Services initialized');
  }

  /**
   * 设置事件监听器
   */
  private async setupEventListeners(): Promise<void> {
    // 禁用 tab 切换焦点
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
      }
    });

    // 禁用右键菜单
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // 禁用 webview 默认拖拽
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
    }, false);

    window.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        console.log('用户拖入了文件:', [...e.dataTransfer.files]);
      }
    }, false);

    // 监听 Tauri 事件
    listen('wake-up', (event) => {
      console.log('wakeUp event received', event);
      defaultEventSystem.emit(EventType.APP_READY);
    });

    // 监听应用服务事件
    defaultAppService.on('app:ready', () => {
      $t_snack("message.hello", "success");
    });

    console.log('👂 Event listeners set up');
  }

  /**
   * 初始化 Vue 应用
   */
  private async initializeVueApp(): Promise<void> {
    const vueApp = createApp(App);
    vueApp.use(router);
    vueApp.use(i18nInstance);
    vueApp.mount('#app');

    console.log('🎨 Vue application initialized');
  }

  /**
   * 处理命令行参数
   */
  private async handleArgv(): Promise<void> {
    if (!this.argv?.repo) {
      return;
    }

    try {
      // 确保仓库列表已加载
      await getRepos();
      
      if (repos && repos.value.length > 0) {
        // 找到名称对应的仓库
        const repo = repos.value.find(r => r.name === this.argv!.repo);
        if (repo) {
          const lastUsedGameRepo = GlobalConfig.lastUsedGameRepo;
          lastUsedGameRepo.value = repo.configLocation;

          // 加载仓库配置
          await SubConfig.loadFrom(repo.configLocation);
          
          // 跳转到 modList 页面
          router.push({ name: 'modList' });
          
          console.log(`📁 Switched to repository: ${repo.name}`);
        } else {
          console.warn('未找到指定的仓库:', this.argv.repo);
        }
      }
    } catch (error) {
      console.error('加载仓库配置失败:', error);
      $t_snack('message.loadRepoConfigFailed', 'error');
    }
  }

  /**
   * 获取应用状态
   */
  getAppState() {
    return {
      isInitialized: this.isInitialized,
      argv: this.argv,
      modService: defaultModService.getState(),
      appService: defaultAppService.getState()
    };
  }
}

// 创建应用初始化器实例
const appInitializer = new AppInitializer();

// 启动应用
appInitializer.initialize()
  .then(() => {
    console.log('🎉 Application started successfully!');
  })
  .catch((error) => {
    console.error('💥 Application failed to start:', error);
  });

// 导出给调试使用
export { appInitializer, defaultModService, defaultAppService };

// 通知 Tauri 主窗口准备就绪
invoke('main_window_ready');
