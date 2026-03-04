/**
 * Mod 冲突检测模块
 * 检测多个 mod 之间是否存在资源冲突
 */

import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseIni, extractHashes, extractTextureOverrides, type TextureOverrideInfo } from './ini-parser';

export interface ModInfo {
  /** mod 文件夹路径 */
  path: string;
  /** mod 名称（文件夹名） */
  name: string;
  /** mod 中的所有 ini 文件 */
  iniFiles: string[];
  /** mod 修改的所有 hash 值 */
  hashes: Set<string>;
  /** 详细的 TextureOverride 信息 */
  textureOverrides: TextureOverrideInfo[];
}

export interface ConflictInfo {
  /** 冲突的 hash 值 */
  hash: string;
  /** 涉及冲突的 mod 列表 */
  mods: Array<{
    name: string;
    path: string;
    sections: string[];
  }>;
}

/**
 * 扫描单个 mod 文件夹，提取其信息
 */
export async function scanMod(modPath: string): Promise<ModInfo> {
  const name = modPath.split(/[/\\]/).pop() || modPath;
  const iniFiles: string[] = [];
  const allHashes = new Set<string>();
  const allOverrides: TextureOverrideInfo[] = [];

  // 递归查找所有 ini 文件
  async function findIniFiles(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await findIniFiles(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
        // 跳过 DISABLED_BACKUP 文件
        if (entry.name.includes('DISABLED_BACKUP')) {
          continue;
        }
        iniFiles.push(fullPath);
      }
    }
  }

  await findIniFiles(modPath);

  // 解析所有 ini 文件
  for (const iniFile of iniFiles) {
    try {
      const content = await Bun.file(iniFile).text();
      const parsed = parseIni(content);

      // 提取 hash
      const hashes = extractHashes(parsed);
      for (const hash of hashes) {
        allHashes.add(hash);
      }

      // 提取 TextureOverride 详情
      const overrides = extractTextureOverrides(parsed);
      allOverrides.push(...overrides);
    } catch (error) {
      console.warn(`警告: 无法解析 ${iniFile}:`, error);
    }
  }

  return {
    path: modPath,
    name,
    iniFiles,
    hashes: allHashes,
    textureOverrides: allOverrides,
  };
}

/**
 * 扫描多个 mod 并检测冲突
 */
export async function detectConflicts(modPaths: string[]): Promise<ConflictInfo[]> {
  // 扫描所有 mod
  const mods = await Promise.all(modPaths.map(scanMod));

  // 构建 hash -> mod 映射
  const hashToMods = new Map<string, ModInfo[]>();

  for (const mod of mods) {
    for (const hash of mod.hashes) {
      const existing = hashToMods.get(hash) || [];
      existing.push(mod);
      hashToMods.set(hash, existing);
    }
  }

  // 找出冲突（同一 hash 被多个 mod 使用）
  const conflicts: ConflictInfo[] = [];

  for (const [hash, conflictingMods] of hashToMods) {
    if (conflictingMods.length > 1) {
      conflicts.push({
        hash,
        mods: conflictingMods.map((mod) => ({
          name: mod.name,
          path: mod.path,
          sections: mod.textureOverrides
            .filter((o) => o.hash === hash)
            .map((o) => o.sectionName),
        })),
      });
    }
  }

  return conflicts;
}

/**
 * 扫描目录下的所有 mod 文件夹
 */
export async function scanModsDirectory(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const modPaths: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      modPaths.push(join(directory, entry.name));
    }
  }

  return modPaths;
}
