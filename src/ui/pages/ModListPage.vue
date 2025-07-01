<template>
  <BergerFrame>
    <template #header>
      <BackButton @click="handleBackButtonClick" />
      <h1 draggable>Mod List</h1>
      <SectionSelector :sections="sections" v-model:currentSection="currentSection" v-model:index="currentIndex"
        style="position: absolute; width: 500px; right: 10px;" />
    </template>

    <template #content>
      <div class="main-content" style="height: 100%; width: 100%;overflow: hidden;">
        <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
        <SectionSlider :currentSection="currentIndex" class="section-slider">
          <ModCardManagerSection ref="gameRepoSectionRef" />
          <div>
            <p>{{ 'element.helpContent' }}</p>
          </div>
          <SettingSection />
        </SectionSlider>

      </div>
    </template>

    <template #footer>
      <div v-if="currentIndex === 0" class="start-button">
        <
        <s-button class="OO-button OO-color-gradient font-hongmeng " style="font-size: large;" @click="">{{
          $t('buttons.applyMods') }}
        </s-button>
      </div>

      <UpdateButtonWithInfo v-if="currentIndex === 2" />
    </template>
  </BergerFrame>
</template>

<script setup lang="ts">
import BergerFrame from '../layouts/BergerFrame.vue';
import BackButton from '@/shared/components/BackButton.vue';
import ModCardManagerSection from '@/ui/section/ModCardManagerSection.vue';

import SectionSelector from '@/shared/components/SectionSelector.vue';
import SectionSlider from '@/shared/components/SectionSlider.vue';

import { ref } from 'vue';


import { $t, currentLanguageRef } from '@/shared/composables/localHelper';
import UpdateButtonWithInfo from '@/shared/components/updateButtonWithInfo.vue';
import { ConfigLoader } from '@/core/config/ConfigLoader';


import { useGlobalConfig } from '@/core/config/GlobalConfigLoader';
import { EventSystem, EventType } from '@/core/event/EventSystem';
import SettingSection from '@/ui/section/SettingSection.vue';


const currentSection = ref('');
const sections = ref([$t('element.section.mod'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);


currentLanguageRef.watch(() => {
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.mod'), $t('element.section.help'), $t('element.section.settings')];
});


const rebind = async () => {
  // 重新绑定事件
  // 不管怎么样都是从 globalConfig 中获取 lastUsedGameRepo
  //-==================================================
  //- 💾 加载局部配置
  //-==================================================
  const lastUsedGameRepo = useGlobalConfig("lastUsedGameRepo", "");
  console.log('lastUsedGameRepo:', lastUsedGameRepo.value);

  if (!lastUsedGameRepo.value) {
    throw new Error('No last used game repo found in global config.');
  }

  await ConfigLoader.loadFrom(await path.join(lastUsedGameRepo.value, 'config.json')).then(() => {
    console.log('Config loaded successfully from:', lastUsedGameRepo.value);
  }).catch((error) => {
    console.error('Failed to load config:', error);
  });

  //- 重新绑定语言
  currentLanguageRef.rebind(ConfigLoader.language.getRef());
  //- 重新绑定主题
  currentTheme.rebind(ConfigLoader.theme.getRef());

  //- 重新加载mod
  ModLoader.modSourceFoldersRef.rebind(ConfigLoader.modSourceFolders.getRef());
  // debug
  console.log('Mod source folders:', ModLoader.modSourceFoldersRef.value);
  ModLoader.loadMods().then(() => {
    console.log('Mods loaded successfully.');
  }).catch((error) => {
    console.error('Error loading mods:', error);
  });
};

EventSystem.on(EventType.initDone, async () => {
  // rebind();
});

EventSystem.on(EventType.routeChanged, async (changeInfo: { to: string, from: string }) => {
  if (changeInfo.to === 'ModList') {
    // 重新绑定配置
    rebind();
  }
});

import router from '@/features/router';
import { path } from '@tauri-apps/api';
import { currentTheme } from '@/assets/styles/styleController';
import { ModLoader } from '@/features/mod-manager/ModLoader';
const handleBackButtonClick = () => {
  // 使用router
  router.back();
};
</script>

<style scoped lang="scss">
.start-button {
  position: absolute;
  right: 10px;
}
</style>