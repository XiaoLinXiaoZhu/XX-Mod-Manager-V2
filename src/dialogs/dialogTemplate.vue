<template>
    <transition name="fade">
        <div v-show="visible" class="dialog-overlay" @click.self="handleMaskClick"
            :class="{ 'close-on-click-mask': props.closeOnClickMask, 'show': visible }" :style="{ zIndex: _zIndex }">
            <div class="dialog-content">
                <div class="dialog-header font-hongmeng">
                    <slot name="header">
                        <h3>默认标题</h3>
                    </slot>
                </div>
                <div class="dialog-body">
                    <slot />
                </div>
                <div class="dialog-footer">
                    <slot name="footer">
                        <s-button class="OO-button font-hongmeng" @click="close">取消</s-button>
                        <s-button class="OO-button OO-color-gradient font-hongmeng" @click="confirm">确认</s-button>
                    </slot>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, defineModel, watch } from 'vue'
import { CSSVariable } from '@/assets/styles/CSSVariableManager';
import { ref } from 'vue';
const zIndex = CSSVariable['--oo-z-index'];
// 只复制 zIndex 的值，避免直接修改 CSSVariable 中的值
const _zIndex = ref(zIndex.value);

// 使用 defineModel 来替代 v-model,控制显示状态
const visible = defineModel<boolean>("visible", {
    default: false,
    type: Boolean
})

// Props
const props = defineProps<{
    closeOnClickMask?: boolean
    width?: string
}>()

// Emits
const emit = defineEmits<{
    (e: 'show'): void
    (e: 'dismiss'): void
}>()

// 监听 visible 变化，触发 show 事件
watch(visible, (newValue) => {
    if (newValue) {
        emit('show')
        zIndex.value += 1;
        _zIndex.value = zIndex.value;
    } else {
        emit('dismiss');
        zIndex.value -= 1; // 减少 z-index
    }
})

function confirm() {
    // 确认按钮逻辑
    console.log('确认按钮被点击')
    close()
}

// 关闭对话框
function close() {
    // 取消对话框的显示
    console.log('关闭对话框')
    visible.value = false
}

// 处理点击遮罩关闭
function handleMaskClick() {
    if (props.closeOnClickMask) {
        close()
    }
}
</script>

<style lang="scss" scoped>
.dialog-overlay {
    display: flex;

    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    align-items: center;
    justify-content: center;
    z-index: var(--oo-z-index, 999);

    background-color: rgba(0, 0, 0, 0.7);
    opacity: 1;
    filter: blur(0px);
    backdrop-filter: blur(2px);

    &::before {
        content: "";
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        background-color: #00000000;
        background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(90, 90, 90, .2) 5px, rgba(90, 90, 90, .2) 10px);
    }


    .dialog-content {
        position: absolute;

        padding: 20px;
        width: 120%;
        padding-bottom: 80px;

        display: flex;
        flex-direction: column;
        align-items: center;

        background: var(--s-color-surface-container-highest, #ffffff);
        border-radius: 8px;
        box-shadow: var(--s-elevation-level5, 0 10px 14px -6px rgba(0, 0, 0, .2), 0 22px 35px 3px rgba(0, 0, 0, .14), 0 8px 42px 7px rgba(0, 0, 0, .12));
        opacity: 1;
        transition: all 0.3s ease-in-out;
        animation: fadeInUp 0.3s ease-in-out;


        &::before {
            content: "";

            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;

            // 不与鼠标交互
            pointer-events: none;

            opacity: 0.5;

            color: var(--s-color-on-surface);
            box-shadow: inset 0 0 0px 6px var(--s-color-outline-variant), inset 1px 1px 0px 9px rgba(0, 0, 0, 0.2);
            background-color: var(--s-color-surface-container-high);
            /* 添加背景网格 */
            background-image: radial-gradient(black 15%, transparent 16%),
                radial-gradient(black 15%, transparent 16%);
            background-size: 10px 10px;
            background-position: 0 0, 5px 5px;

        }


        .dialog-header {
            height: fit-content;
            width: 100%;
            padding: 0 10px;
            margin: -5px 0px 5px 0;

            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            
            z-index: 1;
            

            color: var(--s-color-on-surface, #191c1d);
            line-height: 1.6;
            font-size: 26px;


            >* {
                font-size: 26px;
                margin: 0;
                line-height: 1.6;
                font-weight: 500;
            }

            .close-btn {
                background: none;
                border: none;
                font-size: 1.2em;
                cursor: pointer;
            }
        }

        .dialog-footer {
            position: absolute;
            bottom: -20px;
            width: 100%;
            display: flex;
            justify-content: center;

            // text-align: right;
            // justify-content: center;

            & button,s-button {
                margin: 0 40px;
            }
        }
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes fadeInUp {
    from {
        transform: translateY(20px);
        opacity: 0;
    }

    to {
        transform: translateY(0);
        opacity: 1;
    }
}










</style>