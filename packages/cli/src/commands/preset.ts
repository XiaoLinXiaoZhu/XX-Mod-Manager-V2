/**
 * preset 命令 - Preset/Pack/Mod 层级管理
 *
 * 管理 mod、pack 和 preset 的层级关系，
 * 支持快速切换不同的模组配置组合。
 */

import { Command } from 'commander';
import { PresetManager } from '@xxmm/core';
import type { ModEntry, PackDefinition, PresetDefinition } from '@xxmm/core';

const DEFAULT_CONFIG = './xxmm-presets.json';

export const presetCommand = new Command('preset')
  .description('Preset/Pack/Mod 层级管理');

// ========================================================================
// Mod 子命令
// ========================================================================

const modCmd = presetCommand
  .command('mod')
  .description('Mod 条目管理');

modCmd
  .command('add <id>')
  .description('添加 mod 条目')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-n, --name <name>', '显示名称')
  .option('-t, --tags <tags>', '标签（逗号分隔）')
  .option('--category <category>', '分类')
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);

    const mod: ModEntry = {
      id,
      name: options.name || id,
      tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : undefined,
      category: options.category,
      enabled: false,
    };

    manager.addMod(mod);
    await manager.save();
    console.log(`✅ 已添加 mod: ${mod.name} (${mod.id})`);
  });

modCmd
  .command('remove <id>')
  .description('移除 mod 条目')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);
    if (manager.removeMod(id)) {
      await manager.save();
      console.log(`✅ 已移除 mod: ${id}`);
    } else {
      console.error(`❌ Mod "${id}" 不存在`);
      process.exit(1);
    }
  });

modCmd
  .command('list')
  .description('列出所有 mod')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (options) => {
    const manager = await PresetManager.load(options.config);
    const mods = manager.getAllMods();

    if (options.json) {
      console.log(JSON.stringify(mods, null, 2));
      return;
    }

    if (mods.length === 0) {
      console.log('📦 没有已注册的 mod');
      return;
    }

    console.log(`📦 Mod 列表 (${mods.length}):\n`);
    for (const mod of mods) {
      const status = mod.enabled ? '🟢' : '🔴';
      const tags = mod.tags?.length ? ` [${mod.tags.join(', ')}]` : '';
      const category = mod.category ? ` (${mod.category})` : '';
      console.log(`  ${status} ${mod.name}${category}${tags}`);
      console.log(`     ID: ${mod.id}`);
    }
  });

// ========================================================================
// Pack 子命令
// ========================================================================

const packCmd = presetCommand
  .command('pack')
  .description('Pack 管理');

packCmd
  .command('create <id>')
  .description('创建 pack')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-n, --name <name>', '显示名称')
  .option('-m, --mods <mods>', 'Mod ID 列表（逗号分隔）')
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);
    const modIds = options.mods ? options.mods.split(',').map((m: string) => m.trim()) : [];

    const pack: PackDefinition = {
      id,
      name: options.name || id,
      modIds,
      modStates: {},
    };

    // 默认所有 mod 启用
    for (const modId of modIds) {
      pack.modStates[modId] = true;
    }

    manager.addPack(pack);
    await manager.save();
    console.log(`✅ 已创建 pack: ${pack.name} (${pack.id})`);
    if (modIds.length > 0) {
      console.log(`   包含 ${modIds.length} 个 mod: ${modIds.join(', ')}`);
    }
  });

packCmd
  .command('remove <id>')
  .description('移除 pack')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);
    if (manager.removePack(id)) {
      await manager.save();
      console.log(`✅ 已移除 pack: ${id}`);
    } else {
      console.error(`❌ Pack "${id}" 不存在`);
      process.exit(1);
    }
  });

packCmd
  .command('list')
  .description('列出所有 pack')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (options) => {
    const manager = await PresetManager.load(options.config);
    const packs = manager.getAllPacks();

    if (options.json) {
      console.log(JSON.stringify(packs, null, 2));
      return;
    }

    if (packs.length === 0) {
      console.log('📦 没有已创建的 pack');
      return;
    }

    console.log(`📦 Pack 列表 (${packs.length}):\n`);
    for (const pack of packs) {
      console.log(`  📂 ${pack.name} (${pack.id})`);
      if (pack.description) {
        console.log(`     ${pack.description}`);
      }
      const enabledCount = pack.modIds.filter((id) => pack.modStates[id] !== false).length;
      console.log(`     Mod: ${enabledCount}/${pack.modIds.length} 启用`);
      for (const modId of pack.modIds) {
        const state = pack.modStates[modId] !== false ? '🟢' : '🔴';
        console.log(`       ${state} ${modId}`);
      }
    }
  });

packCmd
  .command('add-mod <packId> <modId>')
  .description('向 pack 添加 mod')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (packId: string, modId: string, options) => {
    const manager = await PresetManager.load(options.config);
    const pack = manager.getPack(packId);
    if (!pack) {
      console.error(`❌ Pack "${packId}" 不存在`);
      process.exit(1);
    }
    if (!pack.modIds.includes(modId)) {
      pack.modIds.push(modId);
      pack.modStates[modId] = true;
      manager.addPack(pack);
      await manager.save();
    }
    console.log(`✅ 已将 mod "${modId}" 添加到 pack "${packId}"`);
  });

packCmd
  .command('remove-mod <packId> <modId>')
  .description('从 pack 移除 mod')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (packId: string, modId: string, options) => {
    const manager = await PresetManager.load(options.config);
    const pack = manager.getPack(packId);
    if (!pack) {
      console.error(`❌ Pack "${packId}" 不存在`);
      process.exit(1);
    }
    pack.modIds = pack.modIds.filter((id) => id !== modId);
    delete pack.modStates[modId];
    manager.addPack(pack);
    await manager.save();
    console.log(`✅ 已从 pack "${packId}" 移除 mod "${modId}"`);
  });

// ========================================================================
// Preset 子命令
// ========================================================================

presetCommand
  .command('create <id>')
  .description('创建 preset')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-n, --name <name>', '显示名称')
  .option('-m, --mods <mods>', 'Mod ID 列表（逗号分隔）')
  .option('-p, --packs <packs>', 'Pack ID 列表（逗号分隔）')
  .option('--presets <presets>', '引用的 Preset ID 列表（逗号分隔）')
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);

    const preset: PresetDefinition = {
      id,
      name: options.name || id,
      modIds: options.mods ? options.mods.split(',').map((m: string) => m.trim()) : [],
      packIds: options.packs ? options.packs.split(',').map((p: string) => p.trim()) : [],
      presetIds: options.presets ? options.presets.split(',').map((p: string) => p.trim()) : [],
    };

    manager.addPreset(preset);
    await manager.save();
    console.log(`✅ 已创建 preset: ${preset.name} (${preset.id})`);
  });

presetCommand
  .command('remove <id>')
  .description('移除 preset')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);
    if (manager.removePreset(id)) {
      await manager.save();
      console.log(`✅ 已移除 preset: ${id}`);
    } else {
      console.error(`❌ Preset "${id}" 不存在`);
      process.exit(1);
    }
  });

presetCommand
  .command('list')
  .description('列出所有 preset')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (options) => {
    const manager = await PresetManager.load(options.config);
    const presets = manager.getAllPresets();
    const activeId = manager.getActivePresetId();

    if (options.json) {
      console.log(JSON.stringify({ presets, activePresetId: activeId }, null, 2));
      return;
    }

    if (presets.length === 0) {
      console.log('🎯 没有已创建的 preset');
      return;
    }

    console.log(`🎯 Preset 列表 (${presets.length}):\n`);
    for (const preset of presets) {
      const active = preset.id === activeId ? ' ← 当前激活' : '';
      const icon = preset.id === activeId ? '🟢' : '⚪';
      console.log(`  ${icon} ${preset.name} (${preset.id})${active}`);
      if (preset.description) {
        console.log(`     ${preset.description}`);
      }
      if (preset.modIds.length > 0) {
        console.log(`     Mod: ${preset.modIds.join(', ')}`);
      }
      if (preset.packIds.length > 0) {
        console.log(`     Pack: ${preset.packIds.join(', ')}`);
      }
      if (preset.presetIds.length > 0) {
        console.log(`     Preset: ${preset.presetIds.join(', ')}`);
      }

      // 显示解析后的 mod 列表
      const resolvedMods = manager.resolvePresetMods(preset.id);
      if (resolvedMods.length > 0) {
        console.log(`     → 实际启用 ${resolvedMods.length} 个 mod: ${resolvedMods.join(', ')}`);
      }
    }
  });

presetCommand
  .command('activate <id>')
  .description('激活 preset（单选）')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);

    try {
      const mods = manager.activatePreset(id);
      await manager.save();
      console.log(`✅ 已激活 preset: ${id}`);
      if (mods.length > 0) {
        console.log(`   需要启用的 mod (${mods.length}):`);
        for (const modId of mods) {
          console.log(`   • ${modId}`);
        }
      } else {
        console.log(`   ⚠️  该 preset 没有关联任何 mod`);
      }
    } catch (error) {
      console.error(`❌ 激活失败:`, error);
      process.exit(1);
    }
  });

presetCommand
  .command('resolve <id>')
  .description('解析 preset 引用的所有 mod')
  .option('-c, --config <path>', '配置文件路径', DEFAULT_CONFIG)
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (id: string, options) => {
    const manager = await PresetManager.load(options.config);
    const mods = manager.resolvePresetMods(id);

    if (options.json) {
      console.log(JSON.stringify(mods, null, 2));
      return;
    }

    if (mods.length === 0) {
      console.log(`⚠️  Preset "${id}" 没有关联任何 mod`);
    } else {
      console.log(`🎯 Preset "${id}" 解析结果 (${mods.length} 个 mod):\n`);
      for (const modId of mods) {
        console.log(`  • ${modId}`);
      }
    }
  });
