<template>
  <BergerFrame>
    <template #header>
      <BackButton />
      <h1>Main Page</h1>
    </template>

    <template #content>
      <p>Welcome to the main page!</p>
      <p>This is where you can find the latest updates and features.</p>
      <div class="ball-container">
        <div class="test-ball"></div>
      </div>
    </template>

    <template #footer>
      <p>&copy; 2023 Your Company</p>
    </template>
  </BergerFrame>
</template>

<script setup lang="ts">
import BergerFrame from '@/components/base/BergerFrame.vue';
import BackButton from '@/components/BackButton.vue';
</script>

<style scoped lang="scss">
.ball-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;

  // background-color: black;
  // // mix-blend-mode: lighten;
  // filter: brightness(2)  contrast(50);
}

.test-ball {
  width: 100px;
  height: 100px;
  background-color: #0000FF;
  border-radius: 50%;
  position: relative;
  border: 2px solid #FF00FF;

  // 通过filter将其调整为黄色纯色
  filter: invert(50%) sepia(100%) saturate(9999%) hue-rotate(87deg) brightness(20);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // background-color: #ccff00; // 黄色
    // mix-blend-mode: color; // 混合模式
  }
}
</style>