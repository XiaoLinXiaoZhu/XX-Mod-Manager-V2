import { ref, shallowRef } from "vue";
import { RebindableRef } from "./RebindableRef";
import { expect, test, describe } from "bun:test";

describe('RebindableShallowRef', () => {
    test('基础构造和值访问', () => {
        const rebindableRef = new RebindableRef('initial');
        
        expect(rebindableRef.value).toBe('initial');
        expect(rebindableRef.ref.value).toBe('initial');
    });

    test('基础值设置', () => {
        const rebindableRef = new RebindableRef('initial');
        
        rebindableRef.value = 'updated';
        expect(rebindableRef.value).toBe('updated');
        expect(rebindableRef.ref.value).toBe('updated');
    });

    test('与普通 ref 的双向绑定', async () => {
        const sourceRef = ref('source');
        const rebindableRef = new RebindableRef('target');
        
        // 绑定到源
        rebindableRef.rebind(sourceRef);
        
        // 等待 Vue 的响应式系统更新
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // rebindableRef 应该立即同步源的值
        expect(rebindableRef.value).toBe('source');
        
        // 更新源，rebindableRef 应该跟随变化
        sourceRef.value = 'source_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source_updated');
        
        // 更新 rebindableRef，源应该跟随变化
        rebindableRef.value = 'target_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(sourceRef.value).toBe('target_updated');
    });

    test('与 shallowRef 的双向绑定', async () => {
        const sourceRef = shallowRef({ name: 'test', value: 42 });
        const rebindableRef = new RebindableRef({ name: 'initial', value: 0 });
        
        rebindableRef.rebind(sourceRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        
        expect(rebindableRef.value).toEqual({ name: 'test', value: 42 });
        
        // 更新整个对象
        sourceRef.value = { name: 'updated', value: 100 };
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toEqual({ name: 'updated', value: 100 });
        
        // 通过 rebindableRef 更新
        rebindableRef.value = { name: 'final', value: 200 };
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(sourceRef.value).toEqual({ name: 'final', value: 200 });
    });

    test('重新绑定到不同的源', async () => {
        const sourceRef1 = ref('source1');
        const sourceRef2 = ref('source2');
        const rebindableRef = new RebindableRef('initial');
        
        // 绑定到第一个源
        rebindableRef.rebind(sourceRef1);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source1');
        
        // 重新绑定到第二个源
        rebindableRef.rebind(sourceRef2);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source2');
        
        // 更新第一个源，rebindableRef 不应该响应
        sourceRef1.value = 'source1_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source2'); // 应该仍然是 source2
        
        // 更新第二个源，rebindableRef 应该响应
        sourceRef2.value = 'source2_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source2_updated');
    });

    test('解绑功能', async () => {
        const sourceRef = ref('source');
        const rebindableRef = new RebindableRef('initial');
        
        rebindableRef.rebind(sourceRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source');
        
        // 解绑
        rebindableRef.unbind();
        
        // 更新源，rebindableRef 不应该响应
        sourceRef.value = 'source_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source'); // 应该保持解绑时的值
        
        // 更新 rebindableRef，源不应该响应
        const originalSourceValue = sourceRef.value;
        rebindableRef.value = 'rebindable_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(sourceRef.value).toBe(originalSourceValue); // 源值应该不变
    });

    test('多次解绑应该安全', () => {
        const rebindableRef = new RebindableRef('initial');
        
        // 多次调用 unbind 应该不会抛出错误
        expect(() => {
            rebindableRef.unbind();
            rebindableRef.unbind();
            rebindableRef.unbind();
        }).not.toThrow();
    });

    test('dispose 功能', async () => {
        const sourceRef = ref('source');
        const rebindableRef = new RebindableRef('initial');
        
        rebindableRef.rebind(sourceRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // 调用 dispose
        rebindableRef.dispose();
        
        // 更新源，rebindableRef 不应该响应
        sourceRef.value = 'source_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableRef.value).toBe('source'); // 应该保持 dispose 时的值
        
        // 更新 rebindableRef，源不应该响应
        rebindableRef.value = 'rebindable_updated';
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(sourceRef.value).toBe('source_updated'); // 源值应该不受影响
    });

    test('多次 dispose 应该安全', () => {
        const rebindableRef = new RebindableRef('initial');
        
        // 多次调用 dispose 应该不会抛出错误
        expect(() => {
            rebindableRef.dispose();
            rebindableRef.dispose();
            rebindableRef.dispose();
        }).not.toThrow();
    });

    test('防止循环调用的机制', async () => {
        const sourceRef = ref('initial');
        const rebindableRef = new RebindableRef('initial');
        
        let sourceUpdateCount = 0;
        
        // 创建一个代理来监听更新次数
        let originalSourceValue = sourceRef.value;
        Object.defineProperty(sourceRef, 'value', {
            get() {
                return originalSourceValue;
            },
            set(newValue) {
                sourceUpdateCount++;
                originalSourceValue = newValue;
            }
        });
        
        rebindableRef.rebind(sourceRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        
        // 重置计数器
        sourceUpdateCount = 0;
        
        // 更新源一次
        sourceRef.value = 'updated_once';
        await new Promise(resolve => setTimeout(resolve, 10));
        
        // 应该只有有限次数的更新，而不是无限循环
        expect(sourceUpdateCount).toBeLessThan(5);
    });

    test('immediate 选项测试', async () => {
        const sourceRef = ref('source_value');
        const rebindableRef = new RebindableRef('target_value');
        
        // 绑定时应该立即同步
        rebindableRef.rebind(sourceRef);
        
        // 不需要等待，应该立即同步
        expect(rebindableRef.value).toBe('source_value');
    });

    test('处理不同类型的数据', async () => {
        // 测试数字
        const numberRef = ref(42);
        const rebindableNumber = new RebindableRef(0);
        rebindableNumber.rebind(numberRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableNumber.value).toBe(42);
        
        // 测试布尔值
        const boolRef = ref(true);
        const rebindableBool = new RebindableRef(false);
        rebindableBool.rebind(boolRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableBool.value).toBe(true);
        
        // 测试null/undefined
        const nullRef = ref<null | undefined>(null);
        const rebindableNull = new RebindableRef<null | undefined>(undefined);
        rebindableNull.rebind(nullRef);
        await new Promise(resolve => setTimeout(resolve, 0));
        expect(rebindableNull.value).toBe(null);
    });

    test('测试 ref getter', () => {
        const rebindableRef = new RebindableRef('test');
        const internalRef = rebindableRef.ref;
        
        // ref getter 应该返回内部的 shallowRef
        expect(internalRef.value).toBe('test');
        
        // 通过内部 ref 修改值
        internalRef.value = 'modified';
        expect(rebindableRef.value).toBe('modified');
    });
});
