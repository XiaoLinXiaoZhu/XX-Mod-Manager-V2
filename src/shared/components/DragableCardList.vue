<template>
  <div class="card-container" ref="containerRef">
    <animated-element
      v-for="(game, index) in games" 
      :key="game.id"
      :target-x="cardTargetPositions[index]?.x || index * (CARD_WIDTH + CARD_MARGIN)"
      :target-y="cardTargetPositions[index]?.y || 0"
      :initial-x="initialCardPositions[index]?.x || index * (CARD_WIDTH + CARD_MARGIN)"
      :initial-y="0"
      :mouse-x="isDraggingCard && index === draggingIndex ? dragStartX : undefined"
      :mouse-y="isDraggingCard && index === draggingIndex ? dragStartY : undefined"
      :width="CARD_WIDTH"
      :height="CARD_HEIGHT"
      :easing="isDraggingCard && index === draggingIndex ? DRAG_EASING : REARRANGE_EASING"
      :rotation-mode="isDraggingCard && index === draggingIndex ? 'simulation' : 'simple'"
      :rotation-easing="ROTATION_EASING"
      :max-rotation="isDraggingCard && index === draggingIndex ? MAX_DRAG_ROTATION : MAX_REARRANGE_ROTATION"
      :stability-delay="1000"
      :initially-static="true"
      ref="animatedElements"
      class="card-wrapper"
    >
    <FlippableElement>
              <div 
        class="card"
        :class="{ 'dragging': isDraggingCard && index === draggingIndex }"
        @mousedown="startDrag($event, index)"
      >
        <img :src="game.cover" :alt="game.name" class="card-image">
        <div class="card-title">{{ game.name }}</div>
      </div>
    </FlippableElement>

    </animated-element>
    <div 
      class="insertion-indicator"
      v-show="showInsertionIndicator"
      :style="insertionIndicatorStyle"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed } from 'vue';
import AnimatedElement from '@/shared/components/AnimatedElement.vue';
import FlippableElement from '@/shared/components/FlippableElement.vue';

// 定义游戏类型接口
interface Game {
  id: string;
  name: string;
  cover: string;
}

// 游戏数据
const games = ref<Game[]>([
  { id: 'card1', name: 'card1', cover: 'https://placeholder.im/200x300/card1/cccccc/000000' },
  { id: 'card2', name: 'card2', cover: 'https://placeholder.im/200x300/card2/cccccc/000000' },
  { id: 'card3', name: 'card3', cover: 'https://placeholder.im/200x300/card3/cccccc/000000' },
  { id: 'card4', name: 'card4', cover: 'https://placeholder.im/200x300/card4/cccccc/000000' },
  { id: 'card5', name: 'card5', cover: 'https://placeholder.im/200x300/card5/cccccc/000000' },
  { id: 'card6', name: 'card6', cover: 'https://placeholder.im/200x300/card6/cccccc/000000' },
  { id: 'card7', name: 'card7', cover: 'https://placeholder.im/200x300/card7/cccccc/000000' },
  { id: 'card8', name: 'card8', cover: 'https://placeholder.im/200x300/card8/cccccc/000000' }
]);

// 卡片尺寸和间距
const CARD_WIDTH = 200;
const CARD_HEIGHT = 300;
const CARD_MARGIN = 20;
// const CARD_SCALE_WHEN_DRAGGING = 1.05;
// 上面这个属性移动到 css 里面了，使用 class 驱动

// 动画参数配置
const DRAG_EASING = 0.25; // 拖拽时的缓动系数
const REARRANGE_EASING = 0.17; // 重排时的缓动系数
const ROTATION_EASING = 0.3; // 旋转的缓动系数
const MAX_DRAG_ROTATION = 9990; // 拖拽时的最大旋转角度
const MAX_REARRANGE_ROTATION = 20; // 重排时的最大旋转角度

// DOM引用
const containerRef = ref<HTMLElement | null>(null);
const animatedElements = ref<any[]>([]); // AnimatedElement 组件引用

// 卡片位置状态
const initialCardPositions = reactive<{ x: number, y: number }[]>([]);
const cardTargetPositions = reactive<{ x: number, y: number }[]>([]);

// 拖拽状态
const isDraggingCard = ref(false);
const draggingIndex = ref(-1);
const dragStartX = ref(0);
const dragStartY = ref(0);

// 插入指示器状态
const showInsertionIndicator = ref(false);
const insertionIndex = ref(-1);
const insertionIndicatorStyle = computed(() => {
  if (insertionIndex.value < 0) return {};
  const x = insertionIndex.value * (CARD_WIDTH + CARD_MARGIN);
  return {
    left: `${x - 2}px`,
    height: `${CARD_HEIGHT}px`,
    top: '0px',
    position: 'absolute' as const
  };
});

// 初始化卡片位置
const initCardPositions = () => {
  // 初始化位置数组
  initialCardPositions.length = 0;
  cardTargetPositions.length = 0;
  
  games.value.forEach((_, index) => {
    const x = index * (CARD_WIDTH + CARD_MARGIN);
    // 初始位置和目标位置都设置为正常排列
    initialCardPositions.push({ x, y: 0 });
    cardTargetPositions.push({ x, y: 0 });
  });
};

// 鼠标按下开始拖拽
const startDrag = (event: MouseEvent, index: number) => {
  event.preventDefault();
  isDraggingCard.value = true;
  draggingIndex.value = index;
  
  // 记录鼠标开始位置
  dragStartX.value = event.clientX;
  dragStartY.value = event.clientY;
  
  // 添加全局鼠标事件监听
  window.addEventListener('mousemove', onDrag);
  window.addEventListener('mouseup', stopDrag);
};

// 鼠标移动时更新位置
const onDrag = (event: MouseEvent) => {
  if (!isDraggingCard.value) return;
  
  // 计算当前拖拽偏移量
  const offsetX = event.clientX - dragStartX.value;
  const offsetY = event.clientY - dragStartY.value;
  
  // 获取当前拖拽卡片的原始位置
  const originalX = draggingIndex.value * (CARD_WIDTH + CARD_MARGIN);

  // 更新拖拽卡片的目标位置
  cardTargetPositions[draggingIndex.value] = {
    x: originalX + offsetX,
    y: offsetY
  };
  
  // 计算新的插入位置
  updateInsertionPosition(event);
};

// 更新插入指示器位置
const updateInsertionPosition = (event: MouseEvent) => {
  if (!containerRef.value || draggingIndex.value < 0) return;
  
  // 计算相对容器的鼠标位置，修正横向滚动
  const containerRect = containerRef.value.getBoundingClientRect();
  const relativeX = event.clientX - containerRect.left + containerRef.value.scrollLeft;
  
  // 计算最近的插入位置
  let newInsertionIndex = Math.floor(relativeX / (CARD_WIDTH + CARD_MARGIN));
  
  // 边界处理
  if (newInsertionIndex < 0) newInsertionIndex = 0;
  if (newInsertionIndex > games.value.length) newInsertionIndex = games.value.length;
  
  // 如果拖拽到自己原来的位置右侧，需要调整索引
  if (newInsertionIndex > draggingIndex.value) newInsertionIndex -= 1;
  
  // 不能插入到自己当前的位置
  if (newInsertionIndex === draggingIndex.value) {
    showInsertionIndicator.value = false;
    return;
  }
  
  // 更新插入位置
  insertionIndex.value = newInsertionIndex >= draggingIndex.value ? 
    newInsertionIndex + 1 : newInsertionIndex;
  showInsertionIndicator.value = true;
};

// 停止拖拽并重新排序
const stopDrag = () => {
  if (!isDraggingCard.value) return;
  
  const draggedCardIndex = draggingIndex.value;
  
  // 如果有插入指示器，进行排序
  if (showInsertionIndicator.value && insertionIndex.value >= 0) {
    const newGames = [...games.value];
    const draggedItem = newGames.splice(draggedCardIndex, 1)[0];
    
    // 计算正确的插入位置
    let targetIndex = insertionIndex.value;
    if (targetIndex > draggedCardIndex) targetIndex -= 1;
    
    // 插入到新位置
    newGames.splice(targetIndex, 0, draggedItem);
    
    // 保存当前所有卡片的位置，作为动画起点
    animatedElements.value.forEach((element, index) => {
      const position = element.getCurrentPosition();
      initialCardPositions[index] = { ...position };
    });
    
    // 更新游戏数据
    games.value = newGames;
  }
  
  // 重置所有卡片的目标位置为正常排列
  games.value.forEach((_, index) => {
    cardTargetPositions[index] = {
      x: index * (CARD_WIDTH + CARD_MARGIN),
      y: 0
    };
  });
  
  // 重置拖拽状态
  isDraggingCard.value = false;
  draggingIndex.value = -1;
  showInsertionIndicator.value = false;
  
  // 移除全局事件监听
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
};

// 组件挂载时初始化
onMounted(() => {
  initCardPositions();

  const scrollSpeed = 1; // 滚动速度
  containerRef.value?.addEventListener('wheel', (e) => {
    e.preventDefault();
    if (!containerRef.value) return;
    containerRef.value.scrollLeft += e.deltaY * scrollSpeed;
    // debug
    console.log(`Scroll Left: ${containerRef.value.scrollLeft}, DeltaY: ${e.deltaY}`);
  }, { passive: false });
});

// 组件卸载前清理
onBeforeUnmount(() => {
  // 移除事件监听器
  window.removeEventListener('mousemove', onDrag);
  window.removeEventListener('mouseup', stopDrag);
});
</script>

<style lang="scss" scoped>
.card-container {
  position: relative;
  width: 100%;
  height: 350px; // 卡片高度 + 一些额外空间
  overflow: hidden;
}

.card-wrapper {
  position: absolute;
}

.card {
  cursor: pointer;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  overflow: hidden;
  user-select: none;
  width: 100%;
  height: 100%;
  z-index: 1;

  &.dragging {
    cursor: grabbing;
    pointer-events: none;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); // 增强拖拽时的阴影
    transform: scale(1.09);
    opacity: 0.9;
    z-index: 10; // 提升拖拽卡片的层级
  }
  
  .card-image {
    width: 100%;
    height: calc(100% - 40px);
    object-fit: cover;
    display: block;
  }
  
  .card-title {
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    padding: 8px;
    text-align: center;
    background-color: rgba(255, 255, 255, 0.9);
  }
}

.insertion-indicator {
  position: absolute;
  width: 4px;
  background-color: #3498db;
  border-radius: 2px;
  pointer-events: none;
}
</style>
