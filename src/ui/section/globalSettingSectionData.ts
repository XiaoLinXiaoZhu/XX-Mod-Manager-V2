/**
 * 全局设置数据
 * 使用新架构的服务和模块
 */

import { ref, type Ref } from "vue";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { defaultAppService } from "@/services/app-service";
import { defaultConfigService } from "@/services/config-service";
import { I18nLocaleList, type I18nLocale } from "@/modules/i18n";
import { setTheme, type Theme } from "@/assets/styles/styleController";

// 设置项数据类型
export interface SettingBarData {
  name: string;
  dataRef: Ref<any>;
  type: 'select' | 'input' | 'switch' | 'button';
  displayName: string;
  description: string;
  t_displayName?: Record<string, string>;
  options?: Array<{
    value: any;
    t_value?: Record<string, string>;
  }>;
  onChange?: (value: any) => any;
}

const getSettingSectionData = () => {
  // 获取服务实例
  const appService = defaultAppService;
  const configService = defaultConfigService;
  
  // 获取配置状态
  const globalConfig = configService.getState().globalConfig;
  
  //- ========================== 常规设置 ========================== -//
  //-------------------- 语言 ------------------//
  let languageData: SettingBarData = {
    name: 'language',
    dataRef: ref(globalConfig.language),
    type: 'select',
    displayName: 'Language',
    description: '',
    t_displayName: {
      "zh-CN": '语言',
      "en-US": 'Language'
    },
    options: [{
      value: 'en-US',
      t_value: {
        "zh-CN": 'English',
        "en-US": 'English'
      }
    },
    {
      value: 'zh-CN',
      t_value: {
        "zh-CN": '简体中文',
        "en-US": '简体中文'
      }
    }
    ],
    onChange: (value: any) => {
      console.log('language changed:', value);
      // 检查 value 是否为有效的语言代码
      if (!I18nLocaleList.includes(value as I18nLocale)) {
        console.error(`Invalid language code: ${value}`);
        return 'en-US'; // 如果无效，返回默认语言
      }
      
      // 更新配置
      configService.updateGlobalConfig({ language: value as I18nLocale });
      return value;
    }
  };

  //-------------------- 主题 ------------------//
  let themeData: SettingBarData = {
    name: 'theme',
    dataRef: ref(globalConfig.theme),
    type: 'select',
    displayName: 'Theme',
    description: '',
    t_displayName: {
      "zh-CN": '主题',
      "en-US": 'Theme'
    },
    options: [{
      value: 'light',
      t_value: {
        "zh-CN": '浅色',
        "en-US": 'Light'
      }
    },
    {
      value: 'dark',
      t_value: {
        "zh-CN": '深色',
        "en-US": 'Dark'
      }
    }
    ],
    onChange: (value: any) => {
      console.log('theme changed:', value);
      setTheme(value as Theme);
      configService.updateGlobalConfig({ theme: value as Theme });
      return value;
    }
  };

  //-------------------- 调试模式 ------------------//
  let debugData: SettingBarData = {
    name: 'debug',
    dataRef: ref(globalConfig.debug),
    type: 'switch',
    displayName: 'Debug Mode',
    description: 'Enable debug logging and development features',
    t_displayName: {
      "zh-CN": '调试模式',
      "en-US": 'Debug Mode'
    },
    onChange: (value: any) => {
      console.log('debug mode changed:', value);
      configService.updateGlobalConfig({ debug: value as boolean });
      return value;
    }
  };

  //-------------------- 自动更新 ------------------//
  let autoUpdateData: SettingBarData = {
    name: 'autoUpdate',
    dataRef: ref(globalConfig.autoUpdate),
    type: 'switch',
    displayName: 'Auto Update',
    description: 'Automatically check for and install updates',
    t_displayName: {
      "zh-CN": '自动更新',
      "en-US": 'Auto Update'
    },
    onChange: (value: any) => {
      console.log('auto update changed:', value);
      configService.updateGlobalConfig({ autoUpdate: value as boolean });
      return value;
    }
  };

  //-------------------- 启动时检查更新 ------------------//
  let checkUpdatesOnStartData: SettingBarData = {
    name: 'checkUpdatesOnStart',
    dataRef: ref(globalConfig.checkUpdatesOnStart),
    type: 'switch',
    displayName: 'Check Updates on Start',
    description: 'Check for updates when the application starts',
    t_displayName: {
      "zh-CN": '启动时检查更新',
      "en-US": 'Check Updates on Start'
    },
    onChange: (value: any) => {
      console.log('check updates on start changed:', value);
      configService.updateGlobalConfig({ checkUpdatesOnStart: value as boolean });
      return value;
    }
  };

  return [
    languageData,
    themeData,
    debugData,
    autoUpdateData,
    checkUpdatesOnStartData
  ];
};

export { getSettingSectionData };