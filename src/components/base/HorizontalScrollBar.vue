<template>
    <div :class="['horizontal-scroll-bar', { 'show-scrollbar': showScrollbar }]" ref="scrollBar">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineProps } from 'vue';

const props = defineProps({
    showScrollbar: {
        type: Boolean,
        default: false
    },
    scrollSpeed: {
        default: 1
    },
    dragSpeed: {
        default: 1
    },
    canDrag: {
        type: Boolean,
        default: true
    }
});

const scrollBar = ref<HTMLElement | null>(null);

onMounted(() => {
    const scrollBarEl = scrollBar.value;
    if (!scrollBarEl) return;

    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    // Ensure numeric values
    const scrollSpeed = typeof props.scrollSpeed === 'string' ? parseFloat(props.scrollSpeed) : props.scrollSpeed;
    const dragSpeed = typeof props.dragSpeed === 'string' ? parseFloat(props.dragSpeed) : props.dragSpeed;

    // Drag events
    if (props.canDrag) {
        scrollBarEl.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - scrollBarEl.offsetLeft;
            scrollLeft = scrollBarEl.scrollLeft;
        });

        scrollBarEl.addEventListener('mouseleave', () => {
            isDown = false;
        });

        scrollBarEl.addEventListener('mouseup', () => {
            isDown = false;
        });

        scrollBarEl.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scrollBarEl.offsetLeft;
            const walk = (x - startX) * dragSpeed;
            scrollBarEl.scrollLeft = scrollLeft - walk;
        });
    }

    // Wheel event
    scrollBarEl.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollBarEl.scrollLeft += e.deltaY * scrollSpeed;
    }, { passive: false });
});
</script>

<style scoped>
.horizontal-scroll-bar {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;
    cursor: grab;
    user-select: none;
    padding: 0 10px;
}

.horizontal-scroll-bar::-webkit-scrollbar {
    display: none;
}

.horizontal-scroll-bar.show-scrollbar::-webkit-scrollbar {
    display: block;
}
</style>