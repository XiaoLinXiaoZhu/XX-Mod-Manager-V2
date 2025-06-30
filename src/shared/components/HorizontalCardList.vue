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
import { MouseEventBinder, MouseEventBinderBatch } from '@/scripts/lib/MouseEventBinder';
const focusedIndex = defineModel<number>('focusedIndex', {
    default: 0,
    type: Number
});

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

watch(focusedIndex, (newIndex, oldIndex) => {
    if (newIndex == oldIndex) return;
    updateFocused(newIndex);
});


// 四种交互方式：
// 1. 鼠标点击按钮左右切换（外部控制）
// 2. 鼠标滚轮切换（内部控制）
// 3. 鼠标拖动切换（内部控制）
// 4. 鼠标点击元素切换至该元素（内部控制）

const scrollPartBinder = new MouseEventBinderBatch();

const SCROLL_STEP = 100; // 每次滚动的像素步长
const accumulatedScrollDelta = new MouseEventBinder(0)
    .bindWheel((event, ref) => {
        const scrollEvent = event as WheelEvent;
        const delta = scrollEvent.deltaY || scrollEvent.detail; // 获取滚动增量
        ref.value += delta; // 累加滚动增量

        if (Math.abs(ref.value) >= SCROLL_STEP) {
            const direction = ref.value > 0 ? 1 : -1;
            const cardsLength = scrollPart.value?.children.length || 0;
            if (cardsLength === 0) return;

            focusedIndex.value = (focusedIndex.value + direction + cardsLength) % cardsLength;
            ref.value = 0; // 重置累计
        }
    });
scrollPartBinder.add(accumulatedScrollDelta);


// 处理鼠标左右拖动，当拖动距离超过 阈值时切换卡片
let startX = 0;
const CLICK_THRESHOLD = 5; // 点击阈值，避免误触发拖动
const DRAG_THRESHOLD = computed(() => {
    if (!scrollPart.value || props.dragThresholdType === 'fix') return 50; // 默认拖动阈值
    const currentCard = scrollPart.value.children[focusedIndex.value] || null;
    const nextCard = scrollPart.value.children[focusedIndex.value + dragDirection.value] || null;

    if (currentCard || nextCard) {
        const currentRectLeft = currentCard? currentCard.getBoundingClientRect().left : 0;
        const nextRectLeft = nextCard? nextCard.getBoundingClientRect().left : 0;
        const distance = Math.abs(nextRectLeft - currentRectLeft);
        return distance * 0.8; // 使用当前和下一个卡片的宽度的50%作为拖动阈值
    }
    return 50; // 如果没有卡片，使用默认值
});
const isDragging = new MouseEventBinder(false)
    .bindMouseDown((_event, ref) => {ref.value = true; })
    .bindMouseUp((_event, ref) => { ref.value = false; })
    .bindMouseLeave((_event, ref) => { ref.value = false; });
scrollPartBinder.add(isDragging);

const dragDirection = new MouseEventBinder(0) // 0: 未拖动, 1: 向右拖动, -1: 向左拖动
    .bindMouseMove((event, ref) => {
        if (!isDragging.value) {
            ref.value = 0; // 如果没有拖动则不处理
            return;
        }

        const deltaX = event.clientX - startX;
        ref.value = deltaX > 0 ? -1 : 1; // 记录拖动方向
    });
scrollPartBinder.add(dragDirection);

const scrollPartScrollLeft = new MouseEventBinder(0)
    .bindMouseDown((event, ref) => {
        if (!scrollPart.value) return;
        ref.value = scrollPart.value.scrollLeft; // 记录当前滚动位置
        startX = event.clientX; // 记录起始位置
    });
scrollPartBinder.add(scrollPartScrollLeft);

const deltaX = new MouseEventBinder(0)
    .bindMouseMove((event, ref) => {
        if (!isDragging.value || !scrollPart.value) return;

        ref.value = event.clientX - startX;
        // 列表跟随鼠标拖动
        scrollPart.value.scrollLeft = scrollPartScrollLeft.value - ref.value;

        if (Math.abs(ref.value) >= DRAG_THRESHOLD.value) {
            // 超出范围认为是过量拖拽，而不是循环
            const newIndex = Math.max(0, Math.min(focusedIndex.value + dragDirection.value, scrollPart.value.children.length - 1));
            focusedIndex.value = newIndex;
            // 刷新记录
            startX = event.clientX;
            scrollPartScrollLeft.value = scrollPart.value.scrollLeft; // 更新滚动位置
        }
    })
    .bindMouseUp((event, ref) => {
        // if (!isDragging.value) return;
        if (Math.abs(ref.value) < CLICK_THRESHOLD) {
            // 如果拖动距离小于阈值，认为是点击
            handleClick(event);
        }
        ref.value = 0; // 重置拖动距离

        updateFocused(focusedIndex.value); // 确保松开鼠标后更新焦点

    })
    .bindMouseLeave((_event, ref) => {
        if (!isDragging.value) return;
        ref.value = 0; // 重置拖动距离

        updateFocused(focusedIndex.value); // 确保松开鼠标后更新焦点
    });
scrollPartBinder.add(deltaX);

const styleBinder = new MouseEventBinder<number>(0)
    .bindMouseMove((event, ref) => {
        if (!isDragging.value || !scrollPart.value) return;

        // 始终累加位移量（而不是相对位移）
        ref.value += Math.abs(event.movementX) || 0;

        if (Math.abs(ref.value) < CLICK_THRESHOLD) {
            // 如果拖动距离小于阈值，认为是点击,设置cursor为pointer
            scrollPart.value.style.cursor = 'pointer';
            // 设置 dragging
            scrollPart.value.classList.remove('dragging'); // 移除拖动状态
        }
        else {
            scrollPart.value.style.cursor = 'grabbing'; // 设置为抓取状态
            scrollPart.value.classList.add('dragging'); // 添加拖动状态
        }
    })
    .bindMouseUp((_event, ref) => {
        if (!scrollPart.value) return;

        ref.value = 0; // 重置样式
        scrollPart.value.style.cursor = 'default'; // 恢复默认光标
        scrollPart.value.classList.remove('dragging'); // 移除拖动状态
    })
    .bindMouseLeave((_event, ref) => {
        if (!scrollPart.value) return;

        ref.value = 0; // 重置样式
        scrollPart.value.style.cursor = 'default'; // 恢复默认光标
        scrollPart.value.classList.remove('dragging'); // 移除拖动状态
    });
scrollPartBinder.add(styleBinder);

const otherMouseEvent = new MouseEventBinder(0)
    .bindMouseUp((_event, _ref) => {
        updateFocused(focusedIndex.value); // 确保松开鼠标后更新焦点
    })
    .bindMouseLeave((_event, _ref) => {
        updateFocused(focusedIndex.value); // 确保鼠标离开时更新焦点
    });
scrollPartBinder.add(otherMouseEvent);

// 3. 鼠标点击元素切换至该元素

const handleClick = (event: MouseEvent) => {
    if (!scrollPart.value) return;

    const target = event.target as HTMLElement;
    // debug
    console.log('Click event detected on:', target);
    const card = target.closest('.horizontal-card-list-item'); // 查找最近的卡片元素
    //debug
    console.log('Card clicked:', card, 'focusedIndex:', focusedIndex.value);
    if (card) {
        const index = Array.from(scrollPart.value.children).indexOf(card);
        if (index !== -1) {
            focusedIndex.value = index; // 更新焦点索引
            updateFocused(index); // 更新焦点位置
        }
    }
};


onMounted(() => {
    // 初始化时设置第一个卡片为焦点
    updateFocused(focusedIndex.value);
    //debug
    console.log('HorizontalCardList mounted, initial focusedIndex:', focusedIndex.value);

    if (scrollPart.value) {
        scrollPartBinder.listAll();
        scrollPartBinder.mountAll(scrollPart.value);

        // 给其子元素全部添加 horizontal-card-list-item 类
        Array.from(scrollPart.value.children).forEach((child) => {
            child.classList.add('horizontal-card-list-item');
        });
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
    overflow-y: visible;
    padding: 120px 50%;

    gap: 20px;

    // 隐藏滚动条
    &::-webkit-scrollbar {
        display: none;
        /* Safari 和 Chrome */
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
// }</style>
<style lang="scss">
.horizontal-card-list-item {
    cursor: pointer;
    /* 鼠标悬停时显示手型光标 */
}

.horizontal-card-list-item ::v-deep(.focus) {
    outline: 20px solid var(--s-color-primary);
}

.scroll-part.dragging .horizontal-card-list-item {
    cursor: grabbing;
    /* 拖动时的光标样式 */
}
</style>