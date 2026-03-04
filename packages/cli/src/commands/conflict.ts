/**
 * conflict 命令 - 检测 mod 冲突
 */

import { Command } from 'commander';
import { scanModsDirectory, detectConflicts, scanMod } from '@xxmm/core';

export const conflictCommand = new Command('conflict')
  .description('检测 mod 之间的冲突')
  .argument('[paths...]', '要检测的 mod 路径或目录')
  .option('-d, --directory <dir>', '扫描指定目录下的所有 mod')
  .option('-j, --json', '以 JSON 格式输出结果')
  .option('-v, --verbose', '显示详细信息')
  .action(async (paths: string[], options) => {
    try {
      let modPaths: string[] = [];

      // 确定要扫描的 mod 路径
      if (options.directory) {
        console.log(`📁 扫描目录: ${options.directory}`);
        modPaths = await scanModsDirectory(options.directory);
      } else if (paths.length > 0) {
        modPaths = paths;
      } else {
        console.error('❌ 请指定 mod 路径或使用 -d 选项指定目录');
        process.exit(1);
      }

      console.log(`🔍 正在扫描 ${modPaths.length} 个 mod...\n`);

      // 检测冲突
      const conflicts = await detectConflicts(modPaths);

      // 输出结果
      if (options.json) {
        console.log(JSON.stringify(conflicts, null, 2));
        return;
      }

      if (conflicts.length === 0) {
        console.log('✅ 未检测到冲突！所有 mod 可以同时启用。');
        return;
      }

      console.log(`⚠️  检测到 ${conflicts.length} 个冲突:\n`);

      for (const conflict of conflicts) {
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`🔴 Hash: ${conflict.hash}`);
        console.log(`   涉及 ${conflict.mods.length} 个 mod:`);

        for (const mod of conflict.mods) {
          console.log(`   • ${mod.name}`);
          if (options.verbose && mod.sections.length > 0) {
            console.log(`     Sections: ${mod.sections.join(', ')}`);
          }
        }
        console.log();
      }

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`\n💡 提示: 冲突的 mod 会互相覆盖，建议只启用其中一个。`);

    } catch (error) {
      console.error('❌ 发生错误:', error);
      process.exit(1);
    }
  });
