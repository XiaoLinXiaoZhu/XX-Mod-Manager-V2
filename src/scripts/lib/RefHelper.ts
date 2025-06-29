// ref 帮助工具
import { ref, Ref } from 'vue';

// 检查一个值是否是 Ref 对象
export const isRefObject = <T>(value: T | Ref<T>): value is Ref<T> => {
    return value && typeof value === 'object' && 'value' in value;
};


// 如果某个值不是 Ref 对象，则将其转换为 Ref 对象
export const ensureRef = <T>(value: T | Ref<T>): Ref<T> => {
    if (isRefObject(value)) {
        return value;
    } else {
        return ref(value) as Ref<T>;
    }
};