/**
 * 设置系统兼容层
 * 提供向后兼容的设置 API
 */

import { createConfigService } from '@/services/config-service';
import type { ConfigService, GlobalConfig, LocalConfig } from '@/services/config-service';

// 创建默认的配置服务实例
const defaultConfigService = createConfigService();

/**
 * 兼容的设置管理器类
 * 提供与旧版本相同的 API
 */
export class SettingsManager {
  private configService: ConfigService;

  constructor() {
    this.configService = defaultConfigService;
  }

  /**
   * 获取全局配置
   */
  async getGlobalConfig(): Promise<GlobalConfig> {
    const result = await this.configService.getGlobalConfig();
    if (result.success) {
      return result.data;
    }
    throw new Error('Failed to get global config');
  }

  /**
   * 设置全局配置
   */
  async setGlobalConfig(config: Partial<GlobalConfig>): Promise<void> {
    const result = await this.configService.updateGlobalConfig(config);
    if (!result.success) {
      throw new Error('Failed to set global config');
    }
  }

  /**
   * 获取本地配置
   */
  async getLocalConfig(): Promise<LocalConfig> {
    const result = await this.configService.getLocalConfig();
    if (result.success) {
      return result.data;
    }
    throw new Error('Failed to get local config');
  }

  /**
   * 设置本地配置
   */
  async setLocalConfig(config: Partial<LocalConfig>): Promise<void> {
    const result = await this.configService.updateLocalConfig(config);
    if (!result.success) {
      throw new Error('Failed to set local config');
    }
  }
}

// 导出默认实例
export const settingsManager = new SettingsManager();
