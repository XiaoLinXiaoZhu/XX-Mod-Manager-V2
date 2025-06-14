<!-- 任何临时测试都可以放到这里 -->
<template>
<div style="height: 400px; width: 100%;">
    <EditRepo :repo="templateRepo" />
</div>
</template>

<script setup lang="ts">
import EditRepo from '@/components/EditRepo.vue';
import { ref } from 'vue';
import { type repo } from '@/scripts/lib/Repo';

const templateRepo: repo = {
    uid: 'test-repo',
    name: '测试仓库',
    location: "E:\\1myProgramFile\\electron Files\\xxmmv2temp\\zzz",
    cover: 'cover2.jpg',
};
</script>
