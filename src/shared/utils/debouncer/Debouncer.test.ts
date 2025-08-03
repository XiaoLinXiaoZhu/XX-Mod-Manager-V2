import { describe, it, expect } from 'vitest';
import { debouncerDecorater, debounce } from './Debouncer';

describe('debouncerDecorater', () => {
    describe('装饰器功能测试', () => {
        it('应该正确创建装饰器函数', () => {
            const decorator = debouncerDecorater(300);
            expect(typeof decorator).toBe('function');
        });

        it('应该正确创建简化装饰器函数', () => {
            const decorator = debounce(200);
            expect(typeof decorator).toBe('function');
        });

        it('应该正确应用装饰器到方法', () => {
            class TestClass {
                callCount = 0;

                testMethod() {
                    this.callCount++;
                }
            }

            const descriptor = Object.getOwnPropertyDescriptor(TestClass.prototype, 'testMethod');
            expect(descriptor).toBeDefined();
            
            if (descriptor) {
                const decorator = debouncerDecorater(300);
                expect(() => {
                    decorator(TestClass.prototype, 'testMethod', descriptor);
                }).not.toThrow();
            }
        });

        it('应该支持不同配置选项', () => {
            const decorator1 = debouncerDecorater(100);
            const decorator2 = debouncerDecorater(200, { leading: true });
            const decorator3 = debouncerDecorater(300, { trailing: false });
            
            expect(typeof decorator1).toBe('function');
            expect(typeof decorator2).toBe('function');
            expect(typeof decorator3).toBe('function');
        });

        it('应该抛出错误当装饰器应用到非方法上', () => {
            const target = {};
            const propertyKey = 'notAMethod';
            const descriptor = {
                value: 'not a function',
                enumerable: true,
                configurable: true,
                writable: true
            };

            const decorator = debouncerDecorater(100);
            
            expect(() => {
                decorator(target, propertyKey, descriptor as any);
            }).toThrow('@debouncerDecorater can only be applied to methods');
        });
    });

    describe('Debouncer类测试', () => {
        it('应该正确创建Debouncer实例', () => {
            const fn = () => {};
            const debouncer = new (require('./Debouncer').Debouncer)(fn, 300);
            
            expect(debouncer).toBeDefined();
            expect(typeof debouncer.invoke).toBe('function');
            expect(typeof debouncer.cancel).toBe('function');
            expect(typeof debouncer.dispose).toBe('function');
        });

        it('应该正确设置和获取延迟时间', () => {
            const fn = () => {};
            const DebouncerClass = require('./Debouncer').Debouncer;
            const debouncer = new DebouncerClass(fn, 300);
            
            expect(debouncer.getDelay()).toBe(300);
            
            debouncer.setDelay(500);
            expect(debouncer.getDelay()).toBe(500);
        });

        it('应该正确检查待执行状态', () => {
            const fn = () => {};
            const DebouncerClass = require('./Debouncer').Debouncer;
            const debouncer = new DebouncerClass(fn, 100);
            
            expect(debouncer.isPending()).toBe(false);
            
            debouncer.invoke();
            expect(debouncer.isPending()).toBe(true);
            
            debouncer.cancel();
            expect(debouncer.isPending()).toBe(false);
        });
    });
});