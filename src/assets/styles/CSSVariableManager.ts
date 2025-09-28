// 辅助管理css 的 变量
import { ref,Ref } from "vue"
const defaultZIndex = 1000
const zIndex = ref(defaultZIndex)
export let CSSVariable: Record<string, Ref<any>> = {
    "--oo-z-index": zIndex,
}
export function getIndex() {
    return zIndex.value++
}
export function releaseIndex() {
    zIndex.value--
    if (zIndex.value < defaultZIndex) {
        zIndex.value = defaultZIndex
    }
    return defaultZIndex;
}
