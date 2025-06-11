<template>
  <BergerFrame>
    <template #header>
      <BackButton />
      <h1 draggable>Test Dialog Page</h1>
      <SectionSelector :sections="sections" v-model:currentSection="currentSection" v-model:index="currentIndex"
        style="position: absolute; width: 500px; right: 10px;" />
    </template>

    <template #content>
      <div class="main-content" style="height: 100%; width: 100%;overflow: hidden;">
        <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
        <SectionSlider :currentSection="currentIndex" class="section-slider">
          {{ currentCardIndex }}
          <div style="width: 100px;">
            <button @click="showDialog = true">打开对话框</button>
          </div>
          <div
            style="display: flex; flex-direction: column; height: 100%; width: 100%;flex: 0 0 auto;align-content: center;justify-content: center;align-items: center;">
            <HorizontalCardList style="width: 100%; overflow: visible;" v-model:focused-index="currentCardIndex">
              <div class="card">AddNewRepo
                <s-button class="card-hover OO-button">
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
            <s-icon class="card-list-icon-button right" @click="currentCardIndex += 1">
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="12575" width="200"
                height="200">
                <path d="M819.2 512l-472.064 512L204.8 870.4 535.552 512 204.8 153.6 347.136 0 819.2 512z"></path>
              </svg>
            </s-icon>
            <s-icon class="card-list-icon-button left" @click="currentCardIndex -= 1">
              <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" width="200" height="200">
                <g transform="scale(-1, 1) translate(-1024, 0)">
                  <path d="M819.2 512l-472.064 512L204.8 870.4 535.552 512 204.8 153.6 347.136 0 819.2 512z"></path>
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
          <div>
            <p>{{ $t('element.helpContent') }}</p>
          </div>
          <div>
            <p>{{ $t('element.settingsContent') }}</p>
          </div>
        </SectionSlider>

      </div>
    </template>

    <template #footer>
      <!-- <p>&copy; 2023 Your Company</p> -->
      <s-tooltip>
        <s-icon-button class="OO-button" id="check-update" @click="handleCheckUpdate" slot="trigger">
          <svg viewBox="0 -960 960 960">
            <path
              d="M480-120q-75 0-140.5-28.5t-114-77q-48.5-48.5-77-114T120-480q0-75 28.5-140.5t77-114q48.5-48.5 114-77T480-840q82 0 155.5 35T760-706v-94h80v240H600v-80h110q-41-56-101-88t-129-32q-117 0-198.5 81.5T200-480q0 117 81.5 198.5T480-200q105 0 183.5-68T756-440h82q-15 137-117.5 228.5T480-120Zm112-192L440-464v-216h80v184l128 128-56 56Z">
            </path>
          </svg>
        </s-icon-button>
        {{ $t('buttons.checkUpdate') }}
      </s-tooltip>
      <s-tooltip>
        <div slot="trigger" class="version-info">
          <span>{{ $t('currentVersion') + versionData.version }}</span>
          <span>{{ $t('author') + ": XLXZ" }}</span>
        </div>
        <span>{{ $t('versionBuildTime') + versionData.pub_date }}</span>
      </s-tooltip>
    </template>
  </BergerFrame>

  <DialogTemplate v-model:visible="showDialog" :close-on-click-mask="false" width="500px">
    <template #default>
      <p>这是一个可交互的对话框内容。</p>
      <button @click="showDialog2 = true">打开第二个对话框</button>
    </template>
  </DialogTemplate>
    <DialogTemplate v-model:visible="showDialog2" :close-on-click-mask="false" width="500px">
    <template #default>
      <p>用于测试多个对话框的显示。</p>
    </template>
  </DialogTemplate>
</template>

<script setup lang="ts">
import BergerFrame from '@/components/base/BergerFrame.vue';
import BackButton from '@/components/BackButton.vue';

import SectionSelector from '@/components/base/SectionSelector.vue';
import SectionSlider from '@/components/base/SectionSlider.vue';
import HorizontalCardList from '@/components/base/HorizontalCardList.vue';

import { computed, onMounted, ref, watch, type Ref } from 'vue';

import { useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { type repo } from '@/scripts/lib/Repo';
import DialogTemplate from '@/dialogs/dialogTemplate.vue';

let repos: Ref<repo[]> | null = null;

import { $t, currentLanguageRef } from '@/locals';
import { $t_snack } from '@/scripts/lib/SnackHelper';
import { checkForUpdates } from '@/scripts/core/UpdateChecker';
import { versionData } from '@/scripts/lib/VersionInfo';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';

const handleCheckUpdate = async () => {
  // Logic to check for updates
  console.log('Checking for updates...');
  checkForUpdates({
    onStartGetNewVersion: async () => {
      await $t_snack("buttons.checkUpdate", "info");
    },
    onAlreadyLatestVersion: async () => {
      await $t_snack("message.alreadyLatestVersion", "success");
    },
  });
};

const showDialog = ref(false);
const showDialog2 = ref(false);

const currentSection = ref('Section 1');
const sections = ref([$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);
const currentCardIndex = ref(1);

watch(currentLanguageRef, () => {
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')];
});


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

watch(currentCardIndex, (newIndex) => {
  // debug
  console.log('Current card index changed:', newIndex);
});

</script>

<style scoped lang="scss">
#check-update {
  margin-left: 10px;
  padding: 0px;
  width: 40px;
  height: 40px;
}

.version-info {
  font-size: 14px;
  padding-left: 20px;
  height: 40px;


  color: var(--s-color-on-surface-variant);
  display: flex;
  // 竖向排列
  flex-direction: column;
}

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