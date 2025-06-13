<template>
    <p style="position: absolute; top: 10px; left: 10px;">当前卡片索引: {{ currentCardIndex }}</p>
    <div
        style="display: flex; flex-direction: column; height: 100%; width: 100%;flex: 0 0 auto;align-content: center;justify-content: center;align-items: center;">
        <HorizontalCardList style="width: 100%; overflow: visible;" v-model:focused-index="currentCardIndex">
            <div class="card">AddNewRepo
                <s-button class="card-hover OO-button" @click="showAddRepoDialog = true">
                    {{ $t('buttons.addNewRepo') }}
                </s-button>
            </div>
            <div class="card">test 1</div>
            <div v-for="(repo, index) in repos" :key="index" class="card">
                <div class="card-hover">
                    <s-button class="OO-button">
                        {{ repo.name }}
                    </s-button>
                </div>
            </div>
        </HorizontalCardList>
        <!-- 增减按钮 -->
        <div svgs>
            <s-icon class="card-list-icon-button right" @click="currentCardIndex += 1">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12575" width="200"
                    height="200">
                    <path d="M819.2 512l-472.064 512L204.8 870.4 535.552 512 204.8 153.6 347.136 0 819.2 512z"></path>
                </svg>
            </s-icon>
            <s-icon class="card-list-icon-button left" @click="currentCardIndex -= 1">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                    <g transform="scale(-1, 1) translate(-1024, 0)">
                        <path d="M819.2 512l-472.064 512L204.8 870.4 535.552 512 204.8 153.6 347.136 0 819.2 512z">
                        </path>
                    </g>
                </svg>
            </s-icon>
            <!-- 一个悬浮在中间的指示箭头 -->
            <s-icon class="card-list-indicator">
                <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100" height="100">
                    <path d="M512 0l-512 512h1024z"></path>
                </svg>
            </s-icon>
        </div>
    </div>
    <CreateGameRepo v-model:visible="showAddRepoDialog" />
</template>

<script setup lang="ts">
import { type repo } from '@/scripts/lib/Repo';
import HorizontalCardList from '@/components/base/HorizontalCardList.vue';
import { type Ref, ref, watch, onMounted } from 'vue';
import { $t } from '@/locals/index';
import { useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';
import CreateGameRepo from '@/dialogs/CreateGameRepo.vue';


let repos: Ref<repo[]> | null = null;
const currentCardIndex = ref(1);

watch(currentCardIndex, (newIndex) => {
  // debug
  console.log('Current card index changed:', newIndex);
});


//-============ 添加repo ==============
const showAddRepoDialog = ref(false);





//-============ 初始化 ==============
EventSystem.on(EventType.initDone, () => {
  repos = useGlobalConfig('repos', [] as repo[]).getRef();
});

onMounted(() => {
  // 初始化时获取 repos
  if (repos) {
    console.log('Repos initialized:', repos.value);
  } else {
    console.warn('Repos not initialized yet.');
  }
});
</script>

<style scoped lang="scss">
.card {
  position: relative;
  flex: 0 0 auto;
  width: 200px;
  height: 300px;
  margin: 10px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  background-color: var(--s-color-surface);
  border-radius: 8px;
  box-shadow: var(--s-elevation-1);

  // cursor: pointer;

  transition: transform 0.2s ease, box-shadow 0.2s ease;

  & .card-hover {
    display: none;
  }

  &.focus {
    // outline: 20px solid var(--s-color-primary);
    border: 2px solid var(--s-color-primary);
    transform: scale(1.05);
    animation: gradientBorderAnimation 3s infinite alternate;

    & .card-hover {
      position: absolute;
      top: calc(100% + 20px);
      width: 200px;

      display: flex;
      z-index: 10;

      animation: fadeInFromBottomFlash 0.25s ease-in-out;
    }
  }

}

.card-list-icon-button {
  position: absolute;
  top: 46%;
  height: 8%;
  width: 8%;

  &.left {
    left: 10px;
  }

  &.right {
    right: 10px;
  }

  &:hover {
    color: var(--s-color-on-surface);
  }

  &:active {
    color: var(--s-color-primary);
  }
}

.card-list-indicator {
  position: absolute;
  top: 100px;
  left: 50%;
  transform: translate(-50%, -50%) rotate(180deg);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: bounce-padding 0.7s infinite ease-in-out;

  svg {
    width: 20px;
    height: 20px;
  }
}


@keyframes bounce-padding {

  0%,
  100% {
    padding-top: 10px;
    padding-bottom: 0;
  }

  50% {
    padding-top: 0px;
    padding-bottom: 10px;
  }
}
</style>