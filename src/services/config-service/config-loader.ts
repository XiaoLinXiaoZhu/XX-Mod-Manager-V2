/**
 * 配置加载器
 * 负责配置的加载和初始化
 */

import { 
  ConfigType, 
  ConfigValue, 
  GlobalConfig, 
  LocalConfig, 
  RepositoryConfig,
  ConfigServiceState,
  ConfigLoadOptions,
  ConfigValidationResult,
  DEFAULT_GLOBAL_CONFIG,
  DEFAULT_LOCAL_CONFIG
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';

/**
 * 配置加载器类
 */
export class ConfigLoader {
  private state: ConfigServiceState;
  private eventEmitter: EventEmitter;

  constructor(state: ConfigServiceState, eventEmitter: EventEmitter) {
    this.state = state;
    this.eventEmitter = eventEmitter;
  }

  /**
   * 加载全局配置
   */
  async loadGlobalConfig(options: ConfigLoadOptions = {}): Promise<Result<GlobalConfig, KernelError>> {
    try {
      // 这里应该实现实际的全局配置加载逻辑
      // 目前返回默认配置
      const config = { ...DEFAULT_GLOBAL_CONFIG };
      
      // 验证配置
      if (options.validate !== false) {
        const validation = this.validateGlobalConfig(config);
        if (!validation.isValid) {
          return {
            success: false,
            error: new KernelError(
              'Global config validation failed',
              'CONFIG_VALIDATION_ERROR',
              { errors: validation.errors }
            )
          };
        }
      }

      this.state.globalConfig = config;
      this.state.lastUpdated = new Date().toISOString();

      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to load global config',
          'CONFIG_LOAD_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 加载本地配置
   */
  async loadLocalConfig(repositoryId: string, options: ConfigLoadOptions = {}): Promise<Result<LocalConfig, KernelError>> {
    try {
      // 这里应该实现实际的本地配置加载逻辑
      // 目前返回默认配置
      const config = { ...DEFAULT_LOCAL_CONFIG };
      
      // 验证配置
      if (options.validate !== false) {
        const validation = this.validateLocalConfig(config);
        if (!validation.isValid) {
          return {
            success: false,
            error: new KernelError(
              'Local config validation failed',
              'CONFIG_VALIDATION_ERROR',
              { errors: validation.errors }
            )
          };
        }
      }

      this.state.localConfig = config;
      this.state.currentRepository = repositoryId;
      this.state.lastUpdated = new Date().toISOString();

      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to load local config',
          'CONFIG_LOAD_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 加载仓库配置
   */
  async loadRepositoryConfig(repositoryId: string, options: ConfigLoadOptions = {}): Promise<Result<RepositoryConfig, KernelError>> {
    try {
      // 这里应该实现实际的仓库配置加载逻辑
      // 目前返回一个占位符配置
      const config: RepositoryConfig = {
        name: `Repository ${repositoryId}`,
        modSourceFolders: [],
        modTargetFolder: '',
        settings: {}
      };
      
      // 验证配置
      if (options.validate !== false) {
        const validation = this.validateRepositoryConfig(config);
        if (!validation.isValid) {
          return {
            success: false,
            error: new KernelError(
              'Repository config validation failed',
              'CONFIG_VALIDATION_ERROR',
              { errors: validation.errors }
            )
          };
        }
      }

      this.state.lastUpdated = new Date().toISOString();

      return {
        success: true,
        data: config
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to load repository config',
          'CONFIG_LOAD_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 验证全局配置
   */
  private validateGlobalConfig(config: GlobalConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!config.version || typeof config.version !== 'string') {
      errors.push('Version is required and must be a string');
    }

    if (!config.language || typeof config.language !== 'string') {
      errors.push('Language is required and must be a string');
    }

    if (!config.theme || !['light', 'dark', 'auto'].includes(config.theme)) {
      errors.push('Theme must be one of: light, dark, auto');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证本地配置
   */
  private validateLocalConfig(config: LocalConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!config.repositoryId || typeof config.repositoryId !== 'string') {
      errors.push('Repository ID is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 验证仓库配置
   */
  private validateRepositoryConfig(config: RepositoryConfig): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证必需字段
    if (!config.name || typeof config.name !== 'string') {
      errors.push('Repository name is required and must be a string');
    }

    if (!Array.isArray(config.modSourceFolders)) {
      errors.push('Mod source folders must be an array');
    }

    if (!config.modTargetFolder || typeof config.modTargetFolder !== 'string') {
      errors.push('Mod target folder is required and must be a string');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}
