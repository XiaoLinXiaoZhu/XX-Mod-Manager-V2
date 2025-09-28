<!-- 任何临时测试都可以放到这里 -->
<template>
<s-text-field v-model="inputValue" placeholder="输入内容进行自动推荐" />
<AutoRecommend v-model:recommendList="recommendList" v-model:inputValue="inputValue" />
</template>

<script setup lang="ts">
import AutoRecommend from '@/shared/components/AutoRecommend.vue';
import { type AutoRecommendItem } from '@/modules/mod-management';
import { ref, watch } from 'vue';
const recommendList = ref<AutoRecommendItem[]>([
    {
        type: 'matchPrefix',
        match: 'abc',
        content: '推荐内容1',
        callback: (item) => {
            console.log('点击了推荐项:', item);
        }
    },
    {
        type: 'matchRegex',
        match: 'def',
        content: '推荐内容2',
        callback: (item) => {
            console.log('点击了推荐项:', item);
        }
    },
    {
        type: 'matchContent',
        match: '',
        content: '推荐内容3',
        callback: (item) => {
            console.log('点击了推荐项:', item);
        }
    },
    {
        type: 'matchContent',
        match: '',
        content: '推荐ABC内容4',
        callback: (item) => {
            console.log('点击了推荐项:', item);
        }
    }
]);

const inputValue = ref<string>('');
watch(inputValue, (newValue) => {
    console.log('输入内容变化:', newValue);
    // 这里可以添加逻辑，比如根据输入内容动态更新推荐列表
});

</script>
