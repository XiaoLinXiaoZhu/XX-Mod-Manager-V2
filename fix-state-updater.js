#!/usr/bin/env node

/**
 * 修复 Service 层状态更新问题
 * 将对象字面量更新改为 StateUpdater 函数
 */

import fs from 'fs';

// 需要修复的文件列表
const filesToFix = [
  'src/services/mod-service/mod-state-manager.ts',
  'src/services/ui-service/index.ts',
  'src/services/plugin-service/plugin-service.ts'
];

/**
 * 修复单个文件的状态更新问题
 */
function fixFileStateUpdates(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // 匹配 updateState 调用，传递对象字面量的情况
    const updateStateRegex = /this\.stateStore\.updateState\(\{\s*([^}]+)\s*\}\)/g;
    
    const newContent = content.replace(updateStateRegex, (match, objectContent) => {
      // 解析对象内容
      const properties = objectContent.split(',').map(prop => prop.trim());
      
      // 生成 StateUpdater 函数
      const updaterFunction = `(currentState) => ({
        ...currentState,
        ${properties.join(',\n        ')}
      })`;
      
      modified = true;
      return `this.stateStore.updateState(${updaterFunction})`;
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
  console.log('🧪 Testing state updater fix...');
  
  const testFiles = filesToFix.slice(0, 1); // 只测试第一个文件
  let successCount = 0;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const success = fixFileStateUpdates(file);
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
  console.log('🚀 Applying state updater fix to all files...');
  
  let totalFixed = 0;
  let totalFiles = 0;
  
  filesToFix.forEach(file => {
    if (fs.existsSync(file)) {
      totalFiles++;
      const success = fixFileStateUpdates(file);
      if (success) totalFixed++;
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log(`\n📊 Final results: ${totalFixed}/${totalFiles} files fixed`);
}

// 主执行逻辑
function main() {
  console.log('🔧 State Updater Fixer');
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
