/**
 * keys 命令 - 快捷键识别与管理
 *
 * 扫描 mod 目录，提取和管理快捷键绑定，
 * 检测快捷键冲突，支持覆写快捷键。
 */

import { Command } from 'commander';
import { KeyManager } from '@xxmm/core';

const DEFAULT_CONFIG = './xxmm-keys.json';

export const keysCommand = new Command('keys')
  .description('快捷键识别与管理');

// 子命令：扫描快捷键
keysCommand
  .command('scan')
  .description('扫描 mod 目录，提取快捷键绑定')
  .argument('<path>', 'Mod 目录路径')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (modPath: string, options) => {
    const manager = await KeyManager.load(options.config);

    try {
      console.log(`🔍 正在扫描: ${modPath}\n`);
      const results = await manager.scanDirectory(modPath);
      await manager.save();

      if (options.json) {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      if (results.length === 0) {
        console.log('ℹ️  未找到任何快捷键绑定');
        return;
      }

      console.log(`🎮 找到 ${results.length} 个包含快捷键的 mod:\n`);

      let totalBindings = 0;
      for (const mod of results) {
        console.log(`  📁 ${mod.modName} (${mod.keyBindings.length} 个快捷键)`);
        for (const kb of mod.keyBindings) {
          const vars = kb.variableChanges
            .map((vc) => `$${vc.variable}`)
            .join(', ');
          const varInfo = vars ? ` → ${vars}` : '';
          console.log(`     [${kb.key}] ${kb.type}${varInfo}`);
          totalBindings++;
        }
        console.log();
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📊 合计: ${results.length} 个 mod, ${totalBindings} 个快捷键`);

    } catch (error) {
      console.error('❌ 扫描失败:', error);
      process.exit(1);
    }
  });

// 子命令：检测冲突
keysCommand
  .command('conflicts')
  .description('检测快捷键冲突')
  .argument('[path]', 'Mod 目录路径（如已扫描可省略）')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (modPath: string | undefined, options) => {
    const manager = await KeyManager.load(options.config);

    try {
      // 如果指定了路径，先扫描
      if (modPath) {
        console.log(`🔍 正在扫描: ${modPath}\n`);
        await manager.scanDirectory(modPath);
        await manager.save();
      }

      const conflicts = manager.detectConflicts();

      if (options.json) {
        console.log(JSON.stringify(conflicts, null, 2));
        return;
      }

      if (conflicts.length === 0) {
        console.log('✅ 未检测到快捷键冲突！');
        return;
      }

      console.log(`⚠️  检测到 ${conflicts.length} 个快捷键冲突:\n`);

      for (const conflict of conflicts) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🔴 按键: [${conflict.key}]`);
        console.log(`   涉及 ${conflict.mods.length} 个绑定:`);
        for (const mod of conflict.mods) {
          console.log(`   • ${mod.modName} (${mod.sectionName}, ${mod.type})`);
        }
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n💡 提示: 冲突的快捷键可能导致同时触发多个 mod 的功能。`);
      console.log(`   使用 "keys override" 命令可以覆写快捷键。`);

    } catch (error) {
      console.error('❌ 检测失败:', error);
      process.exit(1);
    }
  });

// 子命令：汇总
keysCommand
  .command('summary')
  .description('显示快捷键汇总')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (options) => {
    const manager = await KeyManager.load(options.config);
    const summary = manager.getKeySummary();

    if (summary.size === 0) {
      console.log('ℹ️  没有已扫描的快捷键数据，请先运行 "keys scan"');
      return;
    }

    console.log(`🎮 快捷键汇总:\n`);

    // 按键排序
    const entries = Array.from(summary.entries()).sort(([a], [b]) => a.localeCompare(b));

    for (const [key, mods] of entries) {
      const conflict = mods.length > 1 ? ' ⚠️' : '';
      console.log(`  [${key}]${conflict}`);
      for (const mod of mods) {
        console.log(`    • ${mod}`);
      }
    }
  });

// 子命令：覆写快捷键
keysCommand
  .command('override <modName> <section> <newKey>')
  .description('覆写 mod 的快捷键')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (modName: string, section: string, newKey: string, options) => {
    const manager = await KeyManager.load(options.config);

    // 查找原始绑定
    const modKeys = manager.getAllModKeys();
    const mod = modKeys.find((m) => m.modName === modName);
    if (!mod) {
      console.error(`❌ Mod "${modName}" 没有已扫描的快捷键数据`);
      process.exit(1);
    }

    const binding = mod.keyBindings.find((kb) => kb.sectionName === section);
    if (!binding) {
      console.error(`❌ 在 mod "${modName}" 中未找到 section "${section}"`);
      process.exit(1);
    }

    manager.addOverride({
      modName,
      sectionName: section,
      originalKey: binding.key,
      newKey,
    });
    await manager.save();

    console.log(`✅ 已覆写快捷键:`);
    console.log(`   Mod: ${modName}`);
    console.log(`   Section: ${section}`);
    console.log(`   原始按键: [${binding.key}] → 新按键: [${newKey}]`);
  });

// 子命令：列出覆写
keysCommand
  .command('overrides')
  .description('列出所有快捷键覆写')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-m, --mod <name>', '筛选指定 mod')
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (options) => {
    const manager = await KeyManager.load(options.config);
    const overrides = manager.getOverrides(options.mod);

    if (options.json) {
      console.log(JSON.stringify(overrides, null, 2));
      return;
    }

    if (overrides.length === 0) {
      console.log('ℹ️  没有快捷键覆写');
      return;
    }

    console.log(`🔧 快捷键覆写 (${overrides.length}):\n`);
    for (const o of overrides) {
      console.log(`  📁 ${o.modName} / ${o.sectionName}`);
      console.log(`     [${o.originalKey}] → [${o.newKey}]`);
    }
  });

// 子命令：移除覆写
keysCommand
  .command('remove-override <modName> <section>')
  .description('移除快捷键覆写')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (modName: string, section: string, options) => {
    const manager = await KeyManager.load(options.config);
    if (manager.removeOverride(modName, section)) {
      await manager.save();
      console.log(`✅ 已移除覆写: ${modName} / ${section}`);
    } else {
      console.error(`❌ 未找到对应的覆写`);
      process.exit(1);
    }
  });
