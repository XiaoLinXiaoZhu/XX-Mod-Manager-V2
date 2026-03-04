/**
 * 设置数据
 * 使用新架构的服务和模块
 */

import { ref, type Ref } from 'vue';
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { defaultAppService } from "@/services/app-service";
import { defaultConfigService } from "@/services/config-service";
import { I18nLocaleList, type I18nLocale } from "@/modules/i18n";
import { type Theme, setTheme } from "@/assets/styles/styleController";

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

// 多目录设置数据类型
export interface SettingBarDataMulitiDir {
  name: string;
  dataRef: Ref<string[]>;
  type: 'multidir';
  displayName: string;
  description: string;
  t_displayName?: Record<string, string>;
  onChange?: (value: string[]) => string[];
}

const getSettingSectionData = () => {
  // 获取服务实例
  const appService = defaultAppService;
  const configService = defaultConfigService;
  
  // 获取配置状态
  const localConfig = configService.getState().localConfig;
  
  //- ========================== 常规设置 ========================== -//
  //-------------------- 语言 ------------------//
  let languageData: SettingBarData = {
    name: 'language',
    dataRef: ref(localConfig.language),
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
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, language: value as I18nLocale });
      }
      return value;
    }
  };

  //-------------------- 主题 ------------------//
  let themeData: SettingBarData = {
    name: 'theme',
    dataRef: ref(localConfig.theme),
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
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, theme: value as Theme });
      }
      return value;
    }
  };

  //-------------------- Mod 源文件夹 ------------------//
  let modSourceFoldersData: SettingBarDataMulitiDir = {
    name: 'modSourceFolders',
    dataRef: ref(localConfig.modSourceFolders),
    type: 'multidir',
    displayName: 'Mod Source Folders',
    description: 'Folders containing mod files',
    t_displayName: {
      "zh-CN": 'Mod 源文件夹',
      "en-US": 'Mod Source Folders'
    },
    onChange: (value: string[]) => {
      console.log('mod source folders changed:', value);
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, modSourceFolders: value });
      }
      return value;
    }
  };

  //-------------------- Mod 目标文件夹 ------------------//
  let modTargetFolderData: SettingBarData = {
    name: 'modTargetFolder',
    dataRef: ref(localConfig.modTargetFolder),
    type: 'input',
    displayName: 'Mod Target Folder',
    description: 'Target folder for mod installation',
    t_displayName: {
      "zh-CN": 'Mod 目标文件夹',
      "en-US": 'Mod Target Folder'
    },
    onChange: (value: any) => {
      console.log('mod target folder changed:', value);
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, modTargetFolder: value as string });
      }
      return value;
    }
  };

  //-------------------- 保持 Mod 名称作为文件夹名 ------------------//
  let keepModNameAsModFolderNameData: SettingBarData = {
    name: 'keepModNameAsModFolderName',
    dataRef: ref(localConfig.ifKeepModNameAsModFolderName),
    type: 'switch',
    displayName: 'Keep Mod Name as Folder Name',
    description: 'Use mod name as folder name when installing',
    t_displayName: {
      "zh-CN": '保持 Mod 名称作为文件夹名',
      "en-US": 'Keep Mod Name as Folder Name'
    },
    onChange: (value: any) => {
      console.log('keep mod name as folder name changed:', value);
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, ifKeepModNameAsModFolderName: value as boolean });
      }
      return value;
    }
  };

  //-------------------- 传统应用模式 ------------------//
  let traditionalApplyData: SettingBarData = {
    name: 'traditionalApply',
    dataRef: ref(localConfig.ifUseTraditionalApply),
    type: 'switch',
    displayName: 'Traditional Apply Mode',
    description: 'Use traditional file copying instead of symlinks',
    t_displayName: {
      "zh-CN": '传统应用模式',
      "en-US": 'Traditional Apply Mode'
    },
    onChange: (value: any) => {
      console.log('traditional apply changed:', value);
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, ifUseTraditionalApply: value as boolean });
      }
      return value;
    }
  };

  //-------------------- 仓库 ID ------------------//
  let repositoryIdData: SettingBarData = {
    name: 'repositoryId',
    dataRef: ref(localConfig.repositoryId),
    type: 'input',
    displayName: 'Repository ID',
    description: 'Current repository identifier',
    t_displayName: {
      "zh-CN": '仓库 ID',
      "en-US": 'Repository ID'
    },
    onChange: (value: any) => {
      console.log('repository ID changed:', value);
      if (localConfig) {
        configService.setLocalConfig({ ...localConfig, repositoryId: value as string });
      }
      return value;
    }
  };

  //-------------------- 刷新按钮 ------------------//
  let refreshData: SettingBarData = {
    name: 'refresh',
    dataRef: ref(null),
    type: 'button',
    displayName: 'Refresh',
    description: 'Refresh the current page',
    t_displayName: {
      "zh-CN": '刷新',
      "en-US": 'Refresh'
    },
    onChange: async (value: any) => {
      console.log('refresh clicked');
      try {
        const webview = getCurrentWebview();
        // 重新加载页面
        window.location.reload();
      } catch (error) {
        console.error('Failed to refresh:', error);
      }
      return value;
    }
  };

  return [
    languageData,
    themeData,
    modSourceFoldersData,
    modTargetFolderData,
    keepModNameAsModFolderNameData,
    traditionalApplyData,
    repositoryIdData,
    refreshData
  ];
};

export { getSettingSectionData };