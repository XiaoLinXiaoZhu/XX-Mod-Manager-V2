<template>
    <DialogTemplate v-model:visible="ifShow" :id="'dialog-route-list'" :close-on-click-mask="true">
        <template #header>
            <h3>导航至 -></h3>
        </template>
        <template #default>
            <s-scroll-view id="dialog-scroll-view" class="OO-scroll-view">
                <RouteList />
            </s-scroll-view>
        </template>
        <template #footer>
            <s-button class="OO-button font-hongmeng" @click="ifShow = false">关闭</s-button>
            <s-button class="OO-button OO-color-gradient font-hongmeng" @click="ifShow = false">确认</s-button>
        </template>
    </DialogTemplate>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import RouteList from '@/pages/RouteList.vue';
import DialogTemplate from './dialogTemplate.vue';
const ifShow = ref(false);

// 热键绑定 ctrl + p
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        ifShow.value = !ifShow.value;
    }
});

// 页面切换（路由变化）时关闭对话框
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
onMounted(() => {
    router.afterEach(() => {
        ifShow.value = false;
    });
});
</script>

<style lang="scss" scoped>
#dialog-scroll-view {
    height: 400px;
    overflow-y: auto;
    overflow-x: hidden;
}
</style>