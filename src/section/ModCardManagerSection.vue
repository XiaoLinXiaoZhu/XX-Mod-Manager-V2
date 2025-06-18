<template>
    <div class="mod-card-manager-section">
        <LeftIndex class="left-bar OO-box" :structure="IndexStructure" v-model:selected-path="selectedPath" />
        <div class="mod-card-container OO-box">
            <p>Selected Path: {{ selectedPath }}</p>
        </div>
    </div>

</template>
<script setup lang="ts">
import LeftIndex from '@/components/leftIndex.vue';
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
</script>

<style scoped lang="scss">
.mod-card-manager-section {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    flex: 0 0 auto;
    place-content: center;

    .left-bar {
        width: 20vw;
        min-width: 150px;
        max-width: 200px;
        height: 100%;
        padding: 10px;
        margin: 0px 10px;


        display: flex;
        flex-direction: column;
        box-sizing: border-box;


    }

    .mod-card-container {
        flex: 1 1 0;
        min-width: 0;
        height: 100%;
        margin: 0px 10px;

        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        box-sizing: border-box;
    }
}
</style>