<template>
  <RouteList />
</template>

<script setup lang="ts">
import RouteList from './RouteList.vue';
import { invoke } from '@tauri-apps/api/core';

import { onMounted } from 'vue';

onMounted(() => {
  invoke('open_directory_with_default_app', {
    pathStr: "./updater"
  });
});
</script>
