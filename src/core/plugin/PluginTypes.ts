import { TranslatedText } from "@/shared/types/local";
import { type SettingBarData } from "@/features/settings/settingBarConfig";
import { ToolsCanUsedInPlugin } from './ToolsCanUsedInPlugin';

/**
 * 可以在插件中使用的工具类型
 */
export type ToolsConUsedInPluginType = typeof ToolsCanUsedInPlugin;

/**
 * 插件配置数据类型
 */
export type IPluginData = SettingBarData;

/**
 * 插件接口定义
 */
export interface IPlugin {
    /**
     * 插件名称
     */
    name: string;
    
    /**
     * 插件显示名称，用于多语言支持
     */
    t_displayName?: TranslatedText;
    
    /**
     * 插件作用域
     * - global: 全局插件，影响所有项目
     * - local: 局部插件，只影响当前项目
     * - all: 同时影响全局和局部
     */
    scope: "global" | "local" | "all";
    
    /**
     * 插件初始化函数
     * @param enviroment 可以在插件中使用的工具
     */
    init: (enviroment: ToolsConUsedInPluginType) => void;
}
