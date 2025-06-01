<template>
  <BergerFrame>
    <template #header>
      <BackButton />
      <h1 draggable>Main Page</h1>
      <SectionSelector
        :sections="sections"
        v-model:currentSection="currentSection"
        v-model:index="currentIndex"
        style="position: absolute; width: 500px; right: 10px;"
      />
    </template>

    <template #content>
      <div class="main-content">
        <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
        <TestCardPage />
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
            <span>{{ $t('author') + ":  XLXZ" }}</span>
          </div>
          <span>{{ $t('versionBuildTime') + versionData.pub_date }}</span>
        </s-tooltip>
    </template>
  </BergerFrame>
</template>

<script setup lang="ts">
import BergerFrame from '@/components/base/BergerFrame.vue';
import BackButton from '@/components/BackButton.vue';
import { $t, currentLanguageRef } from '@/locals';
import { $t_snack} from '@/scripts/lib/SnackHelper';
import { checkForUpdates } from '@/scripts/core/UpdateChecker';
import { versionData  } from '@/scripts/lib/VersionInfo';
import TestCardPage from '@/components/TestCardPage.vue';
import SectionSelector from '@/components/base/sectionSelector.vue';
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

import { computed, onMounted, ref, watch } from 'vue';

const currentSection = ref('Section 1');
const sections = ref([$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')]);
const currentIndex = ref(0);

watch(currentLanguageRef, () => {
  // 当语言变化时，重新设置 sections
  sections.value = [$t('element.section.games'), $t('element.section.help'), $t('element.section.settings')];
});

onMounted(() => {
});

</script>

<style scoped lang="scss">
#check-update {
  margin-left: 10px;
  padding: 0px;
  width: 40px;
  height: 40px;
}

.version-info{
  font-size: 14px;
  padding-left: 20px;
  height: 40px;


  color: var(--s-color-on-surface-variant);
  display: flex;
  // 竖向排列
  flex-direction: column;
}
</style>