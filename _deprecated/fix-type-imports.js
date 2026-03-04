#!/usr/bin/env node

/**
 * 批量修复 TypeScript verbatimModuleSyntax 错误
 * 将类型导入改为 import type 语法
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 需要修复的文件列表（基于 tsc 错误输出）
const filesToFix = [
  'src/kernels/download/download-helper.ts',
  'src/kernels/file-dialog/file-dialog-helper.ts',
  'src/kernels/file-system/tauri-file-system.ts',
  'src/kernels/file-system/types.ts',
  'src/kernels/image/image-helper.ts',
  'src/kernels/index.ts',
  'src/kernels/script-loader/script-loader-helper.ts',
  'src/kernels/state-manager/reactive-store.ts',
  'src/kernels/symlink/symlink-helper.ts',
  'src/kernels/utils/argv-utils.ts',
  'src/kernels/utils/hash-utils.ts',
  'src/kernels/validation/date-validator.ts',
  'src/kernels/validation/object-validator.ts',
  'src/kernels/validation/string-validator.ts',
  'src/kernels/window/window-helper.ts',
  'src/modules/config-management/config-loader.ts',
  'src/modules/config-management/global-config.ts',
  'src/modules/config-management/index.ts',
  'src/modules/config-management/sub-config.ts',
  'src/modules/i18n/local-helper.ts',
  'src/modules/mod-management/index.ts',
  'src/modules/mod-management/mod-apply.ts',
  'src/modules/mod-management/mod-file-operator.ts',
  'src/modules/mod-management/mod-hotkey.ts',
  'src/modules/mod-management/mod-index-manager.ts',
  'src/modules/mod-management/mod-loader.ts',
  'src/modules/mod-management/mod-metadata.ts',
  'src/modules/mod-management/mod-preview.ts',
  'src/modules/mod-management/mod-source-manager.ts',
  'src/modules/notification/notification-operations.ts',
  'src/modules/plugin-management/plugin-converter.ts',
  'src/modules/plugin-management/plugin-manager.ts',
  'src/modules/plugin-management/plugin-validator.ts',
  'src/modules/repository/repository-crud.ts',
  'src/modules/repository/repository-search.ts',
  'src/modules/repository/repository-state.ts',
  'src/modules/repository/repository-validator.ts',
  'src/modules/router/router-operations.ts',
  'src/modules/updater/update-checker.ts',
  'src/modules/updater/version-info.ts',
  'src/services/app-service/config.ts',
  'src/services/config-service/config-loader.ts',
  'src/services/config-service/config-manager-new.ts',
  'src/services/config-service/config-saver.ts',
  'src/services/config-service/index.ts',
  'src/services/mod-service/config.ts',
  'src/services/mod-service/effect.ts',
  'src/services/mod-service/index.ts',
  'src/services/mod-service/mod-operations.ts',
  'src/services/mod-service/mod-search.ts',
  'src/services/mod-service/mod-state-manager.ts',
  'src/services/mod-service/types.ts',
  'src/services/plugin-service/plugin-service.ts',
  'src/services/ui-service/config.ts',
  'src/services/ui-service/index.ts',
  'src/services/ui-service/types.ts'
];

// 已知的类型名称模式（基于错误信息）
const typePatterns = [
  // Kernel types
  'KernelError', 'Result', 'EventType', 'EventListener', 'EventListenerInfo',
  'ExtendedFileSystem', 'FileInfo', 'FileSystemResult', 'FileChangeEvent', 'FileOptions', 'DirectoryOptions',
  'DownloadOptions', 'FileDialogOptions', 'ImageOptions', 'ScriptLoaderOptions',
  'ReactiveStore', 'StateUpdater', 'SymlinkOptions', 'WindowOptions',
  'HashOptions', 'DateValidationResult', 'ObjectValidationResult', 'StringValidationResult',
  
  // Module types
  'ConfigValidationResult', 'ConfigStatistics', 'ConfigType', 'ConfigValue', 'GlobalConfig', 'LocalConfig', 'RepositoryConfig',
  'ConfigServiceState', 'ConfigSaveOptions', 'ConfigChangeEvent',
  'ModInfo', 'ModStatus', 'ModOperationResult', 'ModLoadOptions', 'ModApplyOptions', 'ModSearchOptions',
  'ModServiceState', 'ModServiceConfig', 'ModServiceOptions', 'ModServiceEvent',
  'NotificationState', 'RouteState', 'Theme',
  
  // Service types
  'UiServiceState', 'UiServiceConfig', 'UiServiceOptions', 'UiService',
  'PluginServiceState', 'PluginServiceConfig', 'PluginServiceOptions', 'PluginService',
  'AppServiceState', 'AppServiceConfig', 'AppServiceOptions', 'AppService'
];

/**
 * 检查一个导入项是否为类型
 */
function isTypeImport(importName) {
  // 检查是否匹配已知的类型模式
  return typePatterns.some(pattern => 
    importName.includes(pattern) || 
    importName.endsWith('Type') ||
    importName.endsWith('State') ||
    importName.endsWith('Config') ||
    importName.endsWith('Options') ||
    importName.endsWith('Result') ||
    importName.endsWith('Event') ||
    importName.endsWith('Info') ||
    importName.endsWith('Error')
  );
}

/**
 * 修复单个文件的类型导入
 */
function fixFileTypeImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 匹配 import 语句的正则表达式
    const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"];?/g;
    
    const newContent = content.replace(importRegex, (match, imports, fromPath) => {
      const importItems = imports.split(',').map(item => item.trim());
      const typeImports = [];
      const valueImports = [];
      
      importItems.forEach(item => {
        // 处理 as 重命名的情况
        const [originalName, alias] = item.split(' as ').map(s => s.trim());
        const displayName = alias || originalName;
        
        if (isTypeImport(originalName)) {
          typeImports.push(item);
        } else {
          valueImports.push(item);
        }
      });
      
      if (typeImports.length === 0) {
        return match; // 没有类型导入，保持原样
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
  console.log('🧪 Testing fix on a few files...');
  
  const testFiles = filesToFix.slice(0, 3); // 只测试前3个文件
  let successCount = 0;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const success = fixFileTypeImports(file);
      if (success) successCount++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Test results: ${successCount}/${testFiles.length} files fixed`);
  
  // 运行类型检查测试
  try {
    console.log('\n🔍 Running TypeScript check...');
    execSync('bun tsc --noEmit', { stdio: 'pipe' });
    console.log('✅ TypeScript check passed!');
    return true;
  } catch (error) {
    console.log('❌ TypeScript check failed, but this is expected during testing');
    return false;
  }
}

/**
 * 应用修复到所有文件
 */
function applyFixToAllFiles() {
  console.log('🚀 Applying fix to all files...');
  
  let totalFixed = 0;
  let totalFiles = 0;
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      totalFiles++;
      const success = fixFileTypeImports(file);
      if (success) totalFixed++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Final results: ${totalFixed}/${totalFiles} files fixed`);
}

// 主执行逻辑
function main() {
  console.log('🔧 TypeScript Import Type Fixer');
  console.log('================================\n');
  
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    // 测试模式
    testFix();
  } else if (args.includes('--apply')) {
    // 应用模式
    applyFixToAllFiles();
  } else {
    // 默认：先测试，再询问是否应用
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
