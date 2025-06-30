<template>
  <div class="mod-card">
    <h2>{{ modInfo.name || 'Unknown modInfo' }}</h2>
    <p>{{ modInfo.location || 'Unknown Location' }}</p>
    <p>Uid: {{ modInfo.id || 'Unknown Uid' }}</p>
    <p v-if="modInfo.url">URL: <a :href="modInfo.url" target="_blank">{{ modInfo.url }}</a></p>
    <p v-else>No URL provided</p>
    <p v-if="modInfo.addDate">Added on: {{ modInfo.addDate }}</p>
    <!-- preview -->
    <div class="preview" v-if="previewUrlRef">
      <!-- @vue-ignore -->
      <img :src="previewUrlRef" alt="Preview" v-if="previewUrlRef" style="width: 50%;" />
      <p v-if="previewUrlRef">Preview URL: {{ previewUrlRef }}</p>
      <div v-else>Loading preview...</div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { type UnreactiveModInfo } from '@/features/mod-manager/ModInfo';

const props = defineProps<{
  modInfo:UnreactiveModInfo;
}>();

const previewUrlRef = props.modInfo.getReactiveModInfo().previewUrlRef;

</script>

<style scoped lang="scss">
// Your SCSS styles here
</style>