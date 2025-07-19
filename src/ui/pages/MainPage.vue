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
            <GlobalConfigSection />
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
import BergerFrame from '@/ui/layouts/BergerFrame.vue';
import BackButton from '@/shared/components/BackButton.vue';
import GlobalConfigSection from '@/ui/section/GlobalConfigSection.vue';
import SectionSelector from '@/shared/components/SectionSelector.vue';
import SectionSlider from '@/shared/components/SectionSlider.vue';

import { computed, ref, type Ref } from 'vue';


import { $rt, $t, currentLanguageRef, getTranslatedText } from '@/shared/composables/localHelper';
import UpdateButtonWithInfo from '@/shared/components/updateButtonWithInfo.vue';
import GameRepoSection from '@/ui/section/GameRepoSection.vue';
import { ConfigLoader } from '@/core/config/ConfigLoader';
import { join } from '@tauri-apps/api/path';
import router from '@/features/router';
import { GlobalConfigLoader, useGlobalConfig } from '@/core/config/GlobalConfigLoader';
import { EventSystem, EventType } from '@/core/event/EventSystem';
import { sharedConfigManager } from '@/core/state/SharedConfigManager';

const currentSection = ref('Section 1');
const sections = computed(() => {
  // debug language
  const result = [
    $t('element.section.games'),
    $t('element.section.help'),
    $t('element.section.settings')
  ];
  console.log('Section get Current language:', currentLanguageRef.value , result);
  return result;
});
const currentIndex = ref(0);

const gameRepoSectionRef: Ref<InstanceType<typeof GameRepoSection> | null> = ref(null);
const handleStartClicked = async () => {
  if (gameRepoSectionRef.value) {
    const currentRepo = gameRepoSectionRef.value.getCurrentRepo();
    if (currentRepo) {
      console.log('Starting game with repo:', currentRepo);
      await ConfigLoader.loadFrom(await join(currentRepo.configLocation, 'config.json'));
      useGlobalConfig("lastUsedGameRepo", currentRepo.configLocation).value = currentRepo.configLocation;
      // route to ModListPage
      router.push({
        name: 'ModList'
      });
    } else {
      console.warn('No game repository selected.');
    }
  }
};
</script>

<style scoped lang="scss">
.start-button {
  position: absolute;
  right: 10px;
}
</style>