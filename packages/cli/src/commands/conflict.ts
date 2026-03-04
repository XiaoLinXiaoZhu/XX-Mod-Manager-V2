/**
 * conflict 命令 - 检测 mod 之间的冲突
 */

import { Command } from 'commander';
import { scanModHashes, detectConflicts, type ModInfo } from '@xxmm/core';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const conflictCommand = new Command('conflict')
  .description('检测 mod 之间的冲突')
  .argument('[mods...]', 'mod 文件夹路径列表')
  .option('-d, --directory <dir>', '扫描指定目录下的所有 mod')
  .option('-j, --json', '以 JSON 格式输出')
  .option('-v, --verbose', '显示详细信息')
  .action(async (mods: string[], options) => {
    try {
      let modPaths: string[] = mods;

      // 如果指定了目录，扫描目录下的所有子文件夹
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

      console.log(`🔍 正在扫描 ${modPaths.length} 个 mod...\n`);

      // 扫描所有 mod
      const modInfos: ModInfo[] = [];
      for (const modPath of modPaths) {
        const info = await scanModHashes(modPath);
        modInfos.push(info);
      }

      // 检测冲突
      const conflicts = detectConflicts(modInfos);

      if (options.json) {
        console.log(JSON.stringify(conflicts, null, 2));
        return;
      }

      if (conflicts.length === 0) {
        console.log('✅ 未检测到冲突！');
        return;
      }

      console.log(`⚠️  检测到 ${conflicts.length} 个冲突:\n`);

      for (const conflict of conflicts) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔴 Hash: ${conflict.hash}`);
        console.log(`   涉及 ${conflict.mods.length} 个 mod:`);
        for (const mod of conflict.mods) {
          console.log(`   • ${mod}`);
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n💡 提示: 冲突的 mod 会互相覆盖，建议只启用其中一个。`);

    } catch (error) {
      console.error('❌ 发生错误:', error);
      process.exit(1);
    }
  });
