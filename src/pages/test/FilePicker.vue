<template>
    <div class="file-picker">
        <!-- 自定义标题 -->
        <h3>{{ title }}</h3>

        <!-- 触发按钮 -->
        <button @click="openFilePicker();">
            {{ buttonText }}
        </button>

        <!-- 显示已选文件 -->
        <div v-if="selectedFiles.length" class="selected-files">
            <p>已选文件：</p>
            <ul>
                <li v-for="(file, index) in selectedFiles" :key="index">
                    {{ file }}
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { openFileDialog,FileDialogOption } from '@/scripts/lib/FileDialogHelper';

const openFilePicker = async () => {
    const dialogSettings: FileDialogOption = {
        title: props.title || '选择文件',
        filters: props.accept ? props.accept.split(',').map(ext => ({ name: ext, extensions: [ext.replace(/^\./, '')] })) : [],
        multiple: props.allowMultiple || false,
        folder: props.selectDirectory || false
    };
    const input = await openFileDialog(dialogSettings);
    console.log("选择的文件:", input);
    selectedFiles.value = input || [];
}
// Props
const props = defineProps<{
    title?: string
    buttonText?: string
    accept?: string // 如 ".json,.txt"
    allowMultiple?: boolean
    selectDirectory?: boolean
}>()

const selectedFiles = ref<string[]>([])
</script>

<style lang="scss" scoped>
.file-picker {
    padding: 16px;
    border: 1px solid #ccc;
    border-radius: 8px;

    h3 {
        margin-bottom: 10px;
    }

    input[type="file"] {
        display: none;
    }

    button {
        padding: 8px 16px;
        background-color: #4caf50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .selected-files {
        margin-top: 16px;

        ul {
            list-style-type: none;
            padding-left: 0;

            li {
                margin-bottom: 4px;
            }
        }
    }
}
</style>