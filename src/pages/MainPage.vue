<template>
  <BergerFrame>
    <template #header>
      <BackButton />
      <h1 draggable>Main Page</h1>
      <SectionSelector :sections="sections" v-model:currentSection="currentSection" v-model:index="currentIndex"
        style="position: absolute; width: 500px; right: 10px;" />
    </template>

    <template #content>
      <div class="main-content" style="height: 100%; width: 100%;overflow: hidden;">
        <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
        <SectionSlider :currentSection="currentIndex" class="section-slider">
          <GameRepoSection/>
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
      <UpdateButtonWithInfo />
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

import { computed, onMounted, ref, watch, type Ref } from 'vue';

import { useGlobalConfig } from '@/scripts/core/GlobalConfigLoader';
import { type repo } from '@/scripts/lib/Repo';
import DialogTemplate from '@/dialogs/dialogTemplate.vue';

let repos: Ref<repo[]> | null = null;

import { $t, currentLanguageRef } from '@/locals';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';
import UpdateButtonWithInfo from '@/components/updateButtonWithInfo.vue';
import GameRepoSection from '@/section/GameRepoSection.vue';

const showDialog = ref(false);
const showDialog2 = ref(false);

const currentSection = ref('Section 1');
const sections = ref([$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);


watch(currentLanguageRef, () => {
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')];
});

</script>

<style scoped lang="scss">






</style>