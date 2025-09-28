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
        <SectionSlider :currentSection="currentIndex" class="section-slider">
          <ModCardManagerSection ref="modCardManagerSectionRef" />
          <div>
            <p>{{ 'element.helpContent' }}</p>
          </div>
          <SettingSection />
        </SectionSlider>

      </div>
    </template>

    <template #footer>
      <div v-if="currentIndex === 0" class="start-button">
        <s-button class="OO-button OO-color-gradient font-hongmeng " style="font-size: large;" @click="handleApplyButtonClicked">{{
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

import { computed, ref, watch } from 'vue';


import { $rt, $t, currentLanguageRef, getTranslatedText } from '@/compat/legacy-bridge';
import UpdateButtonWithInfo from '@/shared/components/updateButtonWithInfo.vue';
import { SubConfig } from '@/compat/legacy-bridge';


import { useGlobalConfig } from '@/compat/legacy-bridge';
import { EventSystem, EventType } from '@/compat/legacy-bridge';
import SettingSection from '@/ui/section/SettingSection.vue';


const currentSection = ref('');
// const sections = ref([$t('element.section.mod'), $t('element.section.help'), $t('element.section.settings')]);
const sections = computed(() => [
  $t("element.section.mod"),
  $t("element.section.help"),
  $t("element.section.settings")
]);
const currentIndex = ref(0);


const init = async () => {
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

  await SubConfig.loadFrom(await path.join(lastUsedGameRepo.value, 'config.json')).then(() => {
    console.log('Config loaded successfully from:', lastUsedGameRepo.value);
  }).catch((error) => {
    console.error('Failed to load config:', error);
  });

  //- 重新加载mod
  ModLoader.modSourceFoldersRef.rebind(SubConfig.modSourceFolders);
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
    init();
  }
});

import { router, ModLoader, applyMod } from '@/compat/legacy-bridge';
import { path } from '@tauri-apps/api';
import { $t_snack } from '@/shared/composables/use-snack';


const handleBackButtonClick = () => {
  // 使用router
  router.back();
};


const modCardManagerSectionRef = ref<InstanceType<typeof ModCardManagerSection> | null>(null);
const handleApplyButtonClicked = () => {
  if (modCardManagerSectionRef.value) {
    console.log(modCardManagerSectionRef.value.ifModSelected);
    const ifModSelected = modCardManagerSectionRef.value.ifModSelected;
    const selectedMods = ModLoader.mods.filter((_mod, index) => {
      return ifModSelected[index];
    });
    console.log('Selected Mods:', selectedMods);

    const distFolder = SubConfig.modTargetFolder.value;
    const ifUseTraditionalApply = SubConfig.ifUseTraditionalApply.value;
    
    applyMod( ModLoader.mods, selectedMods, distFolder, !ifUseTraditionalApply)
      .then(() => {
        $t_snack('applyMods.success', "success");
      })
      .catch((error) => {
        console.error('Error applying mods:', error);
        $t_snack('applyMods.error', "error");
      });

  }
};

</script>

<style scoped lang="scss">
.start-button {
  position: absolute;
  right: 10px;
}
</style>