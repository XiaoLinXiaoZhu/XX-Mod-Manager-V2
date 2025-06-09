<!-- 这是一个模板组件，用于创建一个水平卡片列表 -->
<template>
    <div class="horizontal-card-list" ref="horizontalCardList">
        <div class="scroll-part" ref="scrollPart">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

const focusedIndex = defineModel<number>('focusedIndex', {
    default: -1,
    type: Number
});

type dragThresholdType = "fix" | "dynamic";
const props = defineProps({
    dragThresholdType: {
        type: String as () => "fix" | "dynamic",
        default: 'dynamic'
    },
});
const horizontalCardList = ref<HTMLElement | null>(null);
const scrollPart = ref<HTMLElement | null>(null);

const updateFocused = (newIndex: number) => {
    if (!scrollPart.value) return;

    const cards = scrollPart.value.children;
    if (newIndex < 0 || newIndex >= cards.length) {
        let tempIndex = (newIndex + cards.length) % cards.length;
        updateFocused(tempIndex);
        return;
    }

    // 尝试移动scrollPart到新的焦点卡片位置
    // debug
    console.log('Updating focus to card index:', newIndex);
    const card = cards[newIndex] as HTMLElement;
    const scrollLeft = card.offsetLeft - (scrollPart.value.clientWidth / 2) + (card.clientWidth / 2);
    scrollPart.value.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
    });

    Array.from(cards).forEach(element => {
        element.classList.remove('focus');
        if (Array.from(cards).indexOf(element) === newIndex) {
            element.classList.add('focus');
        }
    });
};

watch(focusedIndex, (newIndex,oldIndex) => {
    if (newIndex == oldIndex) return;
    console.log('focusedIndex changed:', newIndex);
    updateFocused(newIndex);
});

// 监听鼠标滚动事件，每滚动100px才切换一次
let accumulatedDelta = 0;
const SCROLL_STEP = 100; // 每次滚动的像素步长
const handleScroll = (event: WheelEvent) => {
    if (!scrollPart.value) return;

    const delta = event.deltaY || event.detail;
    accumulatedDelta += delta;

    // debug
    console.log('Scroll event detected, delta:', delta, 'accumulatedDelta:', accumulatedDelta);

    if (Math.abs(accumulatedDelta) >= SCROLL_STEP) {
        const direction = accumulatedDelta > 0 ? 1 : -1;
        const cardsLength = scrollPart.value.children.length;
        if (cardsLength === 0) return;

        focusedIndex.value = (focusedIndex.value + direction + cardsLength) % cardsLength;
        accumulatedDelta = 0; // 重置累计
    }
};

// 处理鼠标左右拖动，当拖动距离超过50px时切换焦点
let isDragging = false;
let startX = 0;
let scrollPartScrollLeft = 0;
const dragDirection = ref(0); // 0: 未拖动, 1: 向右拖动, -1: 向左拖动
const DRAG_THRESHOLD = computed(() => {
    if (!scrollPart.value || props.dragThresholdType === 'fix') return 50; // 默认拖动阈值
    const currentCard = scrollPart.value.children[focusedIndex.value];
    const nextCard = scrollPart.value.children[(focusedIndex.value + dragDirection.value) % scrollPart.value.children.length];

    if (currentCard || nextCard) {
        const currentRect = currentCard.getBoundingClientRect();
        const nextRect = nextCard.getBoundingClientRect();
        const distance = Math.abs(nextRect.left - currentRect.left);
        return distance; // 使用当前和下一个卡片的宽度的50%作为拖动阈值
    }
    return 50; // 如果没有卡片，使用默认值
});
const handleMouseDown = (event: MouseEvent) => {
    if (!scrollPart.value) return;

    isDragging = true;
    scrollPartScrollLeft = scrollPart.value.scrollLeft; // 记录当前滚动位置
    startX = event.clientX;
};

const handleMouseMove = (event: MouseEvent) => {
    if (!isDragging || !scrollPart.value) return;

    const deltaX = event.clientX - startX;
    dragDirection.value = deltaX > 0 ? -1 : 1; // 记录拖动方向
    // 列表跟随鼠标拖动
    scrollPart.value.scrollLeft = scrollPartScrollLeft - deltaX;
    //debug
    console.log('Mouse move detected, deltaX:', deltaX, 'DRAG_THRESHOLD:', DRAG_THRESHOLD.value);
    if (Math.abs(deltaX) >= DRAG_THRESHOLD.value) {
        // 超出范围认为是过量拖拽，而不是循环
        const newIndex = Math.max(0, Math.min(focusedIndex.value + dragDirection.value, scrollPart.value.children.length - 1));
        focusedIndex.value = newIndex; // 更新焦点索引
        // 刷新记录
        startX = event.clientX; // 更新起始位置
        scrollPartScrollLeft = scrollPart.value.scrollLeft; // 更新滚动位置
    }
};
const handleMouseUp = () => {
    isDragging = false; // 停止拖动
    dragDirection.value = 0; // 重置拖动方向
    updateFocused(focusedIndex.value); // 确保松开鼠标后更新焦点
}; 
const handleMouseLeave = () => {
    isDragging = false; // 停止拖动
    dragDirection.value = 0; // 重置拖动方向
    updateFocused(focusedIndex.value); // 确保鼠标离开时更新焦点
};
onMounted(() => {
    // 初始化时设置第一个卡片为焦点
    updateFocused(focusedIndex.value);
    //debug
    console.log('HorizontalCardList mounted, initial focusedIndex:', focusedIndex.value);

    if (scrollPart.value) {
        scrollPart.value.addEventListener('wheel', handleScroll, { passive: true });
        scrollPart.value.addEventListener('mousedown', handleMouseDown);
        scrollPart.value.addEventListener('mousemove', handleMouseMove);
        scrollPart.value.addEventListener('mouseup', handleMouseUp);
        scrollPart.value.addEventListener('mouseleave', handleMouseLeave);
    }
});
</script>

<style scoped lang="scss">
.horizontal-card-list {
    width: 100%;
    overflow: hidden;
}
.scroll-part {
    display: flex;
    overflow-x: auto;
    padding: 0 50%;

    gap: 20px;

    // 隐藏滚动条
    &::-webkit-scrollbar {
        display: none; /* Safari 和 Chrome */
    }
}

// .scroll-part > * {
//     flex: 0 0 auto;
//     /* 确保卡片不会被压缩 */
//     width: 200px;
//     /* 设置卡片的宽度 */
//     height: 300px;
//     /* 设置卡片的高度 */
//     background-color: white;
//     border-radius: 8px;
//     // outline: none;
// }

.scroll-part > ::v-deep(.focus) {
    outline: 20px solid var(--s-color-primary);
}
</style>