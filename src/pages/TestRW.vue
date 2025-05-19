<template>
    <RouteList />
    <h1>Test RW</h1>
    <!-- <pre>{{ content }}</pre> -->
    <s-text-field label="Content" v-model="content" type="multiline" style="min-height: 96px;margin-bottom: 20px;"></s-text-field>
    <s-text-field v-model="filePath" label="File Path"/>
    <s-button class="OO-button" @mousedown="handleTestRead">Test Read</s-button>
    <s-button class="OO-button" @mousedown="handleTestWrite">Test Write</s-button>
</template>

<script setup lang="ts">
//debug
import { onMounted, ref } from 'vue';
import RouteList from './RouteList.vue';
import {readFile, writeFile} from '../scripts/lib/FileHelper.ts';
import { loadImage,writeImageFromUrl } from '@/scripts/lib/ImageHelper';

console.log("TestRW loaded");

const content = ref('');
const filePath = ref('test.txt');

const handleTestRead = async () => {
    const result = await readFile(filePath.value);
    content.value = result as string;
};

const handleTestWrite = async () => {
    const result = await writeFile(filePath.value, content.value);
    console.log("write result", result);
};

onMounted(async () => {
    //debug
    const imageUrl = await loadImage("test.png");
    const image = new Image();
    image.src = imageUrl;
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.style.width = '400px';
    imageElement.style.position = 'absolute';
    imageElement.style.bottom = '0px';
    imageElement.style.right = '0px';
    document.body.appendChild(imageElement);

    // 测试 写入图片功能
    writeImageFromUrl("test2.png",imageUrl,true).then((result) => {
        console.log("write image result", result);
    }).catch((error) => {
        console.error("write image error", error);
    });

    const httpUrl ="https://upload.wikimedia.org/wikipedia/commons/7/7d/Duisburg%2C_Landschaftspark_Duisburg-Nord%2C_Erzbunker_--_2024_--_4214.jpg"
    writeImageFromUrl("test2.png",httpUrl,true).then((result) => {
        console.log("write image result", result);
    }).catch((error) => {
        console.error("write image error", error);
    });
});
</script>
