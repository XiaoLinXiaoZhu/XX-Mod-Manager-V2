//-===================== 插件 =====================
import { snack } from "../../shared/composables/use-snack";
import { $t, getTranslatedText } from "../../features/i18n";

import { ToolsCanUsedInPlugin } from './ToolsCanUsedInPlugin';
import { appDataDir } from "@tauri-apps/api/path";
import { useConfig } from "../config/ConfigLoader";
import { useGlobalConfig } from "../config/GlobalConfigLoader";
import { ref, Ref } from "vue";

// 从类型定义文件导入类型
import type { IPlugin, IPluginData, ToolsConUsedInPluginType } from './PluginTypes';
import { join } from "@tauri-apps/api/path";
import { globalServiceContainer } from "../../shared/services/ServiceContainer";
import { EventSystem, EventType } from "../event/EventSystem";
import { loadExternScript } from "../../shared/services/LoadExternScript";
import { currentPage } from "../XXMMState";


// 导出自 PluginTypes.ts 的类型
export type { IPlugin, IPluginData, ToolsConUsedInPluginType };

// 插件加载器类
export class IPluginLoader {
    public static plugins: { [key: string]: IPlugin } = {};
    public static localDisabledPluginNamesRef: Ref<string[]> = ref<string[]>([]);
    public static globalDisabledPluginNamesRef: Ref<string[]> = ref<string[]>([]);
    public static pluginConfig: { [key: string]: IPluginData[] } = {};

    // environment 是一个工具类，提供了一些工具函数给插件使用
    public static enviroment: ToolsConUsedInPluginType = ToolsCanUsedInPlugin;

    public static pluginLoadFolders: Array<() => Promise<string>> = [
        async () => {
            // 本地插件
            if (!await globalServiceContainer.fs.checkDirectoryExists('plugins')) {
                await globalServiceContainer.fs.createDirectory('plugins');
            }
            const localPluginPath = await globalServiceContainer.fs.getFullPath('plugins');
            console.log(`Local plugin path: ${localPluginPath}`);
            return localPluginPath;
        },
        async () => {
            // 全局插件
            const globalPluginPath = await join(await appDataDir(), 'plugins');
            if (!await globalServiceContainer.fs.checkDirectoryExists(globalPluginPath)) {
                await globalServiceContainer.fs.createDirectory(globalPluginPath);
            }
            console.log(`User data path: ${globalPluginPath}`);
            return globalPluginPath;
        }
    ];

    //-============= 自身初始化 =============-//
    public static clearAllPlugins() {
        IPluginLoader.plugins = {};
        IPluginLoader.pluginConfig = {};
    }

    public static async Init() {
        IPluginLoader.clearAllPlugins(); // 清空所有插件    

        // 加载禁用的插件
        await IPluginLoader.LoadDisabledPlugins();
        // 加载所有插件
        await IPluginLoader.LoadPlugins(this.enviroment);
        // debug
        console.log('IPluginLoader init finished');

        // 触发插件加载完成事件
        await EventSystem.trigger(EventType.pluginLoaded);
    }

    static async LoadDisabledPlugins() {
        // 这里要组合起来：从 局部配置 和 全局配置 中获取禁用的插件
        if (currentPage.value === 'modListPage') {
            IPluginLoader.localDisabledPluginNamesRef = useConfig("disabledPlugins", [] as string[], false).refImpl;
            IPluginLoader.globalDisabledPluginNamesRef = useGlobalConfig("disabledPlugins", [] as string[]).refImpl;
        }
        if (currentPage.value === 'gamePage') {
            // 只加载全局禁用的插件
            IPluginLoader.globalDisabledPluginNamesRef.value = useGlobalConfig('disabledPlugins', []).value;
        }
        // debug
        console.log('disabledPluginNames:', IPluginLoader.localDisabledPluginNamesRef.value, IPluginLoader.globalDisabledPluginNamesRef.value);
    }

    //-============= 方法 =============-//

    static disablePlugin(pluginName: string) {
        IPluginLoader.localDisabledPluginNamesRef.value.push(pluginName);
        EventSystem.trigger(EventType.pluginDisabled, pluginName);
        IPluginLoader.saveDisabledPlugins();
    }

    static enablePlugin(pluginName: string) {
        // 只有全局没有被禁用的插件，才能被启用
        if (IPluginLoader.globalDisabledPluginNamesRef.value.includes(pluginName)) {
            snack($t('plugin.error.canNotEnablePluginDisabledInGlobal'), "error");
            return;
        }
        let index = IPluginLoader.localDisabledPluginNamesRef.value.indexOf(pluginName);
        if (index !== -1) {
            IPluginLoader.localDisabledPluginNamesRef.value.splice(index, 1);
            EventSystem.trigger(EventType.pluginEnabled, pluginName);
            IPluginLoader.saveDisabledPlugins();
        }
    }

    static togglePlugin(pluginName: string) {
        if (IPluginLoader.localDisabledPluginNamesRef.value.includes(pluginName)) {
            IPluginLoader.enablePlugin(pluginName);
        } else {
            IPluginLoader.disablePlugin(pluginName);
        }
    }

    static async saveDisabledPlugins() {
        // ipcRenderer.invoke('save-disabled-plugins', IPluginLoader.disabledPluginNames);
        // XXMMCore.saveDisabledPlugins(IPluginLoader.disabledPluginNames);
        // 这里改用了ref，应该是自动保存的。
        console.log('Saving disabled plugins:', IPluginLoader.localDisabledPluginNamesRef.value, IPluginLoader.globalDisabledPluginNamesRef.value);
    }

    //-============= 插件注册 =============-//

    static CheckIfPluginCanBeEnabled(plugin: IPlugin): boolean {
        // 当插件的 scope 为 'all' 时，根据当前页面决定根据是否全局禁用或本地禁用插件
        // 当插件的 scope 为 'local' ， 只有当当前页面是 modList 时，且 全局和本地都没有禁用该插件时，才会启用插件
        // 当插件的 scope 为 'global' ， 只有当当前页面是 gamePage 时，且 全局没有禁用该插件时，才会启用插件
        const t_pluginName = plugin.t_displayName ? getTranslatedText(plugin.t_displayName) : plugin.name;
        console.log('Checking if plugin can be enabled:', t_pluginName, plugin.scope);
        const ifContainInGlobalDisabled = IPluginLoader.globalDisabledPluginNamesRef.value.includes(plugin.name);
        const ifContainInLocalDisabled = IPluginLoader.localDisabledPluginNamesRef.value.includes(plugin.name);

        console.log('ifContainInGlobalDisabled:', ifContainInGlobalDisabled, 'ifContainInLocalDisabled:', ifContainInLocalDisabled, "\ncurrentPage",currentPage.value, "plugin.scope", plugin.scope);

        if (plugin.scope === undefined) {
            return false;
        }
        if (plugin.scope === 'all') {
            // 如果是 all 的插件
            // 如果现在是 modList 页面，则需要根据全局和本地禁用列表来决定是否启用插件
            if (currentPage.value === 'modListPage') {
                if (ifContainInGlobalDisabled) {
                    console.log($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }), "info");
                    return false; // 如果全局禁用，则不启用
                }
                if (ifContainInLocalDisabled) {
                    console.log($t("plugin.error.disabledInLocal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInLocal", { pluginName: t_pluginName }), "info");
                    return false; // 如果本地禁用，则不启用
                }
                return true; // 否则启用
            }
            if (currentPage.value === 'gamePage') {
                // 如果现在是 gamePage 页面，则只需要根据全局禁用列表来决定是否启用插件
                if (ifContainInGlobalDisabled) {
                    console.log($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }), "info");
                    return false; // 如果全局禁用，则不启用
                }
                return true; // 否则启用
            }
            return false; // 如果不是 modList 或 gamePage 页面，则不启用插件
        }
        if (plugin.scope === 'local') {
            // 如果是 local 的插件
            // 只有当当前页面是 modList 时，且 全局和本地都没有禁用该插件时，才会启用插件
            if (currentPage.value === 'modListPage') {
                if (ifContainInGlobalDisabled) {
                    console.log($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }), "info");
                    return false; // 如果全局或本地禁用，则不启用
                }
                if (ifContainInLocalDisabled) {
                    console.log($t("plugin.error.disabledInLocal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInLocal", { pluginName: t_pluginName }), "info");
                    return false; // 如果本地禁用，则不启用
                }
                return true; // 否则启用
            }
            // debug
            return false; // 如果不是 modList 页面，则不启用插件
        }
        if (plugin.scope === 'global') {
            // 如果是 global 的插件
            // 只有当当前页面是 gamePage 时，且 全局没有禁用该插件时，才会启用插件
            if (currentPage.value === 'gamePage') {
                if (ifContainInGlobalDisabled) {
                    console.log($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }));
                    snack($t("plugin.error.disabledInGlobal", { pluginName: t_pluginName }), "info");
                    return false; // 如果全局禁用，则不启用
                }
                return true; // 否则启用
            }
            return false; // 如果不是 gamePage 页面，则不启用插件
        }

        return false; // 如果插件的作用域不是 all、local 或 global，则不启用插件
    }

    /** @function
     * @desc 注册一个插件
     * @param {IPlugin} plugin - 插件
     * @param {ToolsConUsedInPluginType} enviroment
     * 这里使用 enviroment 是为了 避免循环引用
     * @returns {boolean}
     */
    static async RegisterPlugin(plugin: IPlugin, enviroment: ToolsConUsedInPluginType): Promise<boolean> {
        IPluginLoader.plugins[plugin.name] = plugin;

        const t_pluginName = plugin.t_displayName ? getTranslatedText(plugin.t_displayName) : plugin.name;

        if (!await IPluginLoader.CheckIfPluginCanBeEnabled(plugin)) {
            // ❗️插件 {pluginName} 已被禁用，无法注册
            return false;
        }

        if (plugin.init !== undefined) {
            if (!IPluginLoader.initializePlugin(plugin, enviroment)) {
                return false;
            }
            console.log($t("plugin.info.initialized", { pluginName: t_pluginName }));
        }

        // 检测是否有本地配置
        const externalPluginConfig = this.getPluginExternalConfig(plugin);
        if (externalPluginConfig) {
            if (IPluginLoader.pluginConfig[plugin.name] === undefined) {
                IPluginLoader.pluginConfig[plugin.name] = [];
            }
            IPluginLoader.pluginConfig[plugin.name].forEach((data) => {
                if (data.name && externalPluginConfig[data.name] !== undefined) {
                    data.dataRef.value = externalPluginConfig[data.name];
                }
            });
            const tt = $t('plugin.info.loadedWithLocalData', { pluginName: t_pluginName });
            snack(tt, "info");
            console.log(tt, IPluginLoader.pluginConfig[plugin.name]);
        }
        return true;
    }

    /** @function
     * @desc 获取插件的本地配置
     * @param {string} pluginName - 插件名称
     * @returns {IPluginData[] | undefined} - 插件的本地配置，如果没有则返回undefined
     */
    static getPluginExternalConfig(plugin: IPlugin): Record<string, any> {
        // 因为实际存储的时候只会储存 data，所以这里从 IPlugin 中获取 定义范围
        if (plugin.scope === 'local') {
            return useConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
        }
        if (plugin.scope === 'global') {
            return useGlobalConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
        }
        // 如果是all的插件，则使用 local 中不为空的值覆盖 global 中的值
        if (plugin.scope === 'all') {
            const localConfig = useConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
            const globalConfig = useGlobalConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
            return { ...globalConfig, ...localConfig };
        }
        // plugin.scope 不是 local 或 global 或 all 的情况
        console.warn(`Plugin ${plugin.name} has an invalid scope: ${plugin.scope}. Defaulting to empty object.`);
        return {};
    }

    /** @function
     * @desc 初始化一个插件
     * @param {IPlugin} plugin - 插件
     * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
     * 这里使用 enviroment 是为了 避免循环引用
     * @returns {boolen}
     */
    static initializePlugin(plugin: IPlugin, enviroment: any): boolean {
        try {
            plugin.init(enviroment);
        } catch (error) {
            // ❌plugin {pluginName} initialization failed: {errorMessage}
            // ❌插件 {pluginName} 初始化失败: {errorMessage}
            const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error);
            const tt = $t('plugin.error.initializationFailed', { pluginName: plugin.name, errorMessage });
            console.error(tt);
            snack(tt, "error");
            return false;
        }
        return true;
    }

    /** @function
     * @desc 注册插件配置
     * @param {string} pluginName - 插件名称
     * @param {IPluginData[]} pluginConfig - 插件配置
     * @returns {void}
     * 该方法用于注册插件的配置数据
     * 插件配置数据是一个数组，包含了插件的可配置数据，比如说
     * 是否启用，是否显示等等
     * 一般由 插件 本身在 init 方法中调用
    */
    static RegisterPluginConfig(pluginName: string, pluginConfig: IPluginData[]) {
        // 如果 pluginConfig 不存在，则创建一个新的数组，否则将 pluginConfig 添加到 pluginConfig 中
        if (IPluginLoader.pluginConfig[pluginName] === undefined) {
            IPluginLoader.pluginConfig[pluginName] = pluginConfig;
        }
        else {
            IPluginLoader.pluginConfig[pluginName] = IPluginLoader.pluginConfig[pluginName].concat(pluginConfig);
        }

        const tt = $t('plugin.info.configRegistered', { pluginName });
        console.log(tt, IPluginLoader.pluginConfig[pluginName]);
    }

    /** @function
     * @desc 从指定的文件夹加载插件
     * @param {any} enviroment - 应当是XManager的实例，或者IManager的实例
     * @param {string} folder - 插件文件夹
     * @returns {Promise<void>}
     */
    static async LoadPluginsFromFolder(enviroment: any, folder: string) {        // 检查插件文件夹是否存在
        if (!await globalServiceContainer.fs.checkDirectoryExists(folder)) {
            // 不存在就创建
            await globalServiceContainer.fs.createDirectory(folder);
            // ❗️插件文件夹不存在，已创建：{folder}
            // ❗️Plugin folder does not exist, created: {folder}
            const tt = $t('plugin.error.folderNotExist', { folder });
            console.error(tt);
            snack(tt, "error");
            return;
        }
        const files = await globalServiceContainer.fs.listDirectory(folder);
        //debug
        console.log(`Loading plugins from folder: ${folder}`, files);
        // 使用 for...of + await，确保插件按顺序加载且 await 生效
        for (const file of files) {
            if (file.endsWith('.js')) {
            try {
                const plugin: IPlugin = await loadExternScript(file) as IPlugin;
                // debug
                console.log(`Loaded plugin from file: ${file}`, plugin);
                await IPluginLoader.RegisterPlugin(plugin, enviroment);
            } catch (e) {
                const tt = $t('plugin.error.loadFailed', { file });
                console.error(tt, e);
                snack(tt, "error");
            }
            }
        }
    }

    /** @function
     * @desc 加载所有插件
     * @param {ToolsConUsedInPluginType} enviroment - 应当是XManager的实例，或者IManager的实例
     * 这里使用 enviroment 是为了 避免循环引用
     */
    static async LoadPlugins(enviroment: ToolsConUsedInPluginType) {
        // 插件为 一个 js 文件，通过 require 引入
        // 然后调用 init 方法，将 iManager 传递给插件
        const startTime = new Date().getTime();
        await Promise.all(
            IPluginLoader.pluginLoadFolders.map(async (folder) => {
                // debug
                console.log(`Load plugins from ${await folder()}`);
                await IPluginLoader.LoadPluginsFromFolder(enviroment, await folder());
            }
            ));

        const endTime = new Date().getTime();

        const tt = $t('plugin.info.loaded', { time: endTime - startTime });
        const localDisabledCount = IPluginLoader.localDisabledPluginNamesRef?.value?.length ?? 0;
        const globalDisabledCount = IPluginLoader.globalDisabledPluginNamesRef?.value?.length ?? 0;
        console.log(tt, `${Object.keys(IPluginLoader.plugins)?.length} plugins loaded, ${localDisabledCount + globalDisabledCount} disabled`);
        snack(tt, "info");
    }

    //-===================== 插件配置 =====================
    static transformPluginConfigToSave(pluginConfig: IPluginData[]) {
        // 只保留 data
        const pluginDataToSave: Record<string, any> = {};
        pluginConfig.forEach((data) => {
            if (!data.name || !data.dataRef) {
                console.warn(`Plugin data ${data.name} is missing name or dataRef, skipping.`);
                return;
            }
            pluginDataToSave[data.name] = data.dataRef.value; // 使用 dataRef.value 获取实际的值
        });
        return pluginDataToSave;
    }

    /** @function
     * @desc 保存单个插件的配置
     * 保存的配置是 pluginData 里面的 data
     * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
     * @param {string} pluginName - 插件名称
     * @param {IPluginData[]} pluginData - 插件配置
     * @returns {Promise<void>}
     * 该方法是异步的，不会阻塞主线程
    */
    static async SavePluginConfig(pluginName: string, pluginData: IPluginData[]) {
        // pluginConfig 里面存储了 所有插件的配置 pluginData
        // 每个 pluginData 是一个 数组 ，包含了 插件的配置
        // 但是我们不需要保存 pluginData里面的所有数据，比如说显示名称，描述，onChange等，只需要保存 data
        // data 是一个对象，包含了 插件的配置数据
        const plugin = IPluginLoader.plugins[pluginName];
        if (!plugin) {
            // ❗️插件 {pluginName} 未找到，无法保存配置
            // ❗️Plugin {pluginName} not found, unable to save configuration
            const tt = $t('plugin.error.notFound', { pluginName });
            console.error(tt);
            snack(tt, "error");
            return;
        }

        // 将数据处理为可以保存的格式
        const pluginDataToSave = IPluginLoader.transformPluginConfigToSave(pluginData);

        const tt = $t('plugin.info.configSaved', { pluginName });
        console.log(tt, pluginName, pluginDataToSave);
        // 保存插件配置到文件

        // 根据 插件的作用域来保存配置
        if (plugin.scope === 'local') {
            useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
        } else if (plugin.scope === 'global') {
            useGlobalConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
        } else if (plugin.scope === 'all') {
            useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
            // ! 这里临时的处理方式是全部保存到本地配置
        }
    }

    /** @function   
     * @desc 保存所有插件的配置
     * 保存的配置是 pluginData 里面的 data  
     * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
    */
    static async SaveAllPluginConfig() {
        for (const pluginName in IPluginLoader.pluginConfig) {
            IPluginLoader.SavePluginConfig(pluginName, IPluginLoader.pluginConfig[pluginName]);
        }
    }

    /** @function
     * @desc 保存所有插件的配置，同步版本
     * 保存的配置是 pluginData 里面的 data  
     * data 是一个对象，包含了 插件的配置数据,以{{配置名：配置值}}的形式保存
     * 该方法是同步的，会阻塞主线程
     * 一般用于程序退出时保存配置
    */
    static SaveAllPluginConfigSync() {
        //弹出窗口，询问是否保存配置
        // alert('SaveAllPluginConfigSync');
        for (const pluginName in IPluginLoader.pluginConfig) {
            const pluginData = IPluginLoader.pluginConfig[pluginName];
            const pluginDataToSave = IPluginLoader.transformPluginConfigToSave(pluginData);
            // const pluginDataToSave = {};
            // pluginData.forEach((data) => {
            //     if (!data.name) {
            //         console.warn(`Plugin data ${data.name} is missing name, skipping.`);
            //         return;
            //     }
            //     pluginDataToSave[data.name] = data.dataRef.value; // 使用 dataRef.value 获取实际的值
            // });
            console.log('savePluginConfig:', pluginName, pluginDataToSave, typeof pluginDataToSave);
            // ipcRenderer.invoke('save-plugin-config', pluginName, pluginDataToSave);

            // 根据 插件的作用域来保存配置
            const plugin = IPluginLoader.plugins[pluginName];
            if (!plugin) {
                // ❗️插件 {pluginName} 未找到，无法保存配置
                // ❗️Plugin {pluginName} not found, unable to save configuration
                const tt = $t('plugin.error.notFound', { pluginName });
                console.error(tt);
                snack(tt, "error");
                continue;
            }

            // 根据 插件的作用域来保存配置
            if (plugin.scope === 'local') {
                useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
            } else if (plugin.scope === 'global') {
                useGlobalConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
            } else if (plugin.scope === 'all') {
                useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
                // ! 这里临时的处理方式是全部保存到本地配置
            }
        }
    }

    //-===================== 插件接口 =====================
    static GetPluginData(pluginName: string, dataName: string) {
        // 检查是否有本地配置
        if (IPluginLoader.pluginConfig[pluginName] === undefined) {
            return undefined;
        }
        const pluginData = IPluginLoader.pluginConfig[pluginName];
        const data = pluginData.find((data) => data.name === dataName);
        return data ? data.dataRef.value : undefined;
    }

    static GetPluginDataRef(pluginName: string, dataName: string): Ref<any> | undefined {
        // 检查是否有本地配置
        if (IPluginLoader.pluginConfig[pluginName] === undefined) {
            return undefined;
        }
        const pluginData = IPluginLoader.pluginConfig[pluginName];
        const data = pluginData.find((data) => data.name === dataName);
        return data ? data.dataRef : undefined;
    }

    static SetPluginData(pluginName: string, dataName: string, value: any) {
        const pluginData = IPluginLoader.pluginConfig[pluginName];
        const data = pluginData.find((data) => data.name === dataName);
        if (data && data.onChange) {
            // 走设置途径，因为有可能组件拒绝数值更改，或者需要做一些额外的处理
            data.onChange(value);
        }
    }
}

// 默认导出插件加载器
export default IPluginLoader;