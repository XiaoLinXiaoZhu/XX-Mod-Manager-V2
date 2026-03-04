/**
 * 分析 mod 的 hash 分布，帮助建立角色映射
 */

import { parseIni } from '../packages/ini-parser/src';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SAMPLES_DIR = 'data/mod-samples';

async function findIniFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  
  async function scan(currentDir: string) {
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
  }
  
  await scan(dir);
  return results;
}

async function main() {
  console.log('🔍 分析 mod hash 分布...\n');

  const entries = await readdir(SAMPLES_DIR, { withFileTypes: true });
  const modDirs = entries
    .filter(e => e.isDirectory())
    .map(e => ({ name: e.name, path: join(SAMPLES_DIR, e.name) }));

  // 收集每个 mod 的 hash
  const modHashes = new Map<string, { name: string; hashes: Set<string> }>();
  
  for (const mod of modDirs) {
    const iniFiles = await findIniFiles(mod.path);
    const hashes = new Set<string>();
    
    for (const iniFile of iniFiles) {
      try {
        const content = await Bun.file(iniFile).text();
        const parsed = parseIni(content, iniFile);
        for (const hash of parsed.hashes) {
          hashes.add(hash);
        }
      } catch {}
    }
    
    modHashes.set(mod.name, { name: mod.name, hashes });
  }

  // 分析 mod 名称中的角色关键词
  const characterKeywords = [
    'anby', '安比',
    'nicole', '妮可',
    'ellen', '艾莲',
    'lucy', '露西',
    'belle', '贝尔',
    'jane', '简',
    'miyabi', '雅',
    'vivian', '薇薇安',
    'corin', '可琳',
    'evelyn', '伊芙琳',
    'koleda', '珂蕾妲',
    'grace', '格蕾丝',
    'rina', '丽娜',
    'soukaku', '苍角',
    'zhu yuan', '朱鸢',
    'qingyi', '青衣',
    'seth', '赛斯',
    'anton', '安东',
    'ben', '本',
    'billy', '比利',
    'nekomata', '猫又',
    'piper', '派派',
    'soldier', '士兵',
    'lycaon', '莱卡恩',
    'caesar', '凯撒',
    'burnice', '柏妮丝',
    'yanagi', '柳',
    'lighter', '莱特',
    'astra', '星见',
  ];

  // 按角色分组
  const characterMods = new Map<string, string[]>();
  
  for (const [modName] of modHashes) {
    const nameLower = modName.toLowerCase();
    for (let i = 0; i < characterKeywords.length; i += 2) {
      const eng = characterKeywords[i];
      const chs = characterKeywords[i + 1];
      if (nameLower.includes(eng) || modName.includes(chs)) {
        const char = eng;
        const existing = characterMods.get(char) || [];
        existing.push(modName);
        characterMods.set(char, existing);
        break;
      }
    }
  }

  // 输出角色分组
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 按角色分组的 mod');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const [char, mods] of characterMods) {
    console.log(`\n🎭 ${char.toUpperCase()} (${mods.length} 个 mod):`);
    
    // 找出这些 mod 共有的 hash
    const hashCounts = new Map<string, number>();
    for (const modName of mods) {
      const info = modHashes.get(modName);
      if (info) {
        for (const hash of info.hashes) {
          hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
        }
      }
    }
    
    // 找出出现在所有该角色 mod 中的 hash（可能是角色特征 hash）
    const commonHashes = Array.from(hashCounts.entries())
      .filter(([_, count]) => count >= Math.max(2, mods.length * 0.5))
      .sort((a, b) => b[1] - a[1]);
    
    console.log(`   Mod 列表: ${mods.join(', ')}`);
    if (commonHashes.length > 0) {
      console.log(`   共有 hash (出现 ≥50% mod):`);
      for (const [hash, count] of commonHashes.slice(0, 10)) {
        console.log(`      ${hash} (${count}/${mods.length})`);
      }
    }
  }

  // 生成建议的配置文件
  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 建议的角色 hash 映射配置');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const config: Record<string, { name: string; hashes: string[] }> = {};
  
  for (const [char, mods] of characterMods) {
    const hashCounts = new Map<string, number>();
    for (const modName of mods) {
      const info = modHashes.get(modName);
      if (info) {
        for (const hash of info.hashes) {
          hashCounts.set(hash, (hashCounts.get(hash) || 0) + 1);
        }
      }
    }
    
    const commonHashes = Array.from(hashCounts.entries())
      .filter(([_, count]) => count >= Math.max(2, mods.length * 0.5))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hash]) => hash);
    
    if (commonHashes.length > 0) {
      config[char] = {
        name: char.charAt(0).toUpperCase() + char.slice(1),
        hashes: commonHashes,
      };
    }
  }

  console.log(JSON.stringify(config, null, 2));
}

main().catch(console.error);
