/**
 * archive 命令 - Mod 归档管理
 */

import { Command } from 'commander';
import { ModArchive } from '@xxmm/chunk-store';
import { resolve } from 'path';

export const archiveCommand = new Command('archive')
  .description('Mod 归档管理（chunk 去重存储）');

// 子命令：添加 mod 到归档
archiveCommand
  .command('add <modPath>')
  .description('将 mod 添加到归档')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .option('-n, --name <name>', 'Mod 名称')
  .option('-i, --id <id>', 'Mod ID')
  .action(async (modPath: string, options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      console.log(`正在归档: ${modPath}`);
      const manifest = await archive.archiveModAsync(
        resolve(modPath),
        options.id,
        options.name
      );
      
      console.log(`\n✅ 归档完成`);
      console.log(`   ID: ${manifest.id}`);
      console.log(`   名称: ${manifest.name}`);
      console.log(`   原始大小: ${(manifest.originalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`   文件数: ${manifest.files.length} 个资源文件, ${manifest.preservedFiles.length} 个保留文件`);
      
      const stats = archive.getStats();
      console.log(`\n📊 归档统计:`);
      console.log(`   总 mod 数: ${stats.modCount}`);
      console.log(`   去重率: ${(stats.deduplicationRatio * 100).toFixed(1)}%`);
    } finally {
      archive.close();
    }
  });

// 子命令：解压 mod
archiveCommand
  .command('extract <modId> <outputPath>')
  .description('从归档解压 mod')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (modId: string, outputPath: string, options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      console.log(`正在解压: ${modId} -> ${outputPath}`);
      await archive.extractMod(modId, resolve(outputPath));
      console.log(`✅ 解压完成`);
    } finally {
      archive.close();
    }
  });

// 子命令：列出所有 mod
archiveCommand
  .command('list')
  .description('列出归档中的所有 mod')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      const mods = archive.listMods();
      
      if (mods.length === 0) {
        console.log('归档为空');
        return;
      }
      
      console.log(`共 ${mods.length} 个 mod:\n`);
      for (const mod of mods) {
        const date = new Date(mod.createdAt).toLocaleString();
        console.log(`  ${mod.id}`);
        console.log(`    名称: ${mod.name}`);
        console.log(`    创建: ${date}`);
        console.log();
      }
    } finally {
      archive.close();
    }
  });

// 子命令：删除 mod
archiveCommand
  .command('remove <modId>')
  .description('从归档删除 mod')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (modId: string, options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      const success = await archive.removeMod(modId);
      if (success) {
        console.log(`✅ 已删除: ${modId}`);
      } else {
        console.log(`❌ 未找到: ${modId}`);
      }
    } finally {
      archive.close();
    }
  });

// 子命令：垃圾回收
archiveCommand
  .command('gc')
  .description('清理无引用的块')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      console.log('正在执行垃圾回收...');
      const { deletedChunks, freedSize } = await archive.gc();
      console.log(`✅ 完成`);
      console.log(`   删除块数: ${deletedChunks}`);
      console.log(`   释放空间: ${(freedSize / 1024 / 1024).toFixed(2)} MB`);
    } finally {
      archive.close();
    }
  });

// 子命令：统计信息
archiveCommand
  .command('stats')
  .description('显示归档统计信息')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (options) => {
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      const stats = archive.getStats();
      
      console.log('📊 归档统计:\n');
      console.log(`  Mod 数量: ${stats.modCount}`);
      console.log(`  唯一块数: ${stats.uniqueChunks.toLocaleString()}`);
      console.log(`  存储大小: ${(stats.totalStoredSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  原始大小: ${(stats.totalOriginalSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  去重率: ${(stats.deduplicationRatio * 100).toFixed(1)}%`);
      console.log(`  节省空间: ${((stats.totalOriginalSize - stats.totalStoredSize) / 1024 / 1024).toFixed(2)} MB`);
    } finally {
      archive.close();
    }
  });

// 子命令：批量归档
archiveCommand
  .command('batch <modsDir>')
  .description('批量归档目录下的所有 mod')
  .option('-a, --archive <path>', '归档目录', './mod-archive')
  .action(async (modsDir: string, options) => {
    const { readdir, stat } = await import('fs/promises');
    const { join } = await import('path');
    
    const archive = new ModArchive(resolve(options.archive));
    
    try {
      const entries = await readdir(resolve(modsDir), { withFileTypes: true });
      const dirs = entries.filter(e => e.isDirectory());
      
      console.log(`发现 ${dirs.length} 个 mod 目录\n`);
      
      let success = 0;
      let failed = 0;
      
      for (const dir of dirs) {
        const modPath = join(resolve(modsDir), dir.name);
        try {
          process.stdout.write(`归档: ${dir.name}... `);
          await archive.archiveModAsync(modPath, dir.name, dir.name);
          console.log('✅');
          success++;
        } catch (e) {
          console.log(`❌ ${e}`);
          failed++;
        }
      }
      
      console.log(`\n完成: ${success} 成功, ${failed} 失败`);
      
      const stats = archive.getStats();
      console.log(`\n📊 归档统计:`);
      console.log(`   去重率: ${(stats.deduplicationRatio * 100).toFixed(1)}%`);
      console.log(`   存储大小: ${(stats.totalStoredSize / 1024 / 1024).toFixed(2)} MB`);
    } finally {
      archive.close();
    }
  });
