import { StorageValue,Storage } from '../lib/Storge';
import { GlobalConfigLoader, useGlobalConfig } from './GlobalConfigLoader';

class SubConfigLoaderClass extends Storage {
    public storageName: string = 'local config';
    public inited: boolean = false;

    // useConfig 方法,当没有获取的值时，先尝试从 GlobalConfigLoader 中获取,如果它也没有，则返回默认值
    useConfig<T>(key: string, defaultValue: T, useGlobal: boolean = true): StorageValue<T> {
        if (!this.inited) {
            console.warn(`ConfigLoader 未初始化，无法使用 useConfig 方法，这里临时返回一个全局的值`);
            // 返回全局配置的值
            if (useGlobal) {
                return this.useStorage(key, useGlobalConfig(key, "" as any).value || defaultValue);
            }
            throw new Error(`ConfigLoader 未初始化，无法使用 useConfig 方法`);
        }
        return useGlobal ? this.useStorage(key, useGlobalConfig(key, "" as any).value || defaultValue) : this.useStorage(key, defaultValue);
    }

    loadFrom(filePath: string): Promise<void> {
        console.log(`从 ${filePath} 读取本地配置`);
        this.inited = true; // 标记已初始化
        return super.loadFrom(filePath);
    }

    clearAllConfigs(): Promise<void> {
        console.log(`清除所有本地配置`);
        this._data = {};
        this._refCache = {};
        return this.save();
    }
}

export const ConfigLoader = new SubConfigLoaderClass();
export const useConfig = ConfigLoader.useConfig.bind(ConfigLoader);


// 自动管理
type ConfigScope = 'local' | 'global' | 'auto'; // auto: local > global

export function useScopedConfig<T>(
  key: string,
  defaultValue: T,
  scope: ConfigScope = 'auto',
  syncToGlobal: boolean = false
): StorageValue<T> {
  const isLocalAvailable = ConfigLoader.inited;
  const shouldUseLocal = scope === 'auto' ? isLocalAvailable : scope === 'local';

  let storageSource: Storage;

  if (shouldUseLocal) {
    storageSource = ConfigLoader;
  } else {
    storageSource = GlobalConfigLoader;
  }

  const storageValue = storageSource.useStorage(key, defaultValue);

  // 拦截 set 方法，控制是否同步到另一个作用域
  const originalSet = storageValue.set;
  storageValue.set = async (newValue: T) => {
    await originalSet(newValue);
    if (syncToGlobal && shouldUseLocal) {
      await GlobalConfigLoader.useStorage(key, defaultValue).set(newValue);
    }
  };

  return storageValue;
}