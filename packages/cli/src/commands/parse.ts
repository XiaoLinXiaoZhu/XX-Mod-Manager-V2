/**
 * parse 命令 - 解析并显示 mod 的详细信息
 */

import { Command } from 'commander';
import { parseModIni } from '@xxmm/core';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export const parseCommand = new Command('parse')
  .description('解析 mod 的 INI 文件并显示详细信息')
  .argument('<path>', 'mod 文件夹路径')
  .option('-j, --json', '以 JSON 格式输出')
  .option('-k, --keys', '只显示按键绑定')
  .option('-r, --resources', '只显示资源文件')
  .option('-v, --variables', '只显示变量定义')
  .action(async (modPath: string, options) => {
    try {
      // 查找所有 ini 文件
      const entries = await readdir(modPath, { withFileTypes: true });
      const iniFiles = entries
        .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.ini'))
        .filter((e) => !e.name.includes('DISABLED_BACKUP'))
        .map((e) => join(modPath, e.name));

      if (iniFiles.length === 0) {
        console.error('❌ 未找到 INI 文件');
        process.exit(1);
      }

      console.log(`📁 Mod: ${modPath}`);
      console.log(`📄 找到 ${iniFiles.length} 个 INI 文件\n`);

      for (const iniFile of iniFiles) {
        const content = await Bun.file(iniFile).text();
        const parsed = parseModIni(content, iniFile);

        if (options.json) {
          // JSON 输出时需要转换 Set 为数组
          const jsonOutput = {
            ...parsed,
            hashes: Array.from(parsed.hashes),
          };
          console.log(JSON.stringify(jsonOutput, null, 2));
          continue;
        }

        const fileName = iniFile.split(/[/\\]/).pop();
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📄 ${fileName}`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        // 头部注释（作者信息）
        if (parsed.headerComments.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n💬 注释:`);
          for (const comment of parsed.headerComments.slice(0, 5)) {
            if (comment) console.log(`   ${comment}`);
          }
        }

        // 变量定义
        if (parsed.constants.length > 0 && (!options.keys && !options.resources || options.variables)) {
          console.log(`\n📊 变量定义 (${parsed.constants.length}):`);
          for (const v of parsed.constants) {
            const flags = [
              v.scope === 'global' ? 'global' : '',
              v.persist ? 'persist' : '',
            ].filter(Boolean).join(' ');
            console.log(`   $${v.name} = ${v.defaultValue} ${flags ? `(${flags})` : ''}`);
          }
        }

        // 按键绑定
        if (parsed.keyBindings.length > 0 && (!options.resources && !options.variables || options.keys)) {
          console.log(`\n🎮 按键绑定 (${parsed.keyBindings.length}):`);
          for (const kb of parsed.keyBindings) {
            console.log(`   [${kb.key}] ${kb.type} - ${kb.sectionName}`);
            if (kb.condition) {
              console.log(`      条件: ${kb.condition}`);
            }
            for (const vc of kb.variableChanges) {
              console.log(`      $${vc.variable} → ${vc.values.join(' → ')}`);
            }
          }
        }

        // 纹理覆盖
        if (!options.keys && !options.resources && !options.variables) {
          console.log(`\n🎨 纹理覆盖 (${parsed.textureOverrides.length}):`);
          const hashGroups = new Map<string, string[]>();
          for (const to of parsed.textureOverrides) {
            const sections = hashGroups.get(to.hash) || [];
            sections.push(to.sectionName);
            hashGroups.set(to.hash, sections);
          }
          for (const [hash, sections] of hashGroups) {
            console.log(`   ${hash}: ${sections.length} section(s)`);
          }
        }

        // 资源文件
        if (parsed.resources.length > 0 && (!options.keys && !options.variables || options.resources)) {
          const filesResources = parsed.resources.filter((r) => r.filename);
          if (filesResources.length > 0) {
            console.log(`\n📦 资源文件 (${filesResources.length}):`);
            for (const r of filesResources.slice(0, 10)) {
              const typeInfo = r.type ? `[${r.type}]` : '';
              console.log(`   ${r.filename} ${typeInfo}`);
            }
            if (filesResources.length > 10) {
              console.log(`   ... 还有 ${filesResources.length - 10} 个文件`);
            }
          }
        }

        // 自定义着色器
        if (parsed.customShaders.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n✨ 自定义着色器 (${parsed.customShaders.length}):`);
          for (const cs of parsed.customShaders) {
            console.log(`   ${cs.sectionName}`);
          }
        }

        // 命令列表
        if (parsed.commandLists.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n📜 命令列表 (${parsed.commandLists.length}):`);
          for (const cl of parsed.commandLists) {
            console.log(`   ${cl.sectionName}`);
          }
        }

        console.log();
      }

    } catch (error) {
      console.error('❌ 发生错误:', error);
      process.exit(1);
    }
  });
