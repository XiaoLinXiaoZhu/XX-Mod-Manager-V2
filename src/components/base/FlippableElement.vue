<template>
<div 
    class="flippable-element"
    ref="elementRef" @click="handleClick" :clicked="clicked">
    <slot></slot>
</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
const elementRef = ref<HTMLElement | null>(null);

const clicked = defineModel("clicked", {
    type: Boolean,
    default: false
});

type T = HTMLElement & {
    clicked?: boolean;
    inWindow?: boolean;
};
function handleClick(event: MouseEvent) {
    const element = elementRef.value as T;

    // 获取元素的边界矩形
    const rect = element.getBoundingClientRect();
    
    // Toggle clicked state
    clicked.value = !clicked.value;
    element.clicked = clicked.value;

    if (clicked.value) {
        // If clicked, play clicked animation
        playClickedAnim(element, event, rect);
    } else {
        // If not clicked, play click animation
        playClickAnim(element, event, rect);
    }
}

function playClickAnim(element: HTMLElement, event: MouseEvent, rect: DOMRect) {
    // Calculate mouse position relative to element (from 0 to 1)
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Calculate rotation angles (convert from 0-1 range to -1 to 1)
    // Flip the rotations to make the element tilt toward the click point
    const rotateX = (0.5 - y) * 40; // Tilt up when clicking bottom, down when clicking top
    const rotateY = (x - 0.5) * 40; // Tilt right when clicking left, left when clicking right
    
    element.animate([
        { transform: `perspective(500px) rotate3d(1,1,0,0deg) scale(0.95)` },
        { transform: `perspective(500px) translate(${rotateY * 0.2}px,${-rotateX * 0.2}px) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg) scale(0.88)` },
        { transform: `perspective(500px) translate(${rotateY * 0.2}px,${-rotateX * 0.2}px) rotateX(${rotateX * 0.5}deg) rotateY(${rotateY * 0.5}deg) scale(1)` },
        { transform: `perspective(500px) rotate3d(1,1,0,0deg)` }
    ], {
        duration: 800,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
    });
}

function playClickedAnim(element: HTMLElement, event: MouseEvent, rect: DOMRect) {
    // Calculate mouse position relative to element (from 0 to 1)
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    
    // Calculate rotation angles (convert from 0-1 range to -1 to 1)
    const rotateX = (0.5 - y) * 40;
    const rotateY = (x - 0.5) * 40;
    
    element.animate([
        { transform: `perspective(500px) rotate3d(1,1,0,0deg)` },
        { transform: `perspective(500px) translate(${rotateY * 0.4}px,${-rotateX * 0.4}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)` },
        { transform: `perspective(500px) translate(${rotateY * 0.4}px,${-rotateX * 0.4}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1)` },
        { transform: `perspective(500px) rotate3d(1,1,0,0deg) scale(0.95)` }
    ], {
        duration: 600,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        iterations: 1
    });
}
</script>

<style scoped lang="scss">
.flippable-element {
    perspective: 500px;
    transform: rotate3d(1, 1, 0, 0deg);
    will-change: transform;
}
</style>