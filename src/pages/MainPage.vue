<template>
  <s-scroll-view style="width: 100%;height: auto;">
    <div v-for="(mod, index) in mods" :key="index" class="mod-item">
      <h2>{{ mod.name.value }}</h2>
      <p>{{ mod.location.value }}</p>
      <p>Version: {{ mod.id.value }}</p>
      <!-- preview -->
      <div class="preview" v-if="mod.previewUrlRef">
        <img :src="mod.previewUrlRef" alt="Preview" v-if="mod.previewUrlRef" style="width: 50%;"/>
        <p v-if="mod.previewUrlRef">Preview URL: {{ mod.previewUrlRef }}</p>
        <div v-else>Loading preview...</div>
      </div>
    </div>
  </s-scroll-view>
</template>

<script setup lang="ts">
import { ModInfo } from '@/scripts/lib/ModInfo';
import { ref, onMounted} from 'vue';
import { ModLoader } from '@/scripts/lib/ModLoader';

const mods = ref<ModInfo[]>([]);

onMounted(() => {
  // Load mods from the ModInfo class
  // debug
  console.log('Loading mods...');
  setTimeout(() => {
    mods.value = ModLoader.mods;
  }, 2000);
});

</script>