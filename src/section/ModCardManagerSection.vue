<template>
    <div class="mod-card-manager-section">
        <LeftIndex class="OO-left-container OO-box" :structure="IndexStructure" v-model:selected-path="selectedPath" />
        <div class="OO-right-container OO-box">
            <p>Selected Path: {{ selectedPath }}</p>
            <s-scroll-view style="width: 100%;height: auto;">
                <div v-for="(mod, index) in mods" :key="index" class="mod-item">
                    <h2>{{ mod.name?.value || 'Unknown Mod' }}</h2>
                    <p>{{ mod.location?.value || 'Unknown Location' }}</p>
                    <p>Version: {{ mod.id?.value || 'Unknown Version' }}</p>
                    <!-- preview -->
                    <div class="preview" v-if="mod.previewUrlRef">
                        <img :src="mod.previewUrlRef.value" alt="Preview" v-if="mod.previewUrlRef" style="width: 50%;" />
                        <p v-if="mod.previewUrlRef">Preview URL: {{ mod.previewUrlRef.value }}</p>
                        <div v-else>Loading preview...</div>
                    </div>
                </div>
            </s-scroll-view>
        </div>
    </div>

</template>
<script setup lang="ts">
import LeftIndex from '@/components/leftIndex.vue';
import {ModLoader } from '@/scripts/lib/ModLoader';
import { ModInfo } from '@/scripts/lib/ModInfo';
import { ref } from 'vue';

const IndexStructure = {
    "Character": {
        "Character1": {},
        "Character2": {},
        "Character3": {
            "SubCharacter1": {},
            "SubCharacter2": {},
            "SubCharacter3": {}
        }
    },
    "Environment": {
        "Environment1": {},
        "Environment2": {},
        "Environment3": {}
    },
    "Items": {
        "Item1": {},
        "Item2": {},
        "Item3": {}
    },
}
const selectedPath = ref<string>('');

let mods: ModInfo[] = ModLoader.mods;

// 监听 ModLoader 的 mods 变化
ModLoader.onAfterLoad(() => {
    mods = ModLoader.mods;
    console.log('Mods loaded successfully:', mods);
});

</script>

<style scoped lang="scss">
.mod-card-manager-section {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    flex: 0 0 auto;
    place-content: center;
}
</style>

<style lang="scss">
.OO-left-container {
    width: 20vw;
    min-width: 150px;
    max-width: 300px;
    height: 100%;
    padding: 10px;
    margin: 0px 10px;


    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.OO-right-container {
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    margin: 0px 10px 0 0;

    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    box-sizing: border-box;
}
</style>