<!-- *
* @ Author: XLXZ
* @ Description: 根据提供的目录，提供自动推荐功能

* @ Input: v-model: recommendList: 
*          v-model: inputValue: string 输入的内容
* -->

<template>
    <div class="auto-recommend OO-box">
        <s-scroll-view class="recommend-list OO-shade-box" style="height: 100%;" >
            <div v-for="(item, index) in recommendContent" :key="index" class="recommend-item">
                <li>
                    <span class="match-text" @click.native="item.callback ? item.callback(item) : null">
                        {{ item.content }}
                    </span>
                </li>
            </div>
        </s-scroll-view>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { type AutoRecommendItem } from '@/modules/mod-management';

const recommendList = defineModel<AutoRecommendItem[]>('recommendList', {
    type: Array as () => AutoRecommendItem[],
    default: () => []
});

const inputValue = defineModel<string>('inputValue', {
    type: String,
    default: ''
});

const props = defineProps({
    maxCommentLength: {
        type: Number,
        default: 10 // 默认最大长度为10
    }
});

const recommendContent = computed(() => {
    // 根据 inputValue 和 recommendList 生成推荐内容
    const result: AutoRecommendItem[] = [];
    let counter = 0; // 用于计数，限制推荐内容的数量

    for (const item of recommendList.value) {
        if (counter >= props.maxCommentLength) break;

        const ifMatch = () => {
            switch (item.type) {
                case 'matchPrefix':
                    // 前缀匹配
                    console.log('前缀匹配:', item.match, inputValue.value);
                    return inputValue.value.startsWith(item.match);
                case 'matchRegex':
                    // 正则表达式匹配
                    console.log('正则匹配:', item.match, inputValue.value);
                    const regex = new RegExp(item.match);
                    return regex.test(inputValue.value);
                case 'matchContent':
                    // 内容匹配，当输入内容为content开头时，推荐内容
                    console.log('内容匹配:', item.match, inputValue.value);
                    return item.content.startsWith(inputValue.value);
                default:
                    return false;
            }
        };

        if (ifMatch()) {
            result.push(item);
            counter++;
        }
    }

    return result;
});




</script>

<style scoped lang="scss">
  // Your SCSS styles here

.auto-recommend {
    position: relative;
    z-index: 1000;
    background-color: var(--background-color);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-height: 300px; /* 限制最大高度 */
    transition: all 0.3s ease;
}
</style>
