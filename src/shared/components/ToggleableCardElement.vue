<template>
  <FlippableElement :locked="locked" :duration="flipAnimationArgs.duration" :strength="flipAnimationArgs.strength"
    :scaleRatio="flipAnimationArgs.scaleRatio" :translateRatio="flipAnimationArgs.translateRatio"
    :shakeTimes="flipAnimationArgs.shakeTimes" :shakeDuration="flipAnimationArgs.shakeDuration"
    :disable="flipAnimationArgs.disable" @click="handleClick" @contextmenu="handleLeftClick" ref="elementRef">
    <s-card class="toggle-card" :clickable="true" :class="{ 'clicked': clicked }">

      <div slot="image">
        <slot name="image">
        </slot>
      </div>
      <div slot="headline">
        <slot name="headline">
        </slot>
      </div>
      <div slot="subhead">
        <slot name="subhead">
        </slot>
      </div>
      <div slot="text">
        <slot name="text">
        </slot>
      </div>
    </s-card>
  </FlippableElement>
</template>

<script setup lang="ts">
import FlippableElement from './FlippableElement.vue';
import { computed, ref } from 'vue';
import type { Ref } from 'vue';

const elementRef: Ref<InstanceType<typeof FlippableElement> | null> = ref(null);
const clicked = defineModel<boolean>('clicked', {
  type: Boolean,
  default: false,
});

const locked = defineModel<boolean>('locked', {
  type: Boolean,
  default: false,
});

const flipAnimationArgs = computed(() => {
  if (!clicked.value) {
    return {
      strength: 40,
      duration: 700,
      scaleRatio: 0.05,
      translateRatio: 0.8,
      shakeTimes: 3,
      shakeDuration: 400,
      disable: false,
    };
  } else {
    return {
      strength: 8,
      duration: 600,
      scaleRatio: 0.05,
      translateRatio: 0.8,
      shakeTimes: 3,
      shakeDuration: 400,
      disable: false,
    };
  }
});

const handleClick = (event: MouseEvent) => {
  if (locked.value) return;
  clicked.value = !clicked.value;
  // 这里可以添加其他点击事件处理逻辑
};

const handleLeftClick = (event: MouseEvent) => {
  locked.value = !locked.value;

  if (!elementRef.value) return;
  if (locked) {
    elementRef.value.playLockedAnim(flipAnimationArgs.value.strength, flipAnimationArgs.value.shakeTimes,
    flipAnimationArgs.value.scaleRatio, flipAnimationArgs.value.shakeDuration);
  }
};


</script>

<style scoped lang="scss">
.toggle-card {
  // 大小和位置
  width: 250px;
  height: 350px;
  margin-bottom: 0px;
  perspective: 500px;
  will-change: transform;

  // 样式
  border: 1px solid transparent;
  background-color: var(--s-color-surface-container-low);
  border-radius: 0px 32px 0px 32px;
  box-sizing: border-box;
  overflow: hidden;
  transform: rotate3d(1, 1, 0, 0deg);

  // 动画
  transition: x, y 0.5s cubic-bezier(.36, -0.64, .34, 1.76),
    transform 0.6s ease;



  & div[slot="image"] {
    width: 250px;
    height: 200px;
    overflow: hidden;
  }



  &.clicked {
    background-color: var(--s-color-surface-container-low);
    border: 5px solid transparent;
    background-clip: padding-box, border-box;
    background-origin: padding-box, border-box;
    background-image: linear-gradient(to right, var(--s-color-surface-container-low), var(--s-color-surface-container-low)), linear-gradient(90deg, var(--s-color-primary), var(--s-color-secondary));

    // transform: rotateY(360deg) scale(0.95);
    transform: scale(0.95);


  }
}
</style>