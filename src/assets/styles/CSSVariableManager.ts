// 辅助管理css 的 变量
import { ref,Ref } from "vue"
export let CSSVariable: Record<string, Ref<any>> = {
    "--oo-z-index": ref(1000),
}