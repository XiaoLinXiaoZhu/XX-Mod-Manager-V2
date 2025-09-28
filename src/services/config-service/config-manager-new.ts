/**
 * 配置管理器
 * 提供配置管理的核心功能
 */

import { 
  ConfigType, 
  ConfigValue, 
  GlobalConfig, 
  LocalConfig, 
  RepositoryConfig,
  ConfigServiceState,
  ConfigServiceOptions,
  ConfigLoadOptions,
  ConfigSaveOptions,
  ConfigValidationResult,
  ConfigServiceEventType,
  ConfigStatistics,
  DEFAULT_GLOBAL_CONFIG,
  DEFAULT_LOCAL_CONFIG,
  DEFAULT_CONFIG_SERVICE_OPTIONS
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';
import { ConfigLoader } from './config-loader';
import { ConfigSaver } from './config-saver';

/**
 * 配置服务类
 */
export class ConfigService {
  private state: ConfigServiceState;
  private options: ConfigServiceOptions;
  private eventEmitter: EventEmitter;
  private configLoader: ConfigLoader;
  private configSaver: ConfigSaver;
  private errorCount = 0;

  constructor(options: ConfigServiceOptions = DEFAULT_CONFIG_SERVICE_OPTIONS) {
    this.options = { ...DEFAULT_CONFIG_SERVICE_OPTIONS, ...options };
    this.eventEmitter = new EventEmitter();
    
    this.state = {
      globalConfig: { ...DEFAULT_GLOBAL_CONFIG },
      localConfig: null,
      currentRepository: null,
      isInitialized: false,
      lastUpdated: new Date().toISOString()
    };

    // 初始化子组件
    this.configLoader = new ConfigLoader(this.state, this.eventEmitter);
    this.configSaver = new ConfigSaver(this.state, this.eventEmitter);
  }

  /**
   * 初始化配置服务
   */
  async initialize(): Promise<Result<void, KernelError>> {
    try {
      // 加载全局配置
      const globalResult = await this.configLoader.loadGlobalConfig();
      if (!globalResult.success) {
        return globalResult;
      }

      this.state.isInitialized = true;
      this.state.lastUpdated = new Date().toISOString();
      
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_LOADED, {
        type: 'global',
        config: this.state.globalConfig
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      this.errorCount++;
      const kernelError = new KernelError(
        'Failed to initialize config service',
        'CONFIG_INIT_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
      
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_ERROR, {
        code: kernelError.code,
        message: kernelError.message,
        context: kernelError.context,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: kernelError
      };
    }
  }

  /**
   * 获取配置值
   */
  getConfigValue<T extends ConfigValue>(
    key: keyof GlobalConfig | keyof LocalConfig | keyof RepositoryConfig,
    type: ConfigType = 'global'
  ): T | undefined {
    switch (type) {
      case 'global':
        return this.state.globalConfig[key as keyof GlobalConfig] as T;
      case 'local':
        return this.state.localConfig?.[key as keyof LocalConfig] as T;
      case 'repository':
        // 这里需要根据当前仓库获取配置
        return undefined;
      default:
        return undefined;
    }
  }

  /**
   * 设置配置值
   */
  async setConfigValue<T extends ConfigValue>(
    key: keyof GlobalConfig | keyof LocalConfig | keyof RepositoryConfig,
    value: T,
    type: ConfigType = 'global',
    options: ConfigSaveOptions = {}
  ): Promise<Result<void, KernelError>> {
    try {
      // 验证值
      if (options.validate !== false) {
        const validation = this.validateConfigValue(key, value, type);
        if (!validation.isValid) {
          return {
            success: false,
            error: new KernelError(
              'Config value validation failed',
              'CONFIG_VALIDATION_ERROR',
              { errors: validation.errors }
            )
          };
        }
      }

      // 更新状态
      switch (type) {
        case 'global':
          (this.state.globalConfig as any)[key] = value;
          break;
        case 'local':
          if (!this.state.localConfig) {
            this.state.localConfig = { ...DEFAULT_LOCAL_CONFIG };
          }
          (this.state.localConfig as any)[key] = value;
          break;
        case 'repository':
          // 这里需要根据当前仓库更新配置
          break;
      }

      // 保存配置
      return await this.configSaver.saveConfigValue(type, key as string, value, options);
    } catch (error) {
      this.errorCount++;
      return {
        success: false,
        error: new KernelError(
          'Failed to set config value',
          'CONFIG_SET_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(type: ConfigType, repositoryId?: string, options: ConfigLoadOptions = {}): Promise<Result<any, KernelError>> {
    switch (type) {
      case 'global':
        return await this.configLoader.loadGlobalConfig(options);
      case 'local':
        if (!repositoryId) {
          return {
            success: false,
            error: new KernelError(
              'Repository ID is required for local config',
              'MISSING_REPOSITORY_ID'
            )
          };
        }
        return await this.configLoader.loadLocalConfig(repositoryId, options);
      case 'repository':
        if (!repositoryId) {
          return {
            success: false,
            error: new KernelError(
              'Repository ID is required for repository config',
              'MISSING_REPOSITORY_ID'
            )
          };
        }
        return await this.configLoader.loadRepositoryConfig(repositoryId, options);
      default:
        return {
          success: false,
          error: new KernelError(
            'Invalid config type',
            'INVALID_CONFIG_TYPE',
            { type }
          )
        };
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(
    type: ConfigType,
    config: GlobalConfig | LocalConfig | RepositoryConfig,
    options: ConfigSaveOptions = {}
  ): Promise<Result<void, KernelError>> {
    switch (type) {
      case 'global':
        return await this.configSaver.saveGlobalConfig(config as GlobalConfig, options);
      case 'local':
        return await this.configSaver.saveLocalConfig(config as LocalConfig, options);
      case 'repository':
        if (!this.state.currentRepository) {
          return {
            success: false,
            error: new KernelError(
              'No current repository set',
              'NO_CURRENT_REPOSITORY'
            )
          };
        }
        return await this.configSaver.saveRepositoryConfig(this.state.currentRepository, config as RepositoryConfig, options);
      default:
        return {
          success: false,
          error: new KernelError(
            'Invalid config type',
            'INVALID_CONFIG_TYPE',
            { type }
          )
        };
    }
  }

  /**
   * 验证配置值
   */
  private validateConfigValue(
    _key: string,
    _value: ConfigValue,
    _type: ConfigType
  ): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 这里应该实现具体的验证逻辑
    // 目前只是基本的类型检查

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 获取当前状态
   */
  getState(): ConfigServiceState {
    return { ...this.state };
  }

  /**
   * 获取统计信息
   */
  getStatistics(): ConfigStatistics {
    return {
      totalConfigs: 3, // global, local, repository
      errorCount: this.errorCount,
      changeHistoryLength: this.configSaver.getChangeHistory().length
    };
  }

  /**
   * 事件管理
   */
  on(event: string, listener: (...args: any[]) => void): () => void {
    this.eventEmitter.on(event, listener);
    return () => this.eventEmitter.off(event, listener);
  }

  off(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  emit(event: string, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
  }
}

/**
 * 创建配置服务实例
 */
export function createConfigService(options: ConfigServiceOptions = DEFAULT_CONFIG_SERVICE_OPTIONS): ConfigService {
  return new ConfigService(options);
}
