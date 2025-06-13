<template>
    <!-- -markdown -->
    <div v-if="data.type === 'markdown'">
        <markdown v-if="data.t_description"
            :content="getTranslatedText(data.t_description).value || data.description || ''"></markdown>
        <markdown v-else :content="data.description || ''"></markdown>
    </div>
    <!-- -hidden -->
    <div v-else-if="data.type === 'hidden'" style="display: none;">
        <h3 v-if="data.t_displayName">{{ getTranslatedText(data.t_displayName) }}</h3>
        <h3 v-else>{{ data.displayName }}</h3>

        <!-- rawData -->
        <p>{{ data.dataRef }}</p>
    </div>
    <div class="OO-setting-bar" v-else-if="display">
        <h3 v-if="data.t_displayName">{{ getTranslatedText(data.t_displayName) }}</h3>
        <h3 v-else>{{ data.displayName }}</h3>

        <!-- -boolean -->
        <s-switch v-if="data.type === 'boolean'" :checked="data.dataRef.value"
            @change="onChange(($event.target as HTMLInputElement).checked)" class="OO-color-gradient-word"></s-switch>

        <!-- -string -->
        <s-text-field v-else-if="data.type === 'string'" :value="data.dataRef.value"
            @input="onChange(($event.target as HTMLInputElement).value)"></s-text-field>

        <!-- -number -->
        <s-text-field :value="data.dataRef.value" @input="onChange(($event.target as HTMLInputElement).value)"
            v-else-if="data.type === 'number'"></s-text-field>

        <!-- -select -->
        <div v-else-if="data.type === 'select'"
            style="display: flex;flex-direction:row;max-width: calc(100vw - 600px);overflow: hidden;">
            <horizontal-scroll-bar>
                <div v-for="(option, index) in data.options" :key="index" style="margin-left: 3px;">
                    <input type="radio" :name="data.name" :id="option.value" :value="option.value"
                        v-model="data.dataRef.value">
                    <label :for="option.value">
                        <s-chip selectable="true" type="outlined" :id="option.value" @click="onChange(option.value)"
                            :class="{ 'OO-color-gradient': data.dataRef.value === option.value }">
                            <p>{{ option.t_value ? getTranslatedText(option.t_value).value : option.value }}</p>
                        </s-chip>
                    </label>
                </div>
            </horizontal-scroll-bar>
        </div>

        <!-- -dir -->
        <div v-else-if="data.type === 'dir'" class="OO-s-text-field-container">
            <s-text-field :value="data.dataRef.value" @input="onChange(($event.target as HTMLInputElement).value)">
            </s-text-field>
            <s-icon-button type="filled" slot="start" class="OO-icon-button" @click="handleDirectorySelect">
                <s-icon name="add"></s-icon>
            </s-icon-button>
        </div>

        <!-- -ini -->
        <div v-else-if="data.type === 'file:ini'" class="OO-s-text-field-container">
            <s-text-field :value="data.dataRef.value" @input="onChange(($event.target as HTMLInputElement).value)">
            </s-text-field>
            <s-icon-button type="filled" slot="start" class="OO-icon-button" @click="handleIniFileSelect">
                <s-icon name="add"></s-icon>
            </s-icon-button>
        </div>

        <!-- -exePath -->
        <div v-else-if="data.type === 'file:exe'" class="OO-s-text-field-container">
            <s-text-field :value="data.dataRef.value" @input="onChange(($event.target as HTMLInputElement).value)">
            </s-text-field>
            <s-icon-button type="filled" slot="start" class="OO-icon-button" @click="handleExeFileSelect">
                <s-icon name="add"></s-icon>
            </s-icon-button>
        </div>

        <!-- -button -->
        <s-button @click="onChange()" v-else-if="data.type === 'button'">
            {{ data.t_buttonName ? getTranslatedText(data.t_buttonName).value : data.buttonName }}
        </s-button>


        <!-- -iconButton -->
        <s-tooltip style="position: relative;left: 15px;" v-if="data.type === 'iconButton'">
            <s-icon-button icon="image" class="OO-icon-button"
                style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);" slot="trigger"
                @click="onChange()">
                <s-icon v-html="data.icon ? data.icon : defaultIcon">
                </s-icon>
            </s-icon-button>

            <p style="line-height: 1.2;">
                {{ data.t_buttonName ? getTranslatedText(data.t_buttonName).value : data.buttonName }}
            </p>
        </s-tooltip>
    </div>
    <div class="OO-setting-bar" v-else>
        <h3 v-if="data.t_displayName">{{ getTranslatedText(data.t_displayName).value }}</h3>
        <h3 v-else>{{ data.displayName }}</h3>
    </div>

    <div v-if="data.type === 'markdown'">
        <s-markdown :content="data.dataRef"></s-markdown>
    </div>
    <div v-else-if="data.t_description">
        <p> {{ getTranslatedText(data.t_description).value }} </p>
    </div>
    <div v-else-if="data.description !== ''">
        <p> {{ data.description }} </p>
    </div>
</template>

<script setup lang="ts">
import markdown from '@/components/base/markdown.vue';
import horizontalScrollBar from '@/components/base/horizontalScrollBar.vue';

import { ref, defineProps, defineEmits, onMounted } from 'vue';
import { getTranslatedText } from '@/locals';
import type { SettingBarData } from './settingBarConfig';
import { type FileDialogOption, openFileDialog } from '@/scripts/lib/FileDialogHelper';

const props = defineProps<{
    data: SettingBarData
}>()

const display = ref(true);

// 默认icon
const defaultIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960"><path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path></svg>`;

// 几个文件选取写这里，避免臃肿
const handleDirectorySelect = async () => {
    const dialogTitle = props.data.t_displayName ? getTranslatedText(props.data.t_displayName).value : props.data.displayName;
    const dialogSettings: FileDialogOption = {
        title: dialogTitle,
        filters: [{ name: 'Directories', extensions: [''] }],
        multiple: false,
        folder: true
    };
    const input = await openFileDialog(dialogSettings);
    console.log("选择的文件:", input);
    if (input && input.length > 0) {
        // debug
        console.log("选择的目录:", input[0], typeof props.data.dataRef);
        props.data.dataRef.value = input[0];
        onChange(input[0]);
    } else {
        console.warn("没有选择任何文件或目录");
    }
};
const handleIniFileSelect = async () => {
    const dialogTitle = props.data.t_displayName ? getTranslatedText(props.data.t_displayName).value : props.data.displayName;
    const dialogSettings: FileDialogOption = {
        title: dialogTitle,
        filters: [{ name: 'INI Files', extensions: ['ini'] }],
        multiple: false,
        folder: false
    };
    const input = await openFileDialog(dialogSettings);
    console.log("选择的文件:", input);
    if (input && input.length > 0) {
        props.data.dataRef.value = input[0];
        onChange(input[0]);
    } else {
        console.warn("没有选择任何文件或目录");
    }
};
const handleExeFileSelect = async () => {
    const dialogTitle = props.data.t_displayName ? getTranslatedText(props.data.t_displayName).value : props.data.displayName;
    const dialogSettings: FileDialogOption = {
        title: dialogTitle,
        filters: [{ name: 'Executable Files', extensions: ['exe'] }],
        multiple: false,
        folder: false
    };
    const input = await openFileDialog(dialogSettings);
    console.log("选择的文件:", input);
    if (input && input.length > 0) {
        props.data.dataRef.value = input[0];
        onChange(input[0]);
    } else {
        console.warn("没有选择任何文件或目录");
    }
};




// 重新代理 onChange 方法
const emit = defineEmits(['change']);
function onChange(value?: any) {
    emit('change', value, props.data.type, props.data);
    const result = props.data.onChange ? props.data.onChange(value) : undefined;

    // 如果 result 不为 undefined 则说明， 显示的值需要更新
    if (result !== undefined) {
        //debug
        console.log("☝️🤓", result);
        props.data.dataRef.value = result;
        // 强制更新
        refresh();
    }    // 如果是 select 类型的，需要 更新一下以应用 颜色
    if (props.data.type === 'select') {
        console.log("select type, dataRef status:", props.data.dataRef, typeof props.data.dataRef);
    }

    // 检查 dataRef 是否是对象，并且是否有 value 属性来判断是否是 Ref
    if (typeof props.data.dataRef === 'string' || typeof props.data.dataRef !== 'object' || !('value' in props.data.dataRef)) {
        console.warn("dataRef 不是一个 Ref 对象，正在恢复...", props.data.dataRef);
        // 创建一个临时的值存储选中的值
        const selectedValue = props.data.dataRef;
        // 重新创建一个 Ref 对象
        props.data.dataRef = ref(selectedValue);
    }
};

function refresh() {
    display.value = false;
    setTimeout(() => {
        display.value = true;
    }, 1);
}

onMounted(() => {
    // console.log(data.value);
    // 有的设置项是从 iManager 中获取的，所以需要 刷新一下
    // data.value.dataRef.value = data.value.dataRef.value;
});
</script>