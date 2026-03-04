/**
 * 验证角色识别准确性
 */

import { CharacterRecognizer, loadGameConfig, scanModHashes } from '../packages/core/src';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const MOD_SOURCE_DIR = 'D:/GameResource/ZZMI/ModSource';
const CONFIG_PATH = 'data/game-configs/zzz.json';

interface ModJson {
  character?: string;
  characters?: string[];
}

async function main() {
  console.log('🔍 验证角色识别准确性...\n');

  const config = await loadGameConfig(CONFIG_PATH);
  const recognizer = new CharacterRecognizer(config);
  console.log(`📄 配置: ${CONFIG_PATH} (${config.characters.length} 个角色)\n`);

  const entries = await readdir(MOD_SOURCE_DIR, { withFileTypes: true });
  const modDirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  let correct = 0, incorrect = 0, notRecognized = 0, noModJson = 0;
  const mismatches: Array<{ mod: string; expected: string; got: string }> = [];

  for (const modName of modDirs) {
    const modPath = join(MOD_SOURCE_DIR, modName);
    
    let modJson: ModJson | null = null;
    try {
      modJson = JSON.parse(await Bun.file(join(modPath, 'mod.json')).text());
    } catch {
      noModJson++;
      continue;
    }

    const expected = (modJson?.character || modJson?.characters?.[0])?.toLowerCase().trim();
    if (!expected) continue;

    const analysis = await recognizer.analyzeMod(modPath);
    
    if (analysis.characters.length === 0) {
      notRecognized++;
      continue;
    }

    const got = analysis.characters[0].character.id;
    if (got === expected) {
      correct++;
    } else {
      incorrect++;
      mismatches.push({ mod: modName, expected, got });
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ 正确: ${correct}`);
  console.log(`❌ 错误: ${incorrect}`);
  console.log(`❓ 未识别: ${notRecognized}`);
  console.log(`📄 无 mod.json: ${noModJson}`);
  console.log(`\n📈 准确率: ${(correct / (correct + incorrect) * 100).toFixed(1)}%`);

  if (mismatches.length > 0) {
    console.log('\n❌ 错误列表:');
    for (const m of mismatches) {
      console.log(`   ${m.mod}: 期望 ${m.expected}, 识别 ${m.got}`);
    }
  }
}

main().catch(console.error);
