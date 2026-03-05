/**
 * 测试 Rust wrapper
 */

import { ModArchive } from '../packages/chunk-store/src/rust-wrapper';

async function main() {
  const archive = new ModArchive('./temp/wrapper-test');
  
  console.log('测试 Rust wrapper\n');
  
  // 1. 归档
  console.log('1. 归档 mod...');
  const result = await archive.archiveMod(
    'data/mod-samples/露西-泳装',
    'test-wrapper',
    '露西泳装测试'
  );
  console.log(`   ID: ${result.id}`);
  console.log(`   耗时: ${result.time}s`);
  console.log(`   大小: ${(result.originalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // 2. 统计
  console.log('\n2. 获取统计...');
  const stats = await archive.getStats();
  console.log(`   Mod 数: ${stats.modCount}`);
  console.log(`   去重率: ${(stats.deduplicationRatio * 100).toFixed(1)}%`);
  
  // 3. 列表
  console.log('\n3. 列出 mod...');
  const mods = await archive.listMods();
  for (const mod of mods) {
    console.log(`   - ${mod.id}: ${mod.name}`);
  }
  
  // 4. 解压
  console.log('\n4. 解压 mod...');
  await archive.extractMod('test-wrapper', './temp/wrapper-extract');
  console.log('   完成');
  
  // 5. 删除
  console.log('\n5. 删除 mod...');
  const deleted = await archive.removeMod('test-wrapper');
  console.log(`   删除: ${deleted}`);
  
  console.log('\n✅ 所有测试通过');
}

main().catch(console.error);
