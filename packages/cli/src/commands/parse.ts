/**
 * parse 命令 - 解析并显示 mod 的详细信息
 */

import { Command } from 'commander';
import { parseIni } from '@xxmm/ini-parser';
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
      const iniFiles = await findIniFiles(modPath);

      if (iniFiles.length === 0) {
        console.error('❌ 未找到 INI 文件');
        process.exit(1);
      }

      console.log(`📁 Mod: ${modPath}`);
      console.log(`📄 找到 ${iniFiles.length} 个 INI 文件\n`);

      for (const iniFile of iniFiles) {
        const content = await Bun.file(iniFile).text();
        const parsed = parseIni(content, iniFile);

        if (options.json) {
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

        // 命名空间
        if (parsed.namespace) {
          console.log(`\n🏷️  命名空间: ${parsed.namespace}`);
        }

        // 头部注释
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

        // 着色器覆盖
        if (parsed.shaderOverrides.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n🔮 着色器覆盖 (${parsed.shaderOverrides.length}):`);
          for (const so of parsed.shaderOverrides) {
            console.log(`   ${so.sectionName} → ${so.hash}`);
          }
        }

        // 着色器正则
        if (parsed.shaderRegexes.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n⚡ 着色器正则 (${parsed.shaderRegexes.length}):`);
          for (const sr of parsed.shaderRegexes) {
            console.log(`   ${sr.sectionName} ${sr.shaderModel ? `(${sr.shaderModel})` : ''}`);
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

        // 未知 section
        if (parsed.unknownSections.length > 0 && !options.keys && !options.resources && !options.variables) {
          console.log(`\n❓ 未识别 section (${parsed.unknownSections.length}):`);
          for (const s of parsed.unknownSections.slice(0, 5)) {
            console.log(`   ${s.name}`);
          }
          if (parsed.unknownSections.length > 5) {
            console.log(`   ... 还有 ${parsed.unknownSections.length - 5} 个`);
          }
        }

        console.log();
      }

    } catch (error) {
      console.error('❌ 发生错误:', error);
      process.exit(1);
    }
  });

async function findIniFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
      if (!entry.name.includes('DISABLED_BACKUP')) {
        results.push(join(dir, entry.name));
      }
    }
  }
  
  return results;
}
