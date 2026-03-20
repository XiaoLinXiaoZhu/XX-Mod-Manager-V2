/**
 * link 命令 - Mod 启用/禁用管理（符号链接方式）
 *
 * 通过符号链接实现 mod 的启用和禁用，
 * 在游戏 mods 目录创建/删除指向实际 mod 目录的链接。
 */

import { Command } from 'commander';
import { ModLinker } from '@xxmm/core';

export const linkCommand = new Command('link')
  .description('Mod 启用/禁用管理（符号链接）');

// 子命令：启用 mod
linkCommand
  .command('enable <mods...>')
  .description('启用一个或多个 mod')
  .requiredOption('-m, --mods-dir <path>', '游戏 mods 目录（3DMigoto 加载目录）')
  .requiredOption('-s, --store-dir <path>', 'Mod 存储目录')
  .action(async (mods: string[], options) => {
    const linker = new ModLinker({
      modsDir: options.modsDir,
      storeDir: options.storeDir,
    });

    try {
      for (const modName of mods) {
        const status = await linker.enable(modName);
        console.log(`✅ 已启用: ${status.name}`);
        console.log(`   ${status.sourcePath} → ${status.linkPath}`);
      }
    } catch (error) {
      console.error(`❌ 启用失败:`, error);
      process.exit(1);
    }
  });

// 子命令：禁用 mod
linkCommand
  .command('disable <mods...>')
  .description('禁用一个或多个 mod')
  .requiredOption('-m, --mods-dir <path>', '游戏 mods 目录（3DMigoto 加载目录）')
  .requiredOption('-s, --store-dir <path>', 'Mod 存储目录')
  .action(async (mods: string[], options) => {
    const linker = new ModLinker({
      modsDir: options.modsDir,
      storeDir: options.storeDir,
    });

    try {
      for (const modName of mods) {
        const status = await linker.disable(modName);
        console.log(`⛔ 已禁用: ${status.name}`);
      }
    } catch (error) {
      console.error(`❌ 禁用失败:`, error);
      process.exit(1);
    }
  });

// 子命令：切换状态
linkCommand
  .command('toggle <mod>')
  .description('切换 mod 的启用/禁用状态')
  .requiredOption('-m, --mods-dir <path>', '游戏 mods 目录（3DMigoto 加载目录）')
  .requiredOption('-s, --store-dir <path>', 'Mod 存储目录')
  .action(async (mod: string, options) => {
    const linker = new ModLinker({
      modsDir: options.modsDir,
      storeDir: options.storeDir,
    });

    try {
      const status = await linker.toggle(mod);
      if (status.enabled) {
        console.log(`✅ 已启用: ${status.name}`);
      } else {
        console.log(`⛔ 已禁用: ${status.name}`);
      }
    } catch (error) {
      console.error(`❌ 切换失败:`, error);
      process.exit(1);
    }
  });

// 子命令：查看状态
linkCommand
  .command('status')
  .description('查看所有 mod 的启用状态')
  .requiredOption('-m, --mods-dir <path>', '游戏 mods 目录（3DMigoto 加载目录）')
  .requiredOption('-s, --store-dir <path>', 'Mod 存储目录')
  .option('-j, --json', '以 JSON 格式输出')
  .action(async (options) => {
    const linker = new ModLinker({
      modsDir: options.modsDir,
      storeDir: options.storeDir,
    });

    try {
      const statusList = await linker.status();

      if (options.json) {
        console.log(JSON.stringify(statusList, null, 2));
        return;
      }

      if (statusList.length === 0) {
        console.log('📁 存储目录中没有 mod');
        return;
      }

      const enabled = statusList.filter((s) => s.enabled);
      const disabled = statusList.filter((s) => !s.enabled);

      console.log(`📊 Mod 状态 (${statusList.length} 个)\n`);

      if (enabled.length > 0) {
        console.log(`✅ 已启用 (${enabled.length}):`);
        for (const s of enabled) {
          console.log(`   🟢 ${s.name}`);
        }
        console.log();
      }

      if (disabled.length > 0) {
        console.log(`⛔ 已禁用 (${disabled.length}):`);
        for (const s of disabled) {
          console.log(`   🔴 ${s.name}`);
        }
        console.log();
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`💡 存储目录: ${linker.getConfig().storeDir}`);
      console.log(`💡 Mods 目录: ${linker.getConfig().modsDir}`);
    } catch (error) {
      console.error(`❌ 获取状态失败:`, error);
      process.exit(1);
    }
  });

// 子命令：禁用所有
linkCommand
  .command('disable-all')
  .description('禁用所有已启用的 mod')
  .requiredOption('-m, --mods-dir <path>', '游戏 mods 目录（3DMigoto 加载目录）')
  .requiredOption('-s, --store-dir <path>', 'Mod 存储目录')
  .action(async (options) => {
    const linker = new ModLinker({
      modsDir: options.modsDir,
      storeDir: options.storeDir,
    });

    try {
      const results = await linker.disableAllEnabled();
      if (results.length === 0) {
        console.log('ℹ️  没有已启用的 mod');
      } else {
        console.log(`⛔ 已禁用 ${results.length} 个 mod:`);
        for (const s of results) {
          console.log(`   • ${s.name}`);
        }
      }
    } catch (error) {
      console.error(`❌ 禁用失败:`, error);
      process.exit(1);
    }
  });
