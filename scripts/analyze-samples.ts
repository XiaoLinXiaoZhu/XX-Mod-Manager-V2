/**
 * 分析所有 mod 样本，找出特殊或异常的 mod
 */

import { parseModIni } from '../packages/core/src';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const SAMPLES_DIR = 'data/mod-samples';

interface ModAnalysis {
  name: string;
  path: string;
  iniCount: number;
  totalHashes: number;
  keyBindings: number;
  variables: number;
  customShaders: number;
  commandLists: number;
  conditionalBlocks: number;
  errors: string[];
  specialFeatures: string[];
}

async function findIniFiles(dir: string): Promise<string[]> {
  const results: string[] = [];
  
  async function scan(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ini')) {
        if (!entry.name.includes('DISABLED_BACKUP')) {
          results.push(fullPath);
        }
      }
    }
  }
  
  await scan(dir);
  return results;
}

async function analyzeMod(modPath: string): Promise<ModAnalysis> {
  const name = modPath.split(/[/\\]/).pop() || modPath;
  const analysis: ModAnalysis = {
    name,
    path: modPath,
    iniCount: 0,
    totalHashes: 0,
    keyBindings: 0,
    variables: 0,
    customShaders: 0,
    commandLists: 0,
    conditionalBlocks: 0,
    errors: [],
    specialFeatures: [],
  };

  try {
    const iniFiles = await findIniFiles(modPath);
    analysis.iniCount = iniFiles.length;

    const allHashes = new Set<string>();

    for (const iniFile of iniFiles) {
      try {
        const content = await Bun.file(iniFile).text();
        const parsed = parseModIni(content, iniFile);

        // 收集统计
        for (const hash of parsed.hashes) {
          allHashes.add(hash);
        }
        analysis.keyBindings += parsed.keyBindings.length;
        analysis.variables += parsed.constants.length;
        analysis.customShaders += parsed.customShaders.length;
        analysis.commandLists += parsed.commandLists.length;

        // 统计条件块
        for (const to of parsed.textureOverrides) {
          analysis.conditionalBlocks += to.conditionalBlocks.length;
        }

        // 检测特殊功能
        if (parsed.keyBindings.length > 0) {
          const keys = parsed.keyBindings.map(kb => kb.key).join(', ');
          if (!analysis.specialFeatures.includes(`按键切换: ${keys}`)) {
            analysis.specialFeatures.push(`按键切换: ${keys}`);
          }
        }

        if (parsed.customShaders.length > 0) {
          analysis.specialFeatures.push(`自定义着色器 x${parsed.customShaders.length}`);
        }

        // 检测 persist 变量
        const persistVars = parsed.constants.filter(v => v.persist);
        if (persistVars.length > 0) {
          analysis.specialFeatures.push(`持久化变量 x${persistVars.length}`);
        }

        // 检测未识别的 section
        if (parsed.rawSections.length > 0) {
          const unknownTypes = new Set(parsed.rawSections.map(s => {
            const match = s.name.match(/^([A-Za-z]+)/);
            return match ? match[1] : s.name;
          }));
          for (const type of unknownTypes) {
            if (!['Constants', 'Key', 'TextureOverride', 'Resource', 'CommandList', 'CustomShader', 'Present'].some(
              known => type.toLowerCase().startsWith(known.toLowerCase())
            )) {
              analysis.specialFeatures.push(`未知 section 类型: ${type}`);
            }
          }
        }

        // 检测特殊属性
        for (const section of parsed.rawSections) {
          const props = Object.keys(section.properties);
          for (const prop of props) {
            // 检测一些不常见的属性
            if (['topology', 'cull', 'fill', 'depth', 'stencil'].includes(prop.toLowerCase())) {
              analysis.specialFeatures.push(`渲染状态修改: ${prop}`);
            }
          }
        }

      } catch (err) {
        analysis.errors.push(`解析失败 ${iniFile}: ${err}`);
      }
    }

    analysis.totalHashes = allHashes.size;

  } catch (err) {
    analysis.errors.push(`扫描失败: ${err}`);
  }

  return analysis;
}

async function main() {
  console.log('🔍 分析所有 mod 样本...\n');

  const entries = await readdir(SAMPLES_DIR, { withFileTypes: true });
  const modDirs = entries
    .filter(e => e.isDirectory())
    .map(e => join(SAMPLES_DIR, e.name));

  console.log(`📁 找到 ${modDirs.length} 个 mod\n`);

  const analyses: ModAnalysis[] = [];

  for (const modDir of modDirs) {
    const analysis = await analyzeMod(modDir);
    analyses.push(analysis);
  }

  // 统计汇总
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 统计汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const totalInis = analyses.reduce((sum, a) => sum + a.iniCount, 0);
  const totalHashes = analyses.reduce((sum, a) => sum + a.totalHashes, 0);
  const totalKeyBindings = analyses.reduce((sum, a) => sum + a.keyBindings, 0);
  const totalVariables = analyses.reduce((sum, a) => sum + a.variables, 0);
  const totalShaders = analyses.reduce((sum, a) => sum + a.customShaders, 0);
  const totalErrors = analyses.reduce((sum, a) => sum + a.errors.length, 0);

  console.log(`   INI 文件总数: ${totalInis}`);
  console.log(`   Hash 总数: ${totalHashes}`);
  console.log(`   按键绑定总数: ${totalKeyBindings}`);
  console.log(`   变量定义总数: ${totalVariables}`);
  console.log(`   自定义着色器总数: ${totalShaders}`);
  console.log(`   解析错误总数: ${totalErrors}`);

  // 有按键绑定的 mod
  const modsWithKeys = analyses.filter(a => a.keyBindings > 0);
  if (modsWithKeys.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🎮 有按键绑定的 mod (${modsWithKeys.length})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    for (const mod of modsWithKeys) {
      const keyFeature = mod.specialFeatures.find(f => f.startsWith('按键切换'));
      console.log(`   ${mod.name}`);
      if (keyFeature) console.log(`      ${keyFeature}`);
    }
  }

  // 有自定义着色器的 mod
  const modsWithShaders = analyses.filter(a => a.customShaders > 0);
  if (modsWithShaders.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✨ 有自定义着色器的 mod (${modsWithShaders.length})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    for (const mod of modsWithShaders) {
      console.log(`   ${mod.name} (${mod.customShaders} 个着色器)`);
    }
  }

  // 有特殊功能的 mod
  const modsWithSpecial = analyses.filter(a => 
    a.specialFeatures.some(f => 
      !f.startsWith('按键切换') && 
      !f.startsWith('自定义着色器') &&
      !f.startsWith('持久化变量')
    )
  );
  if (modsWithSpecial.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔮 有特殊功能的 mod (${modsWithSpecial.length})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    for (const mod of modsWithSpecial) {
      const special = mod.specialFeatures.filter(f => 
        !f.startsWith('按键切换') && 
        !f.startsWith('自定义着色器') &&
        !f.startsWith('持久化变量')
      );
      if (special.length > 0) {
        console.log(`   ${mod.name}`);
        for (const feat of special) {
          console.log(`      ⚡ ${feat}`);
        }
      }
    }
  }

  // 解析错误
  const modsWithErrors = analyses.filter(a => a.errors.length > 0);
  if (modsWithErrors.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`❌ 有解析错误的 mod (${modsWithErrors.length})`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    for (const mod of modsWithErrors) {
      console.log(`   ${mod.name}`);
      for (const err of mod.errors) {
        console.log(`      ❌ ${err}`);
      }
    }
  }

  // 复杂度排名（按条件块数量）
  const complexMods = analyses
    .filter(a => a.conditionalBlocks > 0)
    .sort((a, b) => b.conditionalBlocks - a.conditionalBlocks)
    .slice(0, 10);
  
  if (complexMods.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🧩 复杂度排名 (按条件块数量)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    for (const mod of complexMods) {
      console.log(`   ${mod.conditionalBlocks.toString().padStart(3)} 条件块 - ${mod.name}`);
    }
  }

  console.log('\n✅ 分析完成！');
}

main().catch(console.error);
