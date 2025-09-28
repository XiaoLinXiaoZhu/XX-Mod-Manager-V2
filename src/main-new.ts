/**
 * 新的主入口文件
 * 基于四层架构的应用启动和组装点
 */

import 'sober';
import { createApp } from 'vue';
import App from './App.vue';
// 导入新架构的组件
import { TauriFileSystem, EventEmitter, EventType } from '@/kernels';
import { 
  createModService, 
  createAppService, 
  createConfigService, 
  createPluginService,
  createUiService,
  DEFAULT_MOD_SERVICE_CONFIG,
  DEFAULT_MOD_SERVICE_OPTIONS,
  DEFAULT_APP_CONFIG,
  DEFAULT_CONFIG_SERVICE_CONFIG,
  DEFAULT_PLUGIN_SERVICE_CONFIG,
  DEFAULT_UI_SERVICE_CONFIG,
  DEFAULT_UI_SERVICE_OPTIONS
} from '@/services';

// 导入 Tauri API
import { listen } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { getArgv, type Argv } from './shared/utils/Argv';
import * as path from '@tauri-apps/api/path';

// 导入新架构的模块
import { 
  getLocalizationValue, 
  createLanguagePack
} from '@/modules/i18n';
import { 
  validateRepositoryConfig
} from '@/modules/repository';
import { 
  validateVersionInfo
} from '@/modules/updater';

// 临时导入旧系统（将在后续迁移中移除）
import router from './features/router/index';
import { i18nInstance } from './compat/legacy-bridge';
import { GlobalConfig } from '@/compat/legacy-bridge';

// 使用兼容层替代旧的通知系统
import { $t_snack } from './compat/legacy-bridge';

/**
 * 应用初始化类
 * 负责应用的生命周期管理
 */
class AppInitializer {
  private isInitialized = false;
  private argv: Argv | null = null;
  
  // Kernel 层实例
  private fileSystem: TauriFileSystem;
  private eventSystem: EventEmitter;
  
  // Service 层实例
  private modService: any;
  private appService: any;
  private configService: any;
  private pluginService: any;
  private uiService: any;

  constructor() {
    // 创建 Kernel 层实例
    this.fileSystem = new TauriFileSystem();
    this.eventSystem = new EventEmitter();
    
    // 创建 Service 层实例
    this.modService = createModService(
      DEFAULT_MOD_SERVICE_CONFIG, 
      DEFAULT_MOD_SERVICE_OPTIONS, 
      this.fileSystem, 
      this.eventSystem
    );
    this.appService = createAppService(DEFAULT_APP_CONFIG);
    this.configService = createConfigService(DEFAULT_CONFIG_SERVICE_CONFIG);
    this.pluginService = createPluginService(DEFAULT_PLUGIN_SERVICE_CONFIG);
    this.uiService = createUiService(DEFAULT_UI_SERVICE_CONFIG, DEFAULT_UI_SERVICE_OPTIONS, this.eventSystem);
  }

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
      this.eventSystem.emit(EventType.APP_READY, { timestamp: new Date().toISOString() });

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
    // 初始化配置服务
    const configInitResult = await this.configService.initialize();
    if (!configInitResult.success) {
      throw new Error(`Failed to initialize config service: ${configInitResult.error.message}`);
    }

    // 从新架构的配置服务获取配置
    const modSourceFolders = (this.configService.getConfigValue('modSourceFolders', 'global') as string[]) || [];
    const modTargetFolder = (this.configService.getConfigValue('modTargetFolder', 'global') as string) || '';
    const keepModNameAsModFolderName = (this.configService.getConfigValue('ifKeepModNameAsModFolderName', 'global') as boolean) || false;
    const traditionalApply = (this.configService.getConfigValue('ifUseTraditionalApply', 'global') as boolean) || false;

    // 配置 Mod 服务
    const modServiceConfig = {
      modSourceFolders,
      modTargetFolder,
      keepModNameAsModFolderName,
      traditionalApply
    };

    this.modService.updateConfig(modServiceConfig);

    // 获取应用版本信息
    const versionResult = validateVersionInfo({ version: '2.0.0', build: '1', commit: 'unknown' });
    const version = versionResult.success ? versionResult.data.version : '2.0.0';

    // 配置应用服务
    const appServiceConfig = {
      version,
      environment: 'development' as const, // 这里应该从环境变量获取
      debug: true,
      autoUpdate: true,
      checkUpdatesOnStart: (this.configService.getConfigValue('checkUpdatesOnStart', 'global') as boolean) || true
    };

    this.appService.updateConfig(appServiceConfig);

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
      this.eventSystem.emit(EventType.APP_READY, { source: 'wake-up', event });
    });

    // 监听应用服务事件
    this.appService.on('app:ready', () => {
      // 使用新架构的国际化模块
      const languagePackResult = createLanguagePack('zh-CN', 'Chinese', '中文', {});
      if (languagePackResult.success) {
        const message = getLocalizationValue(
          'message.hello',
          languagePackResult.data
        );
        if (message.success) {
          $t_snack(message.data, "success");
        }
      }
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
      // 使用新架构的仓库模块
      // 这里应该从配置服务获取仓库列表
      const repoConfigs = (this.configService.getConfigValue('lastUsedGameRepo', 'global') as string[]) || [];
      
      if (repoConfigs.length > 0) {
        // 查找指定的仓库配置
        const repoConfigPath = repoConfigs.find((path: string) => path.includes(this.argv!.repo!));
        
        if (repoConfigPath) {
      // 使用新架构的仓库模块验证配置
      const repoConfigResult = validateRepositoryConfig({ path: repoConfigPath } as any);
          
          if (repoConfigResult.success) {
            // 更新配置服务中的当前仓库
            await this.configService.setConfigValue('lastUsedGameRepo', repoConfigPath, 'global');
            
            // 跳转到 modList 页面
            router.push({ name: 'modList' });
            
            console.log(`📁 Switched to repository: ${this.argv.repo}`);
          } else {
            console.warn('Failed to validate repository config:', repoConfigResult.error.message);
          }
        } else {
          console.warn('未找到指定的仓库:', this.argv.repo);
        }
      }
    } catch (error) {
      console.error('加载仓库配置失败:', error);
      const languagePackResult = createLanguagePack('zh-CN', 'Chinese', '中文', {});
      if (languagePackResult.success) {
        const errorMessage = getLocalizationValue(
          'message.loadRepoConfigFailed',
          languagePackResult.data
        );
        if (errorMessage.success) {
          $t_snack(errorMessage.data, 'error');
        }
      }
    }
  }

  /**
   * 获取应用状态
   */
  getAppState() {
    return {
      isInitialized: this.isInitialized,
      argv: this.argv,
      modService: this.modService.getState(),
      appService: this.appService.getState(),
      configService: this.configService.getState(),
      pluginService: this.pluginService.getState(),
      uiService: this.uiService.getState()
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
export { appInitializer };

// 通知 Tauri 主窗口准备就绪
invoke('main_window_ready');
