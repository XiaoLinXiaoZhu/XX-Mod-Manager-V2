<template>
  <ToggleableCardElement v-model:clicked="clicked" class="mod-item-container" :display="props.display">
    <template #image>
      <!-- @vue-ignore -->
      <img :src="previewUrlRef" id="mod-item-image" alt="Mod Preview" v-if="previewUrlRef" />
      <div class="placeholder" v-else>Loading preview...</div>
    </template>
    <template #headline>
      <div id="mod-item-headline">{{ props.modInfo.metadata.name.value || 'Unknown Mod' }}</div>
    </template>
    <template #subhead>
      <div id="mod-item-subhead">{{ props.modInfo.metadata.category.value || 'Unknown Category' }}</div>
    </template>
    <template #text>

    </template>
  </ToggleableCardElement>
</template>

<script setup lang="ts">
import { ModInfo } from '@/compat/legacy-bridge';
import ToggleableCardElement from './ToggleableCardElement.vue';

const props = defineProps<{
  modInfo: ModInfo;
  display: boolean;
}>();

const clicked = defineModel<boolean>('clicked', {
  type: Boolean,
  default: false,
});

const previewUrlRef = props.modInfo.previewManager.previewUrlRef;

</script>

<style scoped lang="scss">
.mod-item-container {
  // 大小
  width: fit-content;
  height: fit-content;
}

.mod-item {

  & div[slot="image"] {
    width: 250px;
    height: 200px;
  }

  .hidden {
    display: none;
  }
}

#mod-item-image {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  user-drag: none;
  -webkit-user-drag: none;
}

.mod-item #mod-item-headline {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 12px;
}

.mod-item #mod-item-subhead {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: -2px;
}

.mod-item #mod-item-text {
  height: 100px;
  margin-top: -10px;
  border: 0;
}

.mod-item s-scroll-view {
  height: 100%;
  width: 110%;
}

.mod-item .placeholder {
  height: 80px;
  border: 0;
}

.mod-item[compact="true"] {
  width: 250px;
  height: 150px;
  transition: all 0.4s;
}

.mod-item[compact="true"] img {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
  /* position: absolute; */
  filter: blur(5px);
  opacity: 0.2;
}

.mod-item[compact="true"] div[slot="image"] {
  position: absolute;
  z-index: -1;
}

.hotkey-container {
  overflow-y: hidden;
  overflow-x: auto;
  height: 25px;
  align-items: center;
  max-width: 450px;
  padding: 0px 0px;
  border-radius: 0 20px 0 20px;

  position: absolute;
  bottom: 5px;
  left: 10px;
  right: 5px;
}

.hotkey-container-inline {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  overflow-x: auto;
  height: 25px;
  align-items: center;
  max-width: 450px;
  padding: 0px 0px;
  border-radius: 0 20px 0 20px;

  position: absolute;
  bottom: 5px;
  left: 10px;
  right: 5px;
}
</style>