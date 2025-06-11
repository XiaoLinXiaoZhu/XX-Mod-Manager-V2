// 辅助管理css 的 变量
import { ref,Ref } from "vue"
const zIndex = ref(1000)
export let CSSVariable: Record<string, Ref<any>> = {
    "--oo-z-index": zIndex,
}
export function getIndex() {
    return zIndex.value++
}
export function releaseIndex() {
    zIndex.value--
    if (zIndex.value < 1000) {
        zIndex.value = 1000
    }
}