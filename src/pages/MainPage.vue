<template>
  <BergerFrame>
    <template #header>
      <BackButton />
      <h1 draggable>{{ getTranslatedText({ "en-US": "Main Page", "zh-CN": "主页面" }) }}</h1>

      <SectionSelector :sections="sections" v-model:currentSection="currentSection" v-model:index="currentIndex"
        style="position: absolute; width: 500px; right: 10px;" />
    </template>

    <template #content>
      <div class="main-content" style="height: 100%; width: 100%;overflow: hidden;">
        <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
        <SectionSlider :currentSection="currentIndex" class="section-slider">
          <GameRepoSection ref="gameRepoSectionRef" />
          <div>
            <p>{{ 'element.helpContent' }}</p>
          </div>
          <div>
            <p>{{ 'element.settingsContent' }}</p>
          </div>
        </SectionSlider>

      </div>
    </template>

    <template #footer>
      <!-- <p>&copy; 2023 Your Company</p> -->
      <UpdateButtonWithInfo />
      <s-button v-if="currentIndex === 0" class="OO-button OO-color-gradient font-hongmeng start-button"
        @click="handleStartClicked">{{ $t('buttons.useRepo') }}</s-button>
    </template>
  </BergerFrame>
</template>

<script setup lang="ts">
import BergerFrame from '@/components/base/BergerFrame.vue';
import BackButton from '@/components/BackButton.vue';

import SectionSelector from '@/components/base/SectionSelector.vue';
import SectionSlider from '@/components/base/SectionSlider.vue';

import { ref, watch, type Ref } from 'vue';


import { $t, currentLanguageRef, getTranslatedText } from '../scripts/lib/localHelper';
import UpdateButtonWithInfo from '@/components/updateButtonWithInfo.vue';
import GameRepoSection from '@/section/GameRepoSection.vue';
import { ConfigLoader } from '@/scripts/core/ConfigLoader';
import { join } from '@tauri-apps/api/path';
import router from '@/router';
import { useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';


const currentSection = ref('Section 1');
const sections = ref([$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);


currentLanguageRef.watch((newLocale) => {
  // debug
  console.log('语言变化:', newLocale, "重新设置 sections");
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')];
});

const gameRepoSectionRef: Ref<InstanceType<typeof GameRepoSection> | null> = ref(null);
const handleStartClicked = async () => {
  if (gameRepoSectionRef.value) {
    const currentRepo = gameRepoSectionRef.value.getCurrentRepo();
    if (currentRepo) {
      console.log('Starting game with repo:', currentRepo);
      await ConfigLoader.loadFrom(await join(currentRepo.configLocation, 'config.json'));
      useGlobalConfig("lastUsedGameRepo", currentRepo.configLocation).set(currentRepo.configLocation);
      // route to ModListPage
      router.push({
        name: 'ModList'
      });
    } else {
      console.warn('No game repository selected.');
    }
  }
}

import { type I18nLocale } from '@/scripts/lib/localHelper.ts';
import { currentTheme, type Theme } from '@/assets/styles/styleController.ts';



const rebind = () => {
  //-================================
  //-💾 重新绑定回全局配置
  //-================================
  //- 1. rebind 一下语言
  currentLanguageRef.rebind(useGlobalConfig('language', 'zh-CN' as I18nLocale).getRef());

  //- 2. rebind 一下主题
  currentTheme.rebind(useGlobalConfig('theme', 'dark' as Theme).getRef());
};

EventSystem.on(EventType.initDone, () => {
  rebind();
});

EventSystem.on(EventType.routeChanged, (changeInfo: { to: string, from: string }) => {
  //-================================
  //-🔄 路由变化时，重新绑定
  //-================================
  //debug
  console.log('Route changed from', changeInfo.from, 'to', changeInfo.to);
  if (changeInfo.to === 'Main') {
    rebind();
  }
});

</script>

<style scoped lang="scss">
.start-button {
  position: absolute;
  right: 10px;
}
</style>