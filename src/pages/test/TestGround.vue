<!-- 任何临时测试都可以放到这里 -->
<template>
<CreateGameRepo v-model:visible="showAddRepoDialog" />
</template>

<script setup lang="ts">
import CreateGameRepo from '@/dialogs/CreateGameRepo.vue';
import { onMounted, ref } from 'vue';

const showAddRepoDialog = ref(true);

onMounted(() => {
    console.log('Mounted, showing add repo dialog');
    showAddRepoDialog.value = true;
});
</script>
