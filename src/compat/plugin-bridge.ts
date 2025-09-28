/**
 * 插件系统兼容桥接层
 * 提供旧插件系统的兼容接口
 */

import { ref } from 'vue';
import { join } from "@tauri-apps/api/path";
import { appDataDir } from "@tauri-apps/api/path";
import { globalServiceContainer } from "@/shared/services/ServiceContainer";
import { EventSystem, EventType } from './event-bridge';
import { currentPage } from './state-bridge';
import { useConfig, useGlobalConfig, SubConfigInstance, GlobalConfigInstance } from './config-bridge';

/**
 * 兼容的插件类型定义
 */
export interface IPlugin {
  name: string;
  t_displayName?: any;
  scope?: 'global' | 'local' | 'all';
  init?: (environment: any) => void;
}

export interface IPluginData {
  name: string;
  dataRef: { value: any };
  onChange?: (value: any) => void;
}

export type ToolsConUsedInPluginType = any;

/**
 * 兼容的插件加载器类
 * 提供与旧系统相同的API，但使用新的插件系统
 */
export class IPluginLoader {
  public static plugins: { [key: string]: IPlugin } = {};
  public static localDisabledPluginNamesRef = ref<string[]>([]);
  public static globalDisabledPluginNamesRef = ref<string[]>([]);
  public static pluginConfig: { [key: string]: IPluginData[] } = {};
  public static enviroment: ToolsConUsedInPluginType = {};

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

  public static clearAllPlugins() {
    IPluginLoader.plugins = {};
    IPluginLoader.pluginConfig = {};
  }

  public static async Init() {
    IPluginLoader.clearAllPlugins();
    await IPluginLoader.LoadDisabledPlugins();
    await IPluginLoader.LoadPlugins(this.enviroment);
    console.log('IPluginLoader init finished');
    await EventSystem.trigger(EventType.pluginLoaded);
  }

  static async LoadDisabledPlugins() {
    if (currentPage.value === 'modListPage') {
      IPluginLoader.localDisabledPluginNamesRef = SubConfigInstance.disabledPlugins;
      IPluginLoader.globalDisabledPluginNamesRef = GlobalConfigInstance.disabledPlugins;
    }
    if (currentPage.value === 'gamePage') {
      IPluginLoader.globalDisabledPluginNamesRef.value = GlobalConfigInstance.disabledPlugins.value;
    }
    console.log('disabledPluginNames:', IPluginLoader.localDisabledPluginNamesRef.value, IPluginLoader.globalDisabledPluginNamesRef.value);
  }

  static disablePlugin(pluginName: string) {
    IPluginLoader.localDisabledPluginNamesRef.value.push(pluginName);
    EventSystem.trigger(EventType.pluginDisabled, pluginName);
    IPluginLoader.saveDisabledPlugins();
  }

  static enablePlugin(pluginName: string) {
    if (IPluginLoader.globalDisabledPluginNamesRef.value.includes(pluginName)) {
      console.warn('Plugin cannot be enabled as it is disabled globally');
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
    console.log('Saving disabled plugins:', IPluginLoader.localDisabledPluginNamesRef.value, IPluginLoader.globalDisabledPluginNamesRef.value);
  }

  static CheckIfPluginCanBeEnabled(plugin: IPlugin): boolean {
    const t_pluginName = plugin.t_displayName ? 'Plugin' : plugin.name;
    console.log('Checking if plugin can be enabled:', t_pluginName, plugin.scope);
    const ifContainInGlobalDisabled = IPluginLoader.globalDisabledPluginNamesRef.value.includes(plugin.name);
    const ifContainInLocalDisabled = IPluginLoader.localDisabledPluginNamesRef.value.includes(plugin.name);

    console.log('ifContainInGlobalDisabled:', ifContainInGlobalDisabled, 'ifContainInLocalDisabled:', ifContainInLocalDisabled, "\ncurrentPage", currentPage.value, "plugin.scope", plugin.scope);

    if (plugin.scope === undefined) {
      return false;
    }
    if (plugin.scope === 'all') {
      if (currentPage.value === 'modListPage') {
        if (ifContainInGlobalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled globally`);
          return false;
        }
        if (ifContainInLocalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled locally`);
          return false;
        }
        return true;
      }
      if (currentPage.value === 'gamePage') {
        if (ifContainInGlobalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled globally`);
          return false;
        }
        return true;
      }
      return false;
    }
    if (plugin.scope === 'local') {
      if (currentPage.value === 'modListPage') {
        if (ifContainInGlobalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled globally`);
          return false;
        }
        if (ifContainInLocalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled locally`);
          return false;
        }
        return true;
      }
      return false;
    }
    if (plugin.scope === 'global') {
      if (currentPage.value === 'gamePage') {
        if (ifContainInGlobalDisabled) {
          console.log(`Plugin ${t_pluginName} is disabled globally`);
          return false;
        }
        return true;
      }
      return false;
    }

    return false;
  }

  static async RegisterPlugin(plugin: IPlugin, enviroment: ToolsConUsedInPluginType): Promise<boolean> {
    IPluginLoader.plugins[plugin.name] = plugin;

    const t_pluginName = plugin.t_displayName ? 'Plugin' : plugin.name;

    if (!await IPluginLoader.CheckIfPluginCanBeEnabled(plugin)) {
      return false;
    }

    if (plugin.init !== undefined) {
      if (!IPluginLoader.initializePlugin(plugin, enviroment)) {
        return false;
      }
      console.log(`Plugin ${t_pluginName} initialized`);
    }

    const externalPluginConfig = this.getPluginExternalConfig(plugin);
    if (externalPluginConfig) {
      if (IPluginLoader.pluginConfig[plugin.name] === undefined) {
        IPluginLoader.pluginConfig[plugin.name] = [];
      }
      IPluginLoader.pluginConfig[plugin.name]?.forEach((data) => {
        if (data.name && externalPluginConfig[data.name] !== undefined) {
          data.dataRef.value = externalPluginConfig[data.name];
        }
      });
      console.log(`Plugin ${t_pluginName} loaded with local data`);
    }
    return true;
  }

  static getPluginExternalConfig(plugin: IPlugin): Record<string, any> {
    if (plugin.scope === 'local') {
      return useConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
    }
    if (plugin.scope === 'global') {
      return useGlobalConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
    }
    if (plugin.scope === 'all') {
      const localConfig = useConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
      const globalConfig = useGlobalConfig(`plugin-${plugin.name}`, {} as Record<string, any>).value;
      return { ...globalConfig, ...localConfig };
    }
    console.warn(`Plugin ${plugin.name} has an invalid scope: ${plugin.scope}. Defaulting to empty object.`);
    return {};
  }

  static initializePlugin(plugin: IPlugin, enviroment: any): boolean {
    try {
      plugin.init!(enviroment);
    } catch (error) {
      const errorMessage = (error && typeof error === 'object' && 'message' in error) ? (error as any).message : String(error);
      console.error(`Plugin ${plugin.name} initialization failed: ${errorMessage}`);
      return false;
    }
    return true;
  }

  static RegisterPluginConfig(pluginName: string, pluginConfig: IPluginData[]) {
    if (IPluginLoader.pluginConfig[pluginName] === undefined) {
      IPluginLoader.pluginConfig[pluginName] = pluginConfig;
    } else {
      IPluginLoader.pluginConfig[pluginName] = IPluginLoader.pluginConfig[pluginName].concat(pluginConfig);
    }
    console.log(`Plugin ${pluginName} config registered`);
  }

  static async LoadPluginsFromFolder(_enviroment: any, folder: string) {
    if (!await globalServiceContainer.fs.checkDirectoryExists(folder)) {
      await globalServiceContainer.fs.createDirectory(folder);
      console.error(`Plugin folder does not exist, created: ${folder}`);
      return;
    }
    const files = await globalServiceContainer.fs.listDirectory(folder);
    console.log(`Loading plugins from folder: ${folder}`, files);
    for (const file of files) {
      if (file.endsWith('.js')) {
        try {
          // 这里需要实现loadExternScript的兼容版本
          console.log(`Loading plugin from file: ${file}`);
        } catch (e) {
          console.error(`Failed to load plugin from file: ${file}`, e);
        }
      }
    }
  }

  static async LoadPlugins(enviroment: ToolsConUsedInPluginType) {
    const startTime = new Date().getTime();
    await Promise.all(
      IPluginLoader.pluginLoadFolders.map(async (folder) => {
        console.log(`Load plugins from ${await folder()}`);
        await IPluginLoader.LoadPluginsFromFolder(enviroment, await folder());
      })
    );
    const endTime = new Date().getTime();
    console.log(`Plugins loaded in ${endTime - startTime}ms`);
  }

  static transformPluginConfigToSave(pluginConfig: IPluginData[]) {
    const pluginDataToSave: Record<string, any> = {};
    pluginConfig.forEach((data) => {
      if (!data.name || !data.dataRef) {
        console.warn(`Plugin data ${data.name} is missing name or dataRef, skipping.`);
        return;
      }
      pluginDataToSave[data.name] = data.dataRef.value;
    });
    return pluginDataToSave;
  }

  static async SavePluginConfig(pluginName: string, pluginData: IPluginData[]) {
    const plugin = IPluginLoader.plugins[pluginName];
    if (!plugin) {
      console.error(`Plugin ${pluginName} not found, unable to save configuration`);
      return;
    }

    const pluginDataToSave = IPluginLoader.transformPluginConfigToSave(pluginData);
    console.log(`Saving plugin config: ${pluginName}`, pluginDataToSave);

    if (plugin.scope === 'local') {
      useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
    } else if (plugin.scope === 'global') {
      useGlobalConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
    } else if (plugin.scope === 'all') {
      useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
    }
  }

  static async SaveAllPluginConfig() {
    for (const pluginName in IPluginLoader.pluginConfig) {
      const pluginData = IPluginLoader.pluginConfig[pluginName];
      if (pluginData) {
        IPluginLoader.SavePluginConfig(pluginName, pluginData);
      }
    }
  }

  static SaveAllPluginConfigSync() {
    for (const pluginName in IPluginLoader.pluginConfig) {
      const pluginData = IPluginLoader.pluginConfig[pluginName];
      if (!pluginData) continue;
      const pluginDataToSave = IPluginLoader.transformPluginConfigToSave(pluginData);
      console.log('savePluginConfig:', pluginName, pluginDataToSave, typeof pluginDataToSave);

      const plugin = IPluginLoader.plugins[pluginName];
      if (!plugin) {
        console.error(`Plugin ${pluginName} not found, unable to save configuration`);
        continue;
      }

      if (plugin.scope === 'local') {
        useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
      } else if (plugin.scope === 'global') {
        useGlobalConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
      } else if (plugin.scope === 'all') {
        useConfig(`plugin-${pluginName}`, {}).value = pluginDataToSave;
      }
    }
  }

  static GetPluginData(pluginName: string, dataName: string) {
    if (IPluginLoader.pluginConfig[pluginName] === undefined) {
      return undefined;
    }
    const pluginData = IPluginLoader.pluginConfig[pluginName];
    const data = pluginData.find((data) => data.name === dataName);
    return data ? data.dataRef.value : undefined;
  }

  static GetPluginDataRef(pluginName: string, dataName: string): any {
    if (IPluginLoader.pluginConfig[pluginName] === undefined) {
      return undefined;
    }
    const pluginData = IPluginLoader.pluginConfig[pluginName];
    const data = pluginData.find((data) => data.name === dataName);
    return data ? data.dataRef : undefined;
  }

  static SetPluginData(pluginName: string, dataName: string, value: any) {
    const pluginData = IPluginLoader.pluginConfig[pluginName];
    if (!pluginData) return;
    const data = pluginData.find((data) => data.name === dataName);
    if (data && data.onChange) {
      data.onChange(value);
    }
  }
}
