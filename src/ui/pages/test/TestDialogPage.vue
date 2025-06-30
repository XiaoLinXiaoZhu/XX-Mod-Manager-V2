<template>
    <BergerFrame>
        <template #header>
            <BackButton />
            <h1 draggable>Test Dialog Page</h1>
        </template>

        <template #content>
            <div class="main-content" style="height: 100%; width: 100%;overflow: hidden;">
                <!-- 主页面有三个主要功能: 查看所有的子配置项，新建新的仓库，打开设置面板 -->
                <div style="width: 100px;">
                    <button @click="showDialog = true">打开对话框</button>
                </div>
            </div>
        </template>

        <template #footer>
            <UpdateButtonWithInfo/>
        </template>
    </BergerFrame>

    <DialogTemplate v-model:visible="showDialog" :close-on-click-mask="false">
        <template #default>
            <p>这是一个可交互的对话框内容。</p>
            <button @click="showDialog2 = true">打开第二个对话框</button>
        </template>
    </DialogTemplate>
    <DialogTemplate v-model:visible="showDialog2" :close-on-click-mask="false">
        <template #default>
            <p>用于测试多个对话框的显示。当前对话框: 2</p>
            <button @click="showDialog3 = true">打开第三个对话框</button>
            <p>测试snake 是否在任何时候都位于最上层</p>
            <s-button class="OO-button" @click="snack('这是一个测试消息', 'info')">测试 Snack</s-button>
        </template>
    </DialogTemplate>
    <DialogTemplate v-model:visible="showDialog3" :close-on-click-mask="true">
        <template #default>
            <p>这是第三个对话框。当前对话框: 3</p>
            <p>可以点击遮罩关闭对话框</p>
            <button @click="showDialog4 = true">打开第四个对话框</button>
            <p>测试snake 是否在任何时候都位于最上层</p>
            <s-button class="OO-button" @click="$t_snack('这是一个测试消息', 'info')">测试 Snack</s-button>
        </template>
    </DialogTemplate>
    <DialogTemplate v-model:visible="showDialog4" :close-on-click-mask="false">
        <template #default>
            <p>这是第四个对话框。当前对话框: 4</p>
            <button @click="showDialog4 = false">关闭对话框</button>
        </template>
    </DialogTemplate>
</template>

<script setup lang="ts">
import BergerFrame from '@/ui/layouts/BergerFrame.vue';
import BackButton from '@/shared/components/BackButton.vue';
import UpdateButtonWithInfo from '@/shared/components/updateButtonWithInfo.vue';

import DialogTemplate from '@/ui/dialogs/dialogTemplate.vue';

import { $t_snack,snack} from '@/shared/composables/use-snack';
import {ref } from 'vue';



const showDialog = ref(false);
const showDialog2 = ref(false);
const showDialog3 = ref(false);
const showDialog4 = ref(false);

</script>

<style scoped lang="scss">
#check-update {
    margin-left: 10px;
    padding: 0px;
    width: 40px;
    height: 40px;
}

.version-info {
    font-size: 14px;
    padding-left: 20px;
    height: 40px;


    color: var(--s-color-on-surface-variant);
    display: flex;
    // 竖向排列
    flex-direction: column;
}

.card {
    position: relative;
    flex: 0 0 auto;
    width: 200px;
    height: 300px;
    margin: 10px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    background-color: var(--s-color-surface);
    border-radius: 8px;
    box-shadow: var(--s-elevation-1);

    // cursor: pointer;

    transition: transform 0.2s ease, box-shadow 0.2s ease;

    & .card-hover {
        display: none;
    }

    &.focus {
        // outline: 20px solid var(--s-color-primary);
        border: 2px solid var(--s-color-primary);
        transform: scale(1.05);
        animation: gradientBorderAnimation 3s infinite alternate;

        & .card-hover {
            position: absolute;
            top: calc(100% + 20px);
            width: 200px;

            display: flex;
            z-index: 10;

            animation: fadeInFromBottomFlash 0.25s ease-in-out;
        }
    }

}

.card-list-icon-button {
    position: absolute;
    top: 46%;
    height: 8%;
    width: 8%;

    &.left {
        left: 10px;
    }

    &.right {
        right: 10px;
    }

    &:hover {
        color: var(--s-color-on-surface);
    }

    &:active {
        color: var(--s-color-primary);
    }
}

.card-list-indicator {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translate(-50%, -50%) rotate(180deg);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: bounce-padding 0.7s infinite ease-in-out;

    svg {
        width: 20px;
        height: 20px;
    }
}

@keyframes bounce-padding {

    0%,
    100% {
        padding-top: 10px;
        padding-bottom: 0;
    }

    50% {
        padding-top: 0px;
        padding-bottom: 10px;
    }
}
</style>