/**
 * 设置功能兼容桥接层
 * 提供旧设置系统的兼容接口
 */

import { 
  createSettingBarData,
  type SettingBarData,
  type SettingBarDataMultiDir
} from '@/modules/settings';

// 创建默认设置数据
const defaultSettingData = createSettingBarData();

// 兼容的设置数据类型
export type { SettingBarData, SettingBarDataMultiDir };

// 兼容的设置数据
export const settingBarData = defaultSettingData;

// 兼容的设置配置
export const settingBarConfig = {
  // 设置项
  items: defaultSettingData.items,
  
  // 多目录设置
  multiDirItems: defaultSettingData.multiDirItems,
  
  // 设置操作
  addItem: (item: any) => defaultSettingData.addItem(item),
  removeItem: (id: string) => defaultSettingData.removeItem(id),
  updateItem: (id: string, updates: any) => defaultSettingData.updateItem(id, updates),
  
  // 设置验证
  validate: (data: any) => defaultSettingData.validate(data),
  
  // 设置保存/加载
  save: () => defaultSettingData.save(),
  load: () => defaultSettingData.load(),
  
  // 事件监听
  on: (event: string, callback: Function) => defaultSettingData.on(event, callback),
  off: (event: string, callback: Function) => defaultSettingData.off(event, callback),
  emit: (event: string, ...args: any[]) => defaultSettingData.emit(event, ...args)
};

// 导出设置栏组件
export { default as settingBar } from '@/ui/section/settingBar.vue';

// 导出设置数据
export { default as settingSectionData } from '@/ui/section/settingSectionData.ts';
export { default as globalSettingSectionData } from '@/ui/section/globalSettingSectionData.ts';
