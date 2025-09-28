/**
 * 配置保存器
 * 负责配置的保存和持久化
 */

import { 
  ConfigType, 
  ConfigValue, 
  GlobalConfig, 
  LocalConfig, 
  RepositoryConfig,
  ConfigServiceState,
  ConfigSaveOptions,
  ConfigChangeEvent,
  ConfigServiceEventType
} from './types';
import { Result, KernelError } from '@/kernels/types';
import { EventEmitter } from '@/kernels/event-system';

/**
 * 配置保存器类
 */
export class ConfigSaver {
  private state: ConfigServiceState;
  private eventEmitter: EventEmitter;
  private changeHistory: ConfigChangeEvent[] = [];

  constructor(state: ConfigServiceState, eventEmitter: EventEmitter) {
    this.state = state;
    this.eventEmitter = eventEmitter;
  }

  /**
   * 保存全局配置
   */
  async saveGlobalConfig(config: GlobalConfig, options: ConfigSaveOptions = {}): Promise<Result<void, KernelError>> {
    try {
      // 这里应该实现实际的全局配置保存逻辑
      // 目前只是模拟保存
      
      // 记录变更历史
      this.recordChange('global', 'global', config, options);
      
      this.state.globalConfig = { ...config };
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_SAVED, {
        type: 'global',
        key: 'global',
        value: config,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to save global config',
          'CONFIG_SAVE_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 保存本地配置
   */
  async saveLocalConfig(config: LocalConfig, options: ConfigSaveOptions = {}): Promise<Result<void, KernelError>> {
    try {
      // 这里应该实现实际的本地配置保存逻辑
      // 目前只是模拟保存
      
      // 记录变更历史
      this.recordChange('local', 'local', config, options);
      
      this.state.localConfig = { ...config };
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_SAVED, {
        type: 'local',
        key: 'local',
        value: config,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to save local config',
          'CONFIG_SAVE_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 保存仓库配置
   */
  async saveRepositoryConfig(repositoryId: string, config: RepositoryConfig, options: ConfigSaveOptions = {}): Promise<Result<void, KernelError>> {
    try {
      // 这里应该实现实际的仓库配置保存逻辑
      // 目前只是模拟保存
      
      // 记录变更历史
      this.recordChange('repository', repositoryId, config, options);
      
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_SAVED, {
        type: 'repository',
        key: repositoryId,
        value: config,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to save repository config',
          'CONFIG_SAVE_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 保存配置值
   */
  async saveConfigValue(
    type: ConfigType,
    key: string,
    value: ConfigValue,
    options: ConfigSaveOptions = {}
  ): Promise<Result<void, KernelError>> {
    try {
      // 这里应该实现实际的配置值保存逻辑
      // 目前只是模拟保存
      
      // 记录变更历史
      this.recordChange(type, key, value, options);
      
      this.state.lastUpdated = new Date().toISOString();

      // 触发事件
      this.eventEmitter.emit(ConfigServiceEventType.CONFIG_CHANGED, {
        type,
        key,
        value,
        timestamp: this.state.lastUpdated
      });

      return {
        success: true,
        data: undefined
      };
    } catch (error) {
      return {
        success: false,
        error: new KernelError(
          'Failed to save config value',
          'CONFIG_SAVE_ERROR',
          { error: error instanceof Error ? error.message : String(error) }
        )
      };
    }
  }

  /**
   * 记录配置变更
   */
  private recordChange(
    type: ConfigType,
    key: string,
    value: ConfigValue,
    options: ConfigSaveOptions
  ): void {
    const change: ConfigChangeEvent = {
      type,
      key,
      value,
      timestamp: new Date().toISOString(),
      source: options.source || 'user'
    };

    this.changeHistory.push(change);

    // 限制历史记录长度
    if (this.changeHistory.length > 1000) {
      this.changeHistory = this.changeHistory.slice(-1000);
    }
  }

  /**
   * 获取变更历史
   */
  getChangeHistory(): ConfigChangeEvent[] {
    return [...this.changeHistory];
  }

  /**
   * 清除变更历史
   */
  clearChangeHistory(): void {
    this.changeHistory = [];
  }
}
