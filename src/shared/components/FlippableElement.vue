<template>
    <div class="flippable-element" :class="{ 'locked': locked }" @click="handleClick" @mousedown="handleMouseDown"
        ref="elementRef">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

// 首先理清一下这个组件的作用：
// 这个组件用于渲染一个可翻转的元素，当被点击时能够响应点击，进行一定的角度翻转

// 提供一个参数用于控制翻转的程度
const props = withDefaults(defineProps<{
    strength?: number; // 翻转的程度 (0-100, 默认40)
    duration?: number; // 翻转的持续时间 (毫秒, 默认800)
    scaleRatio?: number; // 缩放比例, scale(1-scaleRatio),0代表不缩放 (0-1, 默认0.12)
    translateRatio?: number; // 平移比例 (0-1, 默认0.2)
    locked?: boolean; // 是否锁定 (默认false)
    shakeTimes?: number; // 震动次数 (默认3)
    shakeDuration?: number; // 震动动画持续时间 (毫秒, 默认400)

    disable?: boolean; // 是否禁用 (默认false)
}>(), {
    strength: 40,
    duration: 700,
    scaleRatio: 0.05,
    translateRatio: 0.8,
    locked: false,
    shakeTimes: 3,
    shakeDuration: 400,
    disable: false
});

const elementRef = ref<HTMLElement | null>(null);

const handleClick = (event: MouseEvent) => {
    if (props.disable) return;
    const element = elementRef.value;
    if (!element) return;

    if (props.locked) return;
    playClickAnim(event, props.strength, props.duration, props.scaleRatio, props.translateRatio);
};

const handleMouseDown = (event: MouseEvent) => {
    if (props.disable) return;
    const element = elementRef.value;
    if (!element) return;

    // 使用 mousedown 处理禁用状态下的点击事件，这样能够拥有更快的响应
    if (props.locked) {
        playLockedAnim(props.strength, props.shakeTimes, props.scaleRatio, props.shakeDuration);
        return;
    }
};

const playClickAnim = (
    event: MouseEvent,
    strength: number,
    duration: number,
    scaleRatio: number,
    translateRatio: number
) => {
    const element = elementRef.value;
    if (!element) return;

    // 获取元素的边界矩形
    const rect = element.getBoundingClientRect();

    // Calculate mouse position relative to element (from 0 to 1)
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    // Calculate rotation angles (convert from 0-1 range to -1 to 1)
    // Flip the rotations to make the element tilt toward the click point
    const rotateX = (0.5 - y) * strength; // Tilt up when clicking bottom, down when clicking top
    const rotateY = (x - 0.5) * strength; // Tilt right when clicking left, left when clicking right

    // Calculate translation based on rotation and translateRatio
    const translateX = rotateY * translateRatio;
    const translateY = -rotateX * translateRatio;

    // Calculate scale values
    const scaleDown = 1 - scaleRatio;
    const scaleUp = 1 + (scaleRatio * 0.5); // Slightly scale up for the peak

    // 计算按下和恢复的持续时间
    const pressDuration = Math.round(duration * 2 / 5);
    const releaseDuration = duration - pressDuration;

    element.animate([
        { transform: `perspective(500px) rotate3d(1,1,0,0deg) scale(${scaleDown})`, offset: 0 },
        { transform: `perspective(500px) translate(${translateX * 0.5}px,${translateY * 0.5}px) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg) scale(${scaleDown * 0.9})`, offset: pressDuration / duration * 0.7 },
        { transform: `perspective(500px) translate(${translateX}px,${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleDown})`, offset: pressDuration / duration },
        { transform: `perspective(500px) translate(${translateX}px,${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleUp})`, offset: (pressDuration + releaseDuration * 0.3) / duration },
        { transform: `perspective(500px) rotate3d(1,1,0,0deg) scale(1)`, offset: 1 }
    ], {
        duration: duration,
        easing: 'ease-out',
        iterations: 1
    });
};

const playLockedAnim = (
    strength: number,
    shakeTimes: number,
    scaleRatio: number,
    duration: number
) => {
    const element = elementRef.value;
    if (!element) return;

    // 震动的基础参数
    const shakeStrength = strength * 0.3; // 震动强度为正常强度的30%
    const shakeDistance = 10; // 左右震动的像素距离
    const shakeRotation = shakeStrength * 0.5; // 角度震动

    // 程序化生成关键帧
    const keyframes: Keyframe[] = [];

    // 添加初始状态
    keyframes.push({
        transform: `perspective(500px) translate(0px, 0px) rotateZ(0deg) scale(1)`,
        offset: 0
    });

    const initialScale = 1 - scaleRatio; // 初始缩放比例

    // 生成震动关键帧
    for (let i = 0; i < shakeTimes; i++) {
        const progress = (i + 1) / (shakeTimes + 1); // 计算当前震动在整体动画中的进度
        const damping = 1 - (i / shakeTimes) * 0.7; // 阻尼系数，震动强度逐渐减弱
        const scale = Math.min(initialScale + i * 0.005, 1); // 每次震动稍微增加一点缩放，确保不超过1
        // 左震动
        const leftOffset = progress - 0.02; // 稍微提前一点
        if (leftOffset > 0 && leftOffset < 1) {
            keyframes.push({
                transform: `perspective(500px) translate(-${shakeDistance * damping}px, 0px) rotateZ(-${shakeRotation * damping}deg) scale(${scale})`,
                offset: leftOffset
            });
        }

        // 右震动
        const rightOffset = progress + 0.02; // 稍微延后一点
        if (rightOffset > 0 && rightOffset < 1) {
            keyframes.push({
                transform: `perspective(500px) translate(${shakeDistance * damping}px, 0px) rotateZ(${shakeRotation * damping}deg) scale(${scale})`,
                offset: rightOffset
            });
        }
    }

    // 添加结束状态
    keyframes.push({
        transform: `perspective(500px) translate(0px, 0px) rotateZ(0deg) scale(1)`,
        offset: 1
    });

    // 按offset排序确保动画顺序正确
    keyframes.sort((a, b) => (a.offset as number) - (b.offset as number));

    element.animate(keyframes, {
        duration: duration,
        easing: 'ease-out',
        iterations: 1
    });
}


defineExpose({
    playClickAnim,
    playLockedAnim,
});
</script>

<style scoped lang="scss">
.flippable-element {
    perspective: 500px;
    transform: rotate3d(1, 1, 0, 0deg);
    will-change: transform;
    overflow: visible;
    cursor: pointer;

    &.locked {
        opacity: 0.6;
        cursor: not-allowed;

        // 使用伪元素来添加禁用状态下的视觉效果
        // 增加一个 lock标识
        &::after {
            opacity: 1;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;

            // 添加锁定图标
            content: '🔒';
            font-size: 50px;
            filter: none !important;
            backdrop-filter: blur(1px);
            display: flex;
            align-items: center;
            justify-content: center;
            
        }
    }
}
</style>