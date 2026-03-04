/**
 * recognize 命令 - 识别 mod 对应的角色
 */

import { Command } from 'commander';
import {
  CharacterRecognizer,
  loadGameConfig,
  createDefaultZZZConfig,
  saveGameConfig,
} from '@xxmm/core';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const recognizeCommand = new Command('recognize')
  .alias('rec')
  .description('识别 mod 对应的角色')
  .argument('[mods...]', 'mod 文件夹路径列表')
  .option('-d, --directory <dir>', '扫描指定目录下的所有 mod')
  .option('-c, --config <path>', '角色配置文件路径')
  .option('--init-config <path>', '生成默认配置文件')
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (mods: string[], options) => {
    try {
      // 生成默认配置
      if (options.initConfig) {
        const config = createDefaultZZZConfig();
        await saveGameConfig(config, options.initConfig);
        console.log(`✅ 已生成默认配置: ${options.initConfig}`);
        return;
      }

      // 加载配置
      let config;
      if (options.config) {
        config = await loadGameConfig(options.config);
        console.log(`📄 使用配置: ${options.config}`);
      } else {
        config = createDefaultZZZConfig();
        console.log(`📄 使用内置默认配置 (ZZZ)`);
      }

      const recognizer = new CharacterRecognizer(config);

      // 获取 mod 路径
      let modPaths: string[] = mods;
      if (options.directory) {
        const entries = await readdir(options.directory, { withFileTypes: true });
        modPaths = entries
          .filter((e) => e.isDirectory())
          .map((e) => join(options.directory, e.name));
        console.log(`📁 扫描目录: ${options.directory}`);
      }

      if (modPaths.length === 0) {
        console.error('❌ 请指定 mod 路径或使用 -d 指定目录');
        process.exit(1);
      }

      console.log(`🔍 正在分析 ${modPaths.length} 个 mod...\n`);

      // 分析所有 mod
      const results = await recognizer.analyzeMods(modPaths);

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      // 按角色分组显示
      const byCharacter = new Map<string, string[]>();
      const unknown: string[] = [];

      for (const result of results) {
        if (result.characters.length === 0) {
          unknown.push(result.modName);
        } else {
          const topMatch = result.characters[0];
          const charId = topMatch.character.id;
          const existing = byCharacter.get(charId) || [];
          existing.push(result.modName);
          byCharacter.set(charId, existing);
        }
      }

      // 输出结果
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📊 角色识别结果');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      for (const [charId, modNames] of byCharacter) {
        const char = recognizer.getCharacterById(charId);
        const displayName = char?.localizedNames?.['zh-CN'] || char?.name || charId;
        console.log(`🎭 ${displayName} (${modNames.length} 个 mod):`);
        for (const name of modNames) {
          const result = results.find((r) => r.modName === name);
          const confidence = result?.characters[0]?.confidence || 0;
          const bar = '█'.repeat(Math.round(confidence * 10)) + '░'.repeat(10 - Math.round(confidence * 10));
          console.log(`   ${bar} ${(confidence * 100).toFixed(0)}% ${name}`);
        }
        console.log();
      }

      if (unknown.length > 0) {
        console.log(`❓ 未识别 (${unknown.length} 个 mod):`);
        for (const name of unknown) {
          console.log(`   • ${name}`);
        }
        console.log();
      }

      // 统计
      const recognized = results.filter((r) => r.characters.length > 0).length;
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📈 统计: ${recognized}/${results.length} 个 mod 已识别角色`);

    } catch (error) {
      console.error('❌ 发生错误:', error);
      process.exit(1);
    }
  });
