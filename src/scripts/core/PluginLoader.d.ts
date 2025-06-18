import { Ref } from "vue";
import type { IPlugin, IPluginData, ToolsConUsedInPluginType } from './PluginTypes';

/**
 * 插件加载器类
 */
/**
 * 插件加载器类
 * 
 * 这是一个静态类，负责管理所有插件的加载、初始化和配置。
 */
export declare class IPluginLoader {
    /**
     * 已加载的所有插件
     */
    public static plugins: { [key: string]: IPlugin };
    
    /**
     * 局部禁用的插件名称列表引用
     */
    public static localDisabledPluginNamesRef: Ref<string[]>;
    
    /**
     * 全局禁用的插件名称列表引用
     */
    public static globalDisabledPluginNamesRef: Ref<string[]>;
    
    /**
     * 插件配置数据
     */
    public static pluginConfig: { [key: string]: IPluginData[] };

    /**
     * 插件可用的环境工具
     */
    public static enviroment: ToolsConUsedInPluginType;

    /**
     * 插件加载文件夹路径获取函数数组
     */
    public static pluginLoadFolders: (() => string | Promise<string>)[];

    /**
     * 清空所有插件
     */
    public static clearAllPlugins(): void;

    /**
     * 初始化插件加载器
     */
    public static Init(): Promise<void>;

    /**
     * 加载禁用的插件列表
     */
    static LoadDisabledPlugins(): Promise<void>;

    /**
     * 禁用指定插件
     * @param pluginName 插件名称
     */
    static disablePlugin(pluginName: string): void;

    /**
     * 启用指定插件
     * @param pluginName 插件名称
     */
    static enablePlugin(pluginName: string): void;

    /**
     * 切换插件启用/禁用状态
     * @param pluginName 插件名称
     */
    static togglePlugin(pluginName: string): void;

    /**
     * 保存禁用的插件列表
     */
    static saveDisabledPlugins(): Promise<void>;

    /**
     * 注册一个插件
     * @param plugin 插件对象
     * @param enviroment 可用环境工具
     * @returns 是否注册成功
     */
    static RegisterPlugin(plugin: IPlugin, enviroment: ToolsConUsedInPluginType): Promise<boolean>;

    /**
     * 获取插件的外部配置
     * @param plugin 插件对象
     * @returns 插件的外部配置
     */
    static getPluginExternalConfig(plugin: IPlugin): Record<string, any>;

    /**
     * 初始化插件
     * @param plugin 插件对象
     * @param enviroment 可用环境工具
     * @returns 是否初始化成功
     */
    static initializePlugin(plugin: IPlugin, enviroment: any): boolean;

    /**
     * 注册插件配置
     * @param pluginName 插件名称
     * @param pluginConfig 插件配置
     */
    static RegisterPluginConfig(pluginName: string, pluginConfig: IPluginData[]): void;

    /**
     * 从指定文件夹加载插件
     * @param enviroment 可用环境工具
     * @param folder 文件夹路径
     */
    static LoadPluginsFromFolder(enviroment: any, folder: string): Promise<void>;

    /**
     * 加载所有插件
     * @param enviroment 可用环境工具
     */
    static LoadPlugins(enviroment: ToolsConUsedInPluginType): Promise<void>;

    /**
     * 将插件配置转换为可保存的格式
     * @param pluginConfig 插件配置
     * @returns 转换后的可保存格式
     */
    static transformPluginConfigToSave(pluginConfig: IPluginData[]): Record<string, any>;

    /**
     * 保存单个插件的配置
     * @param pluginName 插件名称
     * @param pluginData 插件配置数据
     */
    static SavePluginConfig(pluginName: string, pluginData: IPluginData[]): Promise<void>;

    /**
     * 异步保存所有插件的配置
     */
    static SaveAllPluginConfig(): Promise<void>;

    /**
     * 同步保存所有插件的配置，一般用于程序退出时
     */
    static SaveAllPluginConfigSync(): void;    /**
     * 获取插件数据
     * @param pluginName 插件名称
     * @param dataName 数据名称
     * @returns 插件数据
     */
    static GetPluginData(pluginName: string, dataName: string): any;

    /**
     * 获取插件数据的响应式引用
     * @param pluginName 插件名称
     * @param dataName 数据名称
     * @returns 插件数据的响应式引用
     */
    static GetPluginDataRef(pluginName: string, dataName: string): Ref<any> | undefined;

    /**
     * 设置插件数据
     * @param pluginName 插件名称
     * @param dataName 数据名称
     * @param value 数据值
     */
    static SetPluginData(pluginName: string, dataName: string, value: any): void;
}

/**
 * 默认导出插件加载器
 */
export default IPluginLoader;
