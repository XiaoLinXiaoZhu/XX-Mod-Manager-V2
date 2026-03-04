/**
 * Mod 冲突检测器
 */

import { parseIni } from '@xxmm/ini-parser';

export interface ModInfo {
  name: string;
  path: string;
  hashes: Set<string>;
}

export interface ConflictInfo {
  hash: string;
  mods: string[];
}

/**
 * 扫描目录获取 mod 的 hash 信息
 */
export async function scanModHashes(modPath: string): Promise<ModInfo> {
  const name = modPath.split(/[/\\]/).pop() || modPath;
  const hashes = new Set<string>();

  async function scanDir(dir: string) {
    const { readdir } = await import('node:fs/promises');
    const { join } = await import('node:path');

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        await scanDir(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
        if (entry.name.includes('DISABLED')) continue;
        try {
          const content = await Bun.file(fullPath).text();
          const parsed = parseIni(content, fullPath);
          for (const hash of parsed.hashes) {
            hashes.add(hash);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }
  }

  await scanDir(modPath);
  return { name, path: modPath, hashes };
}

/**
 * 检测多个 mod 之间的冲突
 */
export function detectConflicts(mods: ModInfo[]): ConflictInfo[] {
  const hashToMods = new Map<string, string[]>();

  for (const mod of mods) {
    for (const hash of mod.hashes) {
      const existing = hashToMods.get(hash) || [];
      existing.push(mod.name);
      hashToMods.set(hash, existing);
    }
  }

  const conflicts: ConflictInfo[] = [];
  for (const [hash, modNames] of hashToMods) {
    if (modNames.length > 1) {
      conflicts.push({ hash, mods: modNames });
    }
  }

  return conflicts;
}
