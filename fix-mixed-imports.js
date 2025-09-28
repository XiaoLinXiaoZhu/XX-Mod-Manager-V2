#!/usr/bin/env node

/**
 * 修复混合导入问题
 * 将枚举、常量等值导入从 import type 中分离出来
 */

import fs from 'fs';

// 需要修复的文件列表（基于错误信息）
const filesToFix = [
  'src/services/mod-service/index.ts',
  'src/services/mod-service/mod-operations.ts',
  'src/services/mod-service/mod-state-manager.ts',
  'src/services/plugin-service/plugin-service.ts',
  'src/services/ui-service/index.ts'
];

// 已知的枚举和常量（应该作为值导入）
const valueImports = [
  'ModStatus',
  'ModServiceEvent',
  'PluginServiceEventType',
  'PluginStatus',
  'UiServiceEvent',
  'ReactiveStore',
  'EventEmitter',
  'updateModStatusEffect',
  'validatePluginInfo',
  'createInitialRouteState',
  'updateRouteState',
  'createInitialNotificationState',
  'addNotificationToState',
  'removeNotificationFromState',
  'createNotificationConfig',
  'validateNotificationConfig',
  'mergeUiServiceConfig'
];

/**
 * 检查一个导入项是否为值导入
 */
function isValueImport(importName) {
  return valueImports.some(pattern => 
    importName.includes(pattern) || 
    importName.endsWith('Status') ||
    importName.endsWith('Event') ||
    importName.endsWith('Type') ||
    importName.endsWith('Store') ||
    importName.endsWith('Emitter') ||
    importName.startsWith('update') ||
    importName.startsWith('create') ||
    importName.startsWith('validate') ||
    importName.startsWith('add') ||
    importName.startsWith('remove') ||
    importName.startsWith('merge')
  );
}

/**
 * 修复单个文件的混合导入问题
 */
function fixFileMixedImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 匹配 import type 语句的正则表达式
    const importTypeRegex = /import\s+type\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"];?/g;
    
    const newContent = content.replace(importTypeRegex, (match, imports, fromPath) => {
      const importItems = imports.split(',').map(item => item.trim());
      const typeImports = [];
      const valueImports = [];
      
      importItems.forEach(item => {
        // 处理 as 重命名的情况
        const [originalName, alias] = item.split(' as ').map(s => s.trim());
        const displayName = alias || originalName;
        
        if (isValueImport(originalName)) {
          valueImports.push(item);
        } else {
          typeImports.push(item);
        }
      });
      
      if (valueImports.length === 0) {
        return match; // 没有值导入，保持原样
      }
      
      modified = true;
      
      let result = '';
      
      // 如果有值导入，先输出值导入
      if (valueImports.length > 0) {
        result += `import { ${valueImports.join(', ')} } from '${fromPath}';\n`;
      }
      
      // 输出类型导入
      if (typeImports.length > 0) {
        result += `import type { ${typeImports.join(', ')} } from '${fromPath}';`;
      }
      
      return result;
    });
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    } else {
      console.log(`⏭️  No changes needed: ${filePath}`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * 测试修复效果
 */
function testFix() {
  console.log('🧪 Testing mixed imports fix...');
  
  const testFiles = filesToFix.slice(0, 2); // 只测试前2个文件
  let successCount = 0;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const success = fixFileMixedImports(file);
      if (success) successCount++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Test results: ${successCount}/${testFiles.length} files fixed`);
  return successCount > 0;
}

/**
 * 应用修复到所有文件
 */
function applyFixToAllFiles() {
  console.log('🚀 Applying mixed imports fix to all files...');
  
  let totalFixed = 0;
  let totalFiles = 0;
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      totalFiles++;
      const success = fixFileMixedImports(file);
      if (success) totalFixed++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Final results: ${totalFixed}/${totalFiles} files fixed`);
}

// 主执行逻辑
function main() {
  console.log('🔧 Mixed Imports Fixer');
  console.log('======================\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testFix();
  } else if (args.includes('--apply')) {
    applyFixToAllFiles();
  } else {
    const testSuccess = testFix();
    
    if (testSuccess) {
      console.log('\n✅ Test successful! Ready to apply to all files.');
      console.log('Run with --apply to fix all files.');
    } else {
      console.log('\n❌ Test failed. Please check the issues before applying to all files.');
    }
  }
}

main();
