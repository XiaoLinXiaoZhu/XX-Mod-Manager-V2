import { computed, watch } from "vue";
import { Storage } from "./Storage";
import { expect, test } from "bun:test";

// 测试基础赋值操作
test('Storage basic set and get', () => {
    const storage = new Storage('TestStorage');
    storage._strictMode = false; // 关闭严格模式，允许直接赋值
    storage.mergeData({ key1: 'value1', key2: 'value2' });

    expect(storage.useStorage('key1', 'default').refImpl.value).toBe('value1');
    expect(storage.useStorage('key2', 'default').refImpl.value).toBe('value2');
});

// 测试 严格和 非严格模式下的赋值
test('Storage strict mode set', () => {
    const storage = new Storage('TestStorage');
    storage._strictMode = true; // 开启严格模式

    // 在严格模式下，updateValue方法只会警告，不会抛出错误
    // 但是通过StorageValue的value setter会检查canSet
    const storageValue = storage.useStorage('key1', 'default');
    
    // 设置值应该不会改变，因为canSet为false
    storageValue.value = 'value1';
    expect(storageValue.refImpl.value).toBe('default'); // 值不应该改变

    storage._strictMode = false; // 关闭严格模式
    storageValue.value = 'value1'; // 现在可以设置值
    expect(storageValue.refImpl.value).toBe('value1');
});

// 测试数据合并,区别强制合并和非强制合并
test('Storage merge data', () => {
    const data1 = {
        keyString: 'value1',
        keyNumber: 123,
        keyBoolean: true,
        keyObject: { nestedKey: 'nestedValue' },
        keyArray: [1, 2, 3],
        emptyKey: '',
        nullKey: null,
        undefinedKey: undefined,
        emptyArray: [],
        emptyObject: {}
    };
    const data2 = {
        keyString: 'newValue',
        keyNumber: 456,
        keyBoolean: false,
        keyObject: { nestedKey: 'newNestedValue' },
        keyArray: [4, 5, 6],
        emptyKey: 'notEmpty',
        nullKey: 'notNull',
        undefinedKey: 'notUndefined',
        emptyArray: [7, 8],
        emptyObject: { newKey: 'newValue' }
    };

    // 测试非强制合并
    const storage1 = new Storage('TestStorage1');
    storage1._strictMode = false; // 关闭严格模式，允许直接赋值
    storage1.mergeData(data1, false);
    storage1.mergeData(data2, false); // 第二次非强制合并
    expect(storage1.useStorage('keyString', 'default').refImpl.value).toBe('value1');
    expect(storage1.useStorage('keyNumber', 0).refImpl.value).toBe(123);
    expect(storage1.useStorage('keyBoolean', false).refImpl.value).toBe(true);
    expect(storage1.useStorage('keyObject', {}).refImpl.value).toEqual({ nestedKey: 'nestedValue' });
    expect(storage1.useStorage<number[]>('keyArray', []).refImpl.value).toEqual([1, 2, 3]);
    // 空值应该会被智能合并
    expect(storage1.useStorage('emptyKey', 'default').refImpl.value).toBe('notEmpty'); 
    expect(storage1.useStorage('nullKey', 'default').refImpl.value).toBe('notNull');
    expect(storage1.useStorage('undefinedKey', 'default').refImpl.value).toBe('notUndefined');
    expect(storage1.useStorage<number[]>('emptyArray', []).refImpl.value).toEqual([7, 8]);
    expect(storage1.useStorage('emptyObject', {}).refImpl.value).toEqual({ newKey: 'newValue' });

    // 测试强制合并
    const storage2 = new Storage('TestStorage2');
    storage2._strictMode = false; // 关闭严格模式，允许直接赋值
    storage2.mergeData(data1, true);
    storage2.mergeData(data2, true);
    expect(storage2.useStorage('keyString', 'default').refImpl.value).toBe('newValue');
    expect(storage2.useStorage('keyNumber', 0).refImpl.value).toBe(456);
    expect(storage2.useStorage('keyBoolean', false).refImpl.value).toBe(false);
    expect(storage2.useStorage('keyObject', {}).refImpl.value).toEqual({ nestedKey: 'newNestedValue' });
    expect(storage2.useStorage<number[]>('keyArray', []).refImpl.value).toEqual([4, 5, 6]);
    // 强制合并会覆盖空值
    expect(storage2.useStorage('emptyKey', 'default').refImpl.value).toBe('notEmpty');
    expect(storage2.useStorage('nullKey', 'default').refImpl.value).toBe('notNull');
    expect(storage2.useStorage('undefinedKey', 'default').refImpl.value).toBe('notUndefined');
    expect(storage2.useStorage<number[]>('emptyArray', []).refImpl.value).toEqual([7, 8]);
    expect(storage2.useStorage('emptyObject', {}).refImpl.value).toEqual({ newKey: 'newValue' });
});

// 测试响应式更新
test('Storage reactive update', async () => {
    const storage = new Storage('TestStorageReactive');
    storage._strictMode = false; // 关闭严格模式

    const key = 'reactiveKey';
    const defaultValue = 'defaultValue';
    const storageValue = storage.useStorage(key, defaultValue);

    // 测试初始值
    expect(storageValue.refImpl.value).toBe(defaultValue);

    // 测试更新值
    storageValue.value = 'newValue';
    expect(storageValue.refImpl.value).toBe('newValue');

    // compute 监听更新
    let computedValue = computed(() => {
        return `Computed: ${storageValue.refImpl.value}`;
    });
    expect(computedValue.value).toBe('Computed: newValue');
    // 更新 storageValue
    storageValue.value = 'updatedValue';
    expect(computedValue.value).toBe('Computed: updatedValue');

    // watch 监听更新
    let watchedValue = '';
    watch(storageValue.refImpl, (newValue) => {
        console.log(`Watched new value: ${newValue}`);
        watchedValue = newValue;
    }, { immediate: true });
    
    expect(watchedValue).toBe('updatedValue'); // immediate 立即触发
    
    storageValue.value = 'finalValue'; // 触发 watch
    expect(storageValue.refImpl.value).toBe('finalValue');
    
    // 等待一个微任务让watch回调执行
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(watchedValue).toBe('finalValue');
});
