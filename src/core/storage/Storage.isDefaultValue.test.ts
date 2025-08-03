import { Storage } from "./Storage";
import { expect, test } from "bun:test";

// 测试isDefaultValue功能
test('Storage isDefaultValue functionality', () => {
    const storage = new Storage('test');
    storage._strictMode = false; // 关闭严格模式
    
    // 测试1: useStorage创建的值为默认值
    const defaultValue = storage.useStorage('testKey', 'default');
    expect(defaultValue.isDefaultValue).toBe(true);
    
    // 测试2: 修改值后不再是默认值
    defaultValue.value = 'userModified';
    expect(defaultValue.isDefaultValue).toBe(false);
    
    // 测试3: toObject包含非默认值
    expect(storage.toObject()).toEqual({ testKey: 'userModified' });
});

test('Storage merge with default values', () => {
    const storage = new Storage('test2');
    storage._strictMode = false; // 关闭严格模式
    
    // 创建默认值
    storage.useStorage('lang', 'en');
    
    // 验证初始状态
    expect(storage.toObject()).toEqual({}); // 默认值不应出现在toObject中
    
    // 模拟从配置文件加载
    storage.mergeData({ lang: 'zh-cn' });
    
    // 验证合并后值
    expect(storage.useStorage('lang', 'en').value).toBe('zh-cn');
    expect(storage.toObject()).toEqual({ lang: 'zh-cn' });
});

test('Storage merge preserves user changes', () => {
    const storage = new Storage('test3');
    storage._strictMode = false; // 关闭严格模式
    
    // 用户修改值
    const langRef = storage.useStorage('lang', 'en');
    langRef.value = 'fr'; // 用户修改
    
    // 验证用户修改后不再是默认值
    expect(langRef.isDefaultValue).toBe(false);
    
    // 尝试合并配置文件中的值
    storage.mergeData({ lang: 'de' });
    
    // 用户修改应该被保留
    expect(langRef.value).toBe('fr');
    expect(storage.toObject()).toEqual({ lang: 'fr' });
});

test('Storage force merge overrides user changes', () => {
    const storage = new Storage('test4');
    storage._strictMode = false; // 关闭严格模式
    
    // 用户修改值
    const langRef = storage.useStorage('lang', 'en');
    langRef.value = 'fr';
    
    // 强制合并应该覆盖用户修改
    storage.mergeData({ lang: 'de' }, true);
    
    expect(langRef.value).toBe('de');
    expect(langRef.isDefaultValue).toBe(false);
    expect(storage.toObject()).toEqual({ lang: 'de' });
});

test('Storage empty values handling', () => {
    const storage = new Storage('test5');
    storage._strictMode = false; // 关闭严格模式
    
    // 创建默认值
    storage.useStorage('empty', '');
    storage.useStorage('null', null);
    storage.useStorage('undefined', undefined);
    
    // 空值应该被配置文件中的值替换
    storage.mergeData({
        empty: 'notEmpty',
        null: 'notNull',
        undefined: 'notUndefined'
    });
    
    expect(storage.useStorage('empty', '').value).toBe('notEmpty');
    expect(storage.useStorage('null', '').value).toBe('notNull');
    expect(storage.useStorage('undefined', '').value).toBe('notUndefined');
});