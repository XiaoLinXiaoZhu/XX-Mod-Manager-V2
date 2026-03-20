/**
 * Preset/Pack/Mod 层级管理器
 *
 * 层级关系: preset >= pack > mod
 * - mod: 包含一个或多个文件的模组
 * - pack: 一组 mod 的集合，可以包含多个 mod
 * - preset: 预设配置，可以引用 mod、pack 和其他 preset
 *
 * preset 为单选（互斥），pack 和 mod 可以多选。
 * 切换 preset 会自动启用/禁用相关的 mod。
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

// ============================================================================
// 类型定义
// ============================================================================

/** Mod 条目 */
export interface ModEntry {
  /** Mod ID（目录名） */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 角色分类 */
  category?: string;
  /** 是否启用 */
  enabled: boolean;
}

/** Pack 定义 */
export interface PackDefinition {
  /** Pack ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 标签 */
  tags?: string[];
  /** 包含的 mod ID 列表 */
  modIds: string[];
  /** 各 mod 的单独启用状态（pack 内可单独禁用） */
  modStates: Record<string, boolean>;
}

/** Preset 定义 */
export interface PresetDefinition {
  /** Preset ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 描述 */
  description?: string;
  /** 引用的 mod ID 列表 */
  modIds: string[];
  /** 引用的 pack ID 列表 */
  packIds: string[];
  /** 引用的其他 preset ID 列表 */
  presetIds: string[];
}

/** 管理器配置（持久化） */
export interface PresetManagerData {
  /** 所有 mod 条目 */
  mods: ModEntry[];
  /** 所有 pack */
  packs: PackDefinition[];
  /** 所有 preset */
  presets: PresetDefinition[];
  /** 当前激活的 preset ID */
  activePresetId?: string;
}

// ============================================================================
// Preset 管理器
// ============================================================================

export class PresetManager {
  private data: PresetManagerData;
  private configPath: string;

  constructor(configPath: string, data?: PresetManagerData) {
    this.configPath = resolve(configPath);
    this.data = data || {
      mods: [],
      packs: [],
      presets: [],
    };
  }

  /**
   * 从配置文件加载
   */
  static async load(configPath: string): Promise<PresetManager> {
    try {
      const content = await readFile(configPath, 'utf-8');
      const data = JSON.parse(content) as PresetManagerData;
      return new PresetManager(configPath, data);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return new PresetManager(configPath);
      }
      throw e;
    }
  }

  /**
   * 保存配置到文件
   */
  async save(): Promise<void> {
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // ========================================================================
  // Mod 管理
  // ========================================================================

  /** 添加 mod */
  addMod(mod: ModEntry): void {
    const existing = this.data.mods.findIndex((m) => m.id === mod.id);
    if (existing >= 0) {
      this.data.mods[existing] = mod;
    } else {
      this.data.mods.push(mod);
    }
  }

  /** 移除 mod */
  removeMod(modId: string): boolean {
    const index = this.data.mods.findIndex((m) => m.id === modId);
    if (index < 0) return false;
    this.data.mods.splice(index, 1);
    // 从所有 pack 和 preset 中移除引用
    for (const pack of this.data.packs) {
      pack.modIds = pack.modIds.filter((id) => id !== modId);
      delete pack.modStates[modId];
    }
    for (const preset of this.data.presets) {
      preset.modIds = preset.modIds.filter((id) => id !== modId);
    }
    return true;
  }

  /** 获取 mod */
  getMod(modId: string): ModEntry | undefined {
    return this.data.mods.find((m) => m.id === modId);
  }

  /** 获取所有 mod */
  getAllMods(): ModEntry[] {
    return [...this.data.mods];
  }

  /** 设置 mod 启用状态 */
  setModEnabled(modId: string, enabled: boolean): boolean {
    const mod = this.data.mods.find((m) => m.id === modId);
    if (!mod) return false;
    mod.enabled = enabled;
    return true;
  }

  // ========================================================================
  // Pack 管理
  // ========================================================================

  /** 添加 pack */
  addPack(pack: PackDefinition): void {
    const existing = this.data.packs.findIndex((p) => p.id === pack.id);
    if (existing >= 0) {
      this.data.packs[existing] = pack;
    } else {
      this.data.packs.push(pack);
    }
  }

  /** 移除 pack */
  removePack(packId: string): boolean {
    const index = this.data.packs.findIndex((p) => p.id === packId);
    if (index < 0) return false;
    this.data.packs.splice(index, 1);
    // 从所有 preset 中移除引用
    for (const preset of this.data.presets) {
      preset.packIds = preset.packIds.filter((id) => id !== packId);
    }
    return true;
  }

  /** 获取 pack */
  getPack(packId: string): PackDefinition | undefined {
    return this.data.packs.find((p) => p.id === packId);
  }

  /** 获取所有 pack */
  getAllPacks(): PackDefinition[] {
    return [...this.data.packs];
  }

  /** 设置 pack 中某个 mod 的状态 */
  setPackModState(packId: string, modId: string, enabled: boolean): boolean {
    const pack = this.data.packs.find((p) => p.id === packId);
    if (!pack || !pack.modIds.includes(modId)) return false;
    pack.modStates[modId] = enabled;
    return true;
  }

  /** 获取 pack 中启用的 mod */
  getPackEnabledMods(packId: string): string[] {
    const pack = this.data.packs.find((p) => p.id === packId);
    if (!pack) return [];
    return pack.modIds.filter((id) => pack.modStates[id] !== false);
  }

  // ========================================================================
  // Preset 管理
  // ========================================================================

  /** 添加 preset */
  addPreset(preset: PresetDefinition): void {
    const existing = this.data.presets.findIndex((p) => p.id === preset.id);
    if (existing >= 0) {
      this.data.presets[existing] = preset;
    } else {
      this.data.presets.push(preset);
    }
  }

  /** 移除 preset */
  removePreset(presetId: string): boolean {
    const index = this.data.presets.findIndex((p) => p.id === presetId);
    if (index < 0) return false;
    this.data.presets.splice(index, 1);
    // 从其他 preset 中移除引用
    for (const preset of this.data.presets) {
      preset.presetIds = preset.presetIds.filter((id) => id !== presetId);
    }
    if (this.data.activePresetId === presetId) {
      this.data.activePresetId = undefined;
    }
    return true;
  }

  /** 获取 preset */
  getPreset(presetId: string): PresetDefinition | undefined {
    return this.data.presets.find((p) => p.id === presetId);
  }

  /** 获取所有 preset */
  getAllPresets(): PresetDefinition[] {
    return [...this.data.presets];
  }

  /** 获取当前激活的 preset */
  getActivePresetId(): string | undefined {
    return this.data.activePresetId;
  }

  /**
   * 解析 preset 引用的所有 mod（递归展开）
   * 处理嵌套引用，取并集
   */
  resolvePresetMods(presetId: string, visited = new Set<string>()): string[] {
    if (visited.has(presetId)) return []; // 防止循环依赖
    visited.add(presetId);

    const preset = this.data.presets.find((p) => p.id === presetId);
    if (!preset) return [];

    const modSet = new Set<string>();

    // 直接引用的 mod
    for (const modId of preset.modIds) {
      modSet.add(modId);
    }

    // 通过 pack 引用的 mod
    for (const packId of preset.packIds) {
      const enabledMods = this.getPackEnabledMods(packId);
      for (const modId of enabledMods) {
        modSet.add(modId);
      }
    }

    // 通过嵌套 preset 引用的 mod（递归，取并集）
    for (const nestedPresetId of preset.presetIds) {
      const nestedMods = this.resolvePresetMods(nestedPresetId, visited);
      for (const modId of nestedMods) {
        modSet.add(modId);
      }
    }

    return Array.from(modSet);
  }

  /**
   * 激活 preset（单选）
   * 返回需要启用的 mod 列表
   */
  activatePreset(presetId: string): string[] {
    const preset = this.data.presets.find((p) => p.id === presetId);
    if (!preset) {
      throw new Error(`Preset "${presetId}" 不存在`);
    }

    this.data.activePresetId = presetId;
    return this.resolvePresetMods(presetId);
  }

  /** 获取管理器数据（用于序列化） */
  getData(): PresetManagerData {
    return JSON.parse(JSON.stringify(this.data));
  }
}
