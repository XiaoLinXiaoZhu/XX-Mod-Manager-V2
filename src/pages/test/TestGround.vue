<!-- 任何临时测试都可以放到这里 -->
<template>
<CreateGameRepo v-model:visible="showAddRepoDialog" />
</template>

<script setup lang="ts">
import EditRepo from '@/components/EditRepo.vue';
import CreateGameRepo from '@/dialogs/CreateGameRepo.vue';
import { onMounted, ref } from 'vue';
import { type repo } from '@/scripts/lib/Repo';

const showAddRepoDialog = ref(true);
const templateRepo: repo = {
    uid: 'test-repo',
    name: '测试仓库',
    location: "E:\\1myProgramFile\\electron Files\\xxmmv2temp\\zzz",
    cover: 'cover2.jpg',
};

onMounted(() => {
    console.log('Mounted, showing add repo dialog');
    showAddRepoDialog.value = true;
});
</script>
