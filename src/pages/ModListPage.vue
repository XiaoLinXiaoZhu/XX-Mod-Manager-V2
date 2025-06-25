<template>
  <BergerFrame>
    <template #header>
      <BackButton @click="handleBackButtonClick"/>
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
            <p>{{ 'element.helpContent'}}</p>
          </div>
          <SettingSection />
        </SectionSlider>

      </div>
    </template>

    <template #footer>
      <s-button v-if="currentIndex === 0" class="OO-button OO-color-gradient font-hongmeng start-button" style="font-size: large;" @click="handleStartClicked">{{ $t('buttons.useRepo') }}</s-button>

      <UpdateButtonWithInfo v-if="currentIndex === 2"/>
    </template>
  </BergerFrame>
</template>

<script setup lang="ts">
import BergerFrame from '@/components/base/BergerFrame.vue';
import BackButton from '@/components/BackButton.vue';
import ModCardManagerSection from '@/section/ModCardManagerSection.vue';

import SectionSelector from '@/components/base/SectionSelector.vue';
import SectionSlider from '@/components/base/SectionSlider.vue';

import { ref, watch, onMounted } from 'vue';


import { $t, currentLanguageRef } from '../scripts/lib/localHelper';
import UpdateButtonWithInfo from '@/components/updateButtonWithInfo.vue';
import { ConfigLoader } from '@/scripts/core/ConfigLoader';
import { getArgv,type Argv } from '@/scripts/lib/Argv';


import { useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';
import { join } from '@tauri-apps/api/path';
import SettingSection from '@/section/SettingSection.vue';


const currentSection = ref('');
const sections = ref([$t('element.section.mod'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);


watch(currentLanguageRef, () => {
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.mod'), $t('element.section.help'), $t('element.section.settings')];
});

EventSystem.on(EventType.initDone, async () => {
  // 程序现在在 ModListPage.vue 页面，但是我们需要先确认一下状态：
  // 1. 通过 命令行参数直接进入该页面的，那么应该有 argv 的 repoConfigPath 参数
  const argv = await getArgv() as Argv;
  console.log('通过命令行参数进入，repoConfigPath:', argv);

  // 2. 通过 GamePage 进入的，那么应该有 globalConfig 的 lastUsedGameRepo
  // 3. 莫名其妙进入的，不管如何，那么应该是直接 lastUsedGameRepo 的值
  const lastUsedGameRepo = useGlobalConfig("lastUsedGameRepo", "");
  console.log('lastUsedGameRepo:', lastUsedGameRepo.value);

  if (argv && argv.repoConfigPath) {
    // 如果有 repoConfigPath 参数，那么直接使用这个参数
    await ConfigLoader.loadFrom(argv.repoConfigPath);
  } else if (lastUsedGameRepo.value) {
    // 如果没有 repoConfigPath 参数，但是有 lastUsedGameRepo，那么使用这个
    await ConfigLoader.loadFrom(await join(lastUsedGameRepo.value, 'config.json'));
  } else {
    // 如果都没有，那么就不加载任何配置
    console.warn('No repo config path provided, not loading any configuration.');
  }

});

import router from '@/router';
const handleBackButtonClick = () => {
  // 使用router
  router.back();
};
</script>

<style scoped lang="scss">

.start-button{
  position: absolute;
  right: 10px;
}

</style>