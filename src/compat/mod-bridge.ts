/**
 * Mod 管理兼容桥接层
 * 提供旧 Mod 管理系统的兼容接口
 */

import { 
  createModInfo,
  createModMetadata,
  createModLoader,
  createModFileOperator,
  createModPreviewManager,
  createModHotkeyManager,
  type ModInfo as NewModInfo,
  type ModMetadata as NewModMetadata,
  type ModConfig
} from '@/modules/mod-management';

// 兼容的 ModInfo 类
export class ModInfo {
  private newModInfo: NewModInfo;
  
  constructor(newModInfo: NewModInfo) {
    this.newModInfo = newModInfo;
  }
  
  getSelf() { return this; }
  newMod = false;
  static totalCount = 0;
  
  get metadata() { return this.newModInfo.metadata; }
  get previewManager() { return this.newModInfo.previewManager; }
  get fileOperator() { return this.newModInfo.fileOperator; }
  get hotkeyManager() { return this.newModInfo.hotkeyManager; }
  
  static async createMod(location: string, config: ModConfig): Promise<ModInfo> {
    const newModInfo = await createModInfo(location, config);
    return new ModInfo(newModInfo);
  }
  
  async setMetaDataFromJson(json: any) {
    // 桥接到新架构的方法
    await this.newModInfo.setMetaDataFromJson(json);
  }
}

// 兼容的 ModMetadata 类
export class ModMetadata {
  private newModMetadata: NewModMetadata;
  
  constructor(config: ModConfig) {
    this.newModMetadata = createModMetadata(config);
  }
  
  get id() { return this.newModMetadata.id; }
  get name() { return this.newModMetadata.name; }
  get location() { return this.newModMetadata.location; }
  get description() { return this.newModMetadata.description; }
  get hotkeys() { return this.newModMetadata.hotkeys; }
  
  async loadFrom(filePath: string) {
    await this.newModMetadata.loadFrom(filePath);
  }
  
  async initialize(location: string) {
    await this.newModMetadata.initialize(location);
  }
  
  mergeData(data: any, overwrite: boolean = false) {
    this.newModMetadata.mergeData(data, overwrite);
  }
  
  getConfig() {
    return this.newModMetadata.getConfig();
  }
}

// 兼容的 ModLoader 类
export class ModLoader {
  private newModLoader: any;
  
  constructor() {
    this.newModLoader = createModLoader();
  }
  
  // 桥接到新架构的方法
  async loadMods() {
    return await this.newModLoader.loadMods();
  }
}

// 兼容的 ModFileOperator 类
export class ModFileOperator {
  private newModFileOperator: any;
  
  constructor(metadata: ModMetadata) {
    this.newModFileOperator = createModFileOperator(metadata);
  }
  
  async changeFolderName(name: string) {
    return await this.newModFileOperator.changeFolderName(name);
  }
}

// 兼容的 ModPreviewManager 类
export class ModPreviewManager {
  private newModPreviewManager: any;
  
  constructor(metadata: ModMetadata) {
    this.newModPreviewManager = createModPreviewManager(metadata);
  }
  
  // 桥接到新架构的方法
  async loadPreview() {
    return await this.newModPreviewManager.loadPreview();
  }
}

// 兼容的 ModHotkeyManager 类
export class ModHotkeyManager {
  private newModHotkeyManager: any;
  
  constructor(hotkeys: any) {
    this.newModHotkeyManager = createModHotkeyManager(hotkeys);
  }
  
  // 桥接到新架构的方法
  bindHotkeys() {
    return this.newModHotkeyManager.bindHotkeys();
  }
}

// 导出类型
export type { ModConfig };
