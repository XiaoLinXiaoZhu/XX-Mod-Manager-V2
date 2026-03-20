/**
 * Mod 启用/禁用管理器（符号链接方式）
 *
 * 通过符号链接实现 mod 的启用/禁用，
 * 避免传统的文件移动方式，实现快速切换。
 *
 * 工作原理：
 * - 启用 mod：在游戏 mods 目录创建指向 mod 实际目录的符号链接
 * - 禁用 mod：删除 mods 目录中对应的符号链接
 * - mod 文件始终保留在存储目录中，不会被移动或删除
 */

import { symlink, readlink, unlink, readdir, stat, lstat, mkdir } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';

/** Mod 链接状态 */
export interface ModLinkStatus {
  /** Mod 名称 */
  name: string;
  /** Mod 源路径（实际存储位置） */
  sourcePath: string;
  /** 链接路径（游戏 mods 目录中的路径） */
  linkPath: string;
  /** 是否已启用 */
  enabled: boolean;
}

/** Mod 链接器配置 */
export interface ModLinkerConfig {
  /** 游戏 mods 目录（3DMigoto 加载目录） */
  modsDir: string;
  /** Mod 存储目录（实际 mod 文件所在目录） */
  storeDir: string;
}

/**
 * Mod 链接管理器
 * 使用符号链接实现 mod 的启用和禁用
 */
export class ModLinker {
  private config: ModLinkerConfig;

  constructor(config: ModLinkerConfig) {
    this.config = {
      modsDir: resolve(config.modsDir),
      storeDir: resolve(config.storeDir),
    };
  }

  /**
   * 确保目录存在
   */
  private async ensureDirs(): Promise<void> {
    await mkdir(this.config.modsDir, { recursive: true });
    await mkdir(this.config.storeDir, { recursive: true });
  }

  /**
   * 启用 mod（创建符号链接）
   */
  async enable(modName: string): Promise<ModLinkStatus> {
    await this.ensureDirs();

    const sourcePath = join(this.config.storeDir, modName);
    const linkPath = join(this.config.modsDir, modName);

    // 验证源目录存在
    try {
      const s = await stat(sourcePath);
      if (!s.isDirectory()) {
        throw new Error(`"${modName}" 不是一个目录`);
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        throw new Error(`Mod "${modName}" 不存在于存储目录: ${this.config.storeDir}`);
      }
      throw e;
    }

    // 检查是否已经存在链接
    try {
      const ls = await lstat(linkPath);
      if (ls.isSymbolicLink()) {
        const target = await readlink(linkPath);
        if (resolve(target) === resolve(sourcePath)) {
          return { name: modName, sourcePath, linkPath, enabled: true };
        }
        // 链接指向其他位置，先删除
        await unlink(linkPath);
      } else {
        throw new Error(`"${linkPath}" 已存在且不是符号链接，请手动处理`);
      }
    } catch (e: any) {
      if (e.code !== 'ENOENT') throw e;
    }

    // 创建符号链接（使用 junction 类型以避免权限问题）
    await symlink(sourcePath, linkPath, 'junction');

    return { name: modName, sourcePath, linkPath, enabled: true };
  }

  /**
   * 禁用 mod（删除符号链接）
   */
  async disable(modName: string): Promise<ModLinkStatus> {
    const sourcePath = join(this.config.storeDir, modName);
    const linkPath = join(this.config.modsDir, modName);

    try {
      const ls = await lstat(linkPath);
      if (ls.isSymbolicLink()) {
        await unlink(linkPath);
      } else {
        throw new Error(`"${linkPath}" 不是符号链接，无法安全禁用。请手动处理。`);
      }
    } catch (e: any) {
      if (e.code === 'ENOENT') {
        // 链接已经不存在，视为已禁用
      } else {
        throw e;
      }
    }

    return { name: modName, sourcePath, linkPath, enabled: false };
  }

  /**
   * 获取所有 mod 的状态
   */
  async status(): Promise<ModLinkStatus[]> {
    await this.ensureDirs();

    const results: ModLinkStatus[] = [];

    // 扫描存储目录中的所有 mod
    const storeEntries = await readdir(this.config.storeDir, { withFileTypes: true });
    const storeMods = new Set<string>();

    for (const entry of storeEntries) {
      if (entry.isDirectory()) {
        storeMods.add(entry.name);
        const sourcePath = join(this.config.storeDir, entry.name);
        const linkPath = join(this.config.modsDir, entry.name);
        const enabled = await this.isEnabled(entry.name);

        results.push({
          name: entry.name,
          sourcePath,
          linkPath,
          enabled,
        });
      }
    }

    return results;
  }

  /**
   * 检查 mod 是否已启用
   */
  async isEnabled(modName: string): Promise<boolean> {
    const linkPath = join(this.config.modsDir, modName);
    const sourcePath = join(this.config.storeDir, modName);

    try {
      const ls = await lstat(linkPath);
      if (ls.isSymbolicLink()) {
        const target = await readlink(linkPath);
        return resolve(target) === resolve(sourcePath);
      }
    } catch {
      // 不存在或其他错误
    }

    return false;
  }

  /**
   * 切换 mod 启用状态
   */
  async toggle(modName: string): Promise<ModLinkStatus> {
    const enabled = await this.isEnabled(modName);
    if (enabled) {
      return this.disable(modName);
    } else {
      return this.enable(modName);
    }
  }

  /**
   * 批量启用
   */
  async enableAll(modNames: string[]): Promise<ModLinkStatus[]> {
    const results: ModLinkStatus[] = [];
    for (const name of modNames) {
      results.push(await this.enable(name));
    }
    return results;
  }

  /**
   * 批量禁用
   */
  async disableAll(modNames: string[]): Promise<ModLinkStatus[]> {
    const results: ModLinkStatus[] = [];
    for (const name of modNames) {
      results.push(await this.disable(name));
    }
    return results;
  }

  /**
   * 禁用所有已启用的 mod
   */
  async disableAllEnabled(): Promise<ModLinkStatus[]> {
    const allStatus = await this.status();
    const enabledMods = allStatus.filter((s) => s.enabled);
    return this.disableAll(enabledMods.map((s) => s.name));
  }

  getConfig(): ModLinkerConfig {
    return { ...this.config };
  }
}
