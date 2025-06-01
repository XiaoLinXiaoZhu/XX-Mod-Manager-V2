<template>
  <div class="game-picker-container">
    <transition-group
      name="list"
      tag="div"
      class="game-list"
      :css="true"
    >
      <!-- 可拖动的游戏卡片 -->
      <div
        v-for="game in games"
        :key="game.id"
        class="game-card"
        draggable="true"
        @dragstart="onDragStart($event, game)"
        @dragover.prevent="onDragOver($event, game)"
        @drop="onDrop"
        @dragend="onDragEnd"
      >
        <img :src="game.cover" alt="Cover" class="cover-image" />
        <h3>{{ game.name }}</h3>
      </div>

      <!-- 添加新游戏按钮 -->
      <div key="add-new" class="game-card add-new" @click="openAddGameDialog">
        +
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface Game {
  id: string;
  name: string;
  cover: string;
}

const games = ref<Game[]>([
  { id: 'genshin', name: '原神', cover: 'https://placeholder.im/200x300/yuansheng/cccccc/000000' },
  { id: 'mingchao', name: '鸣潮', cover: 'https://placeholder.im/200x300/minghcao/cccccc/000000' },
  { id: 'zenless', name: '绝区零', cover: 'https://placeholder.im/200x300/zenless/cccccc/000000' },
]);

let dragGame = ref<Game | null>(null);

function onDragStart(e: DragEvent, game: Game) {
  dragGame.value = game;
}

function onDragOver(e: DragEvent, targetGame: Game) {
  if (!dragGame.value || dragGame.value.id === targetGame.id) return;

  const sourceIndex = games.value.findIndex(g => g.id === dragGame.value!.id);
  const targetIndex = games.value.findIndex(g => g.id === targetGame.id);

  // 移动卡片
  const [moved] = games.value.splice(sourceIndex, 1);
  games.value.splice(targetIndex, 0, moved);
}

function onDrop() {
  dragGame.value = null;
}

function onDragEnd() {
  dragGame.value = null;
}

function openAddGameDialog() {
  alert('打开添加游戏对话框');
}
</script>

<style scoped lang="scss">
.game-picker-container {
  padding: 20px;
  overflow-x: auto;
  display: flex;
  align-items: center;
}

.game-list {
  display: flex;
  gap: 16px;
  padding: 10px;
  min-height: 180px;
}

.game-card {
  width: 140px;
  height: 180px;
  background-color: var(--bg);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  cursor: grab;
  transition: transform 0.2s ease;
  user-select: none;

  &:active {
    cursor: grabbing;
  }

  &.add-new {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 48px;
    color: #aaa;
    background-color: #222;
    cursor: pointer;
  }

  .cover-image {
    width: 100%;
    height: 120px;
    object-fit: cover;
  }

  h3 {
    margin: 8px;
    text-align: center;
    font-size: 16px;
  }
}


.list-move {
  transition: transform 0.3s ease;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

</style>