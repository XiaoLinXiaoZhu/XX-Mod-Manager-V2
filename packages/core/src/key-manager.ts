/**
 * 快捷键识别与管理
 *
 * 自动从 mod 的 INI 文件中识别快捷键绑定，
 * 记录和管理这些快捷键，支持用户覆写。
 *
 * 功能：
 * 1. 自动扫描 mod 目录，提取所有快捷键绑定
 * 2. 记录快捷键与 mod 的对应关系
 * 3. 检测快捷键冲突（不同 mod 使用相同快捷键）
 * 4. 支持用户覆写快捷键配置
 */

import { parseIni, type KeyBinding } from '@xxmm/ini-parser';
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';

// ============================================================================
// 类型定义
// ============================================================================

/** Mod 快捷键信息 */
export interface ModKeyInfo {
  /** Mod 名称 */
  modName: string;
  /** Mod 路径 */
  modPath: string;
  /** INI 文件路径 */
  iniFile: string;
  /** 快捷键绑定列表 */
  keyBindings: KeyBinding[];
}

/** 快捷键冲突 */
export interface KeyConflict {
  /** 冲突的按键 */
  key: string;
  /** 涉及的 mod 列表 */
  mods: Array<{
    modName: string;
    sectionName: string;
    type: string;
  }>;
}

/** 快捷键覆写配置 */
export interface KeyOverride {
  /** Mod 名称 */
  modName: string;
  /** 原始 section 名称 */
  sectionName: string;
  /** 原始按键 */
  originalKey: string;
  /** 覆写后的按键 */
  newKey: string;
}

/** 快捷键管理器持久化数据 */
export interface KeyManagerData {
  /** 所有 mod 的快捷键信息 */
  modKeys: ModKeyInfo[];
  /** 用户覆写的快捷键 */
  overrides: KeyOverride[];
}

// ============================================================================
// 快捷键管理器
// ============================================================================

export class KeyManager {
  private data: KeyManagerData;
  private configPath: string;

  constructor(configPath: string, data?: KeyManagerData) {
    this.configPath = resolve(configPath);
    this.data = data || {
      modKeys: [],
      overrides: [],
    };
  }

  /**
   * 从配置文件加载
   */
  static async load(configPath: string): Promise<KeyManager> {
    try {
      const content = await readFile(configPath, 'utf-8');
      const data = JSON.parse(content) as KeyManagerData;
      return new KeyManager(configPath, data);
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        return new KeyManager(configPath);
      }
      throw e;
    }
  }

  /**
   * 保存配置
   */
  async save(): Promise<void> {
    await mkdir(dirname(this.configPath), { recursive: true });
    await writeFile(this.configPath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  /**
   * 扫描单个 mod 的快捷键
   */
  async scanMod(modPath: string): Promise<ModKeyInfo> {
    const modName = modPath.split(/[/\\]/).pop() || modPath;
    const allBindings: KeyBinding[] = [];
    let iniFile = '';

    const iniFiles = await this.findIniFiles(modPath);

    for (const file of iniFiles) {
      try {
        const content = await readFile(file, 'utf-8');
        const parsed = parseIni(content, file);
        if (parsed.keyBindings.length > 0) {
          allBindings.push(...parsed.keyBindings);
          if (!iniFile) iniFile = file;
        }
      } catch {
        // 忽略解析错误
      }
    }

    return {
      modName,
      modPath: resolve(modPath),
      iniFile,
      keyBindings: allBindings,
    };
  }

  /**
   * 扫描目录下的所有 mod
   */
  async scanDirectory(directory: string): Promise<ModKeyInfo[]> {
    const entries = await readdir(directory, { withFileTypes: true });
    const results: ModKeyInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const modPath = join(directory, entry.name);
        const info = await this.scanMod(modPath);
        if (info.keyBindings.length > 0) {
          results.push(info);
        }
      }
    }

    // 更新存储的数据
    this.data.modKeys = results;
    return results;
  }

  /**
   * 检测快捷键冲突
   */
  detectConflicts(modKeys?: ModKeyInfo[]): KeyConflict[] {
    const keys = modKeys || this.data.modKeys;
    const keyToMods = new Map<string, Array<{ modName: string; sectionName: string; type: string }>>();

    for (const mod of keys) {
      for (const binding of mod.keyBindings) {
        const normalizedKey = this.normalizeKey(binding.key);
        const existing = keyToMods.get(normalizedKey) || [];
        existing.push({
          modName: mod.modName,
          sectionName: binding.sectionName,
          type: binding.type,
        });
        keyToMods.set(normalizedKey, existing);
      }
    }

    const conflicts: KeyConflict[] = [];
    for (const [key, mods] of keyToMods) {
      // 只有不同 mod 之间的才算冲突
      const uniqueMods = new Set(mods.map((m) => m.modName));
      if (uniqueMods.size > 1) {
        conflicts.push({ key, mods });
      }
    }

    return conflicts;
  }

  /**
   * 添加快捷键覆写
   */
  addOverride(override: KeyOverride): void {
    // 移除已有的相同覆写
    this.data.overrides = this.data.overrides.filter(
      (o) => !(o.modName === override.modName && o.sectionName === override.sectionName)
    );
    this.data.overrides.push(override);
  }

  /**
   * 移除快捷键覆写
   */
  removeOverride(modName: string, sectionName: string): boolean {
    const before = this.data.overrides.length;
    this.data.overrides = this.data.overrides.filter(
      (o) => !(o.modName === modName && o.sectionName === sectionName)
    );
    return this.data.overrides.length < before;
  }

  /**
   * 获取某个 mod 的所有覆写
   */
  getOverrides(modName?: string): KeyOverride[] {
    if (modName) {
      return this.data.overrides.filter((o) => o.modName === modName);
    }
    return [...this.data.overrides];
  }

  /**
   * 获取所有已扫描的快捷键信息
   */
  getAllModKeys(): ModKeyInfo[] {
    return [...this.data.modKeys];
  }

  /**
   * 获取按键的汇总信息
   */
  getKeySummary(): Map<string, string[]> {
    const summary = new Map<string, string[]>();
    for (const mod of this.data.modKeys) {
      for (const binding of mod.keyBindings) {
        const key = this.normalizeKey(binding.key);
        const existing = summary.get(key) || [];
        existing.push(`${mod.modName} (${binding.sectionName})`);
        summary.set(key, existing);
      }
    }
    return summary;
  }

  /**
   * 标准化按键名称（用于冲突检测）
   */
  private normalizeKey(key: string): string {
    return key
      .toLowerCase()
      .split(/\s+/)
      .sort()
      .join(' ');
  }

  /**
   * 查找目录中的 INI 文件
   */
  private async findIniFiles(dir: string): Promise<string[]> {
    const results: string[] = [];

    async function scan(d: string) {
      const entries = await readdir(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(d, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
          if (!entry.name.includes('DISABLED')) {
            results.push(fullPath);
          }
        }
      }
    }

    await scan(dir);
    return results;
  }

  /** 获取管理器数据 */
  getData(): KeyManagerData {
    return JSON.parse(JSON.stringify(this.data));
  }
}
