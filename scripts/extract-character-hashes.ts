/**
 * 从实际 mod 中提取角色 hash 映射并写入配置文件
 */

import { parseIni } from '../packages/ini-parser/src';
import type { GameConfig, CharacterDefinition } from '../packages/core/src/character-types';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MOD_SOURCE_DIR = 'D:/GameResource/ZZMI/ModSource';
const OUTPUT_PATH = 'data/game-configs/zzz.json';

interface ModJson {
  name?: string;
  character?: string;
  characters?: string[];
}

// 中英文名称映射
const NAME_MAP: Record<string, string> = {
  '雅': 'Miyabi',
  '玲': 'Belle',
  '简': 'Jane',
  '柳': 'Yanagi',
  '丽娜': 'Rina',
  '艾莲': 'Ellen',
  '凯撒': 'Caesar',
  '11号': 'Eleven',
  '耀佳音': 'Yao Jiaying',
  '伊芙琳': 'Evelyn',
  '露西': 'Lucy',
  '妮可': 'Nicole',
  '派派': 'Piper',
  '扳机': 'Trigger',
  '安比': 'Anby',
  '朱鸢': 'Zhu Yuan',
  '薇薇安': 'Vivian',
  '苍角': 'Soukaku',
  '可琳': 'Corin',
  '柏妮思': 'Burnice',
  '珂蕾妲': 'Koleda',
  '猫又': 'Nekomata',
  '零号安比': 'Anby Zero',
  '格蕾丝': 'Grace',
  '邦布': 'Bangboo',
  '青衣': 'Qingyi',
};

async function findIniFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  
  async function scan(currentDir: string) {
    try {
      const entries = await readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(currentDir, entry.name);
        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
          if (!entry.name.includes('DISABLED')) {
            results.push(fullPath);
          }
        }
      }
    } catch {}
  }
  
  await scan(dir);
  return results;
}

async function main() {
  console.log('🔍 从 mod 中提取角色 hash 映射...\n');

  const entries = await readdir(MOD_SOURCE_DIR, { withFileTypes: true });
  const modDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // 按角色收集 hash
  const characterHashes = new Map<string, Set<string>>();
  const characterModCount = new Map<string, number>();

  for (const modName of modDirs) {
    const modPath = join(MOD_SOURCE_DIR, modName);
    const modJsonPath = join(modPath, 'mod.json');

    let modJson: ModJson | null = null;
    try {
      const content = await Bun.file(modJsonPath).text();
      modJson = JSON.parse(content);
    } catch {
      continue;
    }

    const character = modJson.character || modJson.characters?.[0];
    if (!character) continue;

    const charKey = character.toLowerCase().trim();
    
    const iniFiles = await findIniFiles(modPath);
    for (const iniFile of iniFiles) {
      try {
        const content = await Bun.file(iniFile).text();
        const parsed = parseIni(content, iniFile);
        
        const hashes = characterHashes.get(charKey) || new Set();
        for (const hash of parsed.hashes) {
          hashes.add(hash);
        }
        characterHashes.set(charKey, hashes);
      } catch {}
    }

    characterModCount.set(charKey, (characterModCount.get(charKey) || 0) + 1);
  }

  // 生成配置
  const characters: CharacterDefinition[] = [];
  const sorted = Array.from(characterModCount.entries())
    .filter(([key]) => key !== 'unknown' && key !== 'npc' && key !== 'mise')
    .sort((a, b) => b[1] - a[1]);

  for (const [charKey] of sorted) {
    const allHashes = characterHashes.get(charKey);
    if (!allHashes || allHashes.size === 0) continue;

    const hashArray = Array.from(allHashes).slice(0, 8);
    const englishName = NAME_MAP[charKey] || charKey;
    
    characters.push({
      id: charKey,
      name: englishName,
      localizedNames: { 'zh-CN': charKey },
      category: 'agent',
      hashes: hashArray,
    });

    console.log(`✅ ${charKey} (${englishName}): ${hashArray.length} hashes`);
  }

  // 写入配置文件
  const config: GameConfig = {
    id: 'zzz',
    name: 'Zenless Zone Zero',
    version: '1.5',
    characters,
  };

  await Bun.write(OUTPUT_PATH, JSON.stringify(config, null, 2));
  console.log(`\n📄 配置已写入: ${OUTPUT_PATH}`);
  console.log(`📊 共 ${characters.length} 个角色`);
}

main().catch(console.error);
