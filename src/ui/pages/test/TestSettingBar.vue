<template>
<settingBar :data="selectFolder" />
{{ selectFolder.dataRef }}
<settingBar :data="selectSection" />
{{ selectSection.dataRef }}

<settingBar :data="selectMultiDir" />
{{ selectMultiDir.dataRef }}
</template>


<script setup lang="ts">
import { ref } from 'vue';
import settingBar from '@/features/settings/settingBar.vue';
import { type SettingBarData } from '@/features/settings/settingBarConfig';

const selectFolder :SettingBarData = {
    type: 'dir',
    dataRef: ref<string>(''),
    displayName: '选择文件夹',
    t_displayName: {
        "en-US": "Select Folder",
        "zh-CN": "选择文件夹",
    },
    description: '请选择一个文件夹',
    t_description: {
        "en-US": "Please select a folder",
        "zh-CN": "请选择一个文件夹",
    },
    onChange: (value: string[]) => {
        console.log('Selected folder:', value);
    },
}

const selectSection : SettingBarData = {
    type: "select",
    dataRef: ref<string>(''),
    displayName: '选择区域',
    t_displayName: {
        "en-US": "Select Section",
        "zh-CN": "选择区域",
    },
    description: '请选择一个区域',
    t_description: {
        "en-US": "Please select a section",
        "zh-CN": "请选择一个区域",
    },
    options: [
        { value: 'section1', t_value: { "en-US": "Section 1", "zh-CN": "区域 1" } },
        { value: 'section2', t_value: { "en-US": "Section 2", "zh-CN": "区域 2" } },
    ],
    onChange: (value: string[]) => {
        console.log('Selected section:', value);
    },
}

const selectMultiDir : SettingBarData = {
    type: "dir:multi",
    dataRef: ref<string[]>([]),
    displayName: '选择多个文件夹',
    t_displayName: {
        "en-US": "Select Multiple Folders",
        "zh-CN": "选择多个文件夹",
    },
    description: '请选择多个文件夹',
    t_description: {
        "en-US": "Please select multiple folders",
        "zh-CN": "请选择多个文件夹",
    },
    onChange: (value: string[]) => {
        console.log('Selected multiple folders:', value);
    },
}

</script>