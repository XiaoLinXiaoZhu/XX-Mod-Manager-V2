<template>
    <!-- {{ ifAutoRecommendShow }} -->
    <AutoRecommend class="tag-search-autocomplete" 
    v-show="ifAutoRecommendShow > 0" 
    v-model:recommend-list="recommendList" 
    v-model:input-value="inputValue" 
    :max-comment-length="100" 
    @mouseenter="ifAutoRecommendShow += 1"
    @mouseleave="ifAutoRecommendShow -= 1"
    />
    <div class="tag-chip-list">
        <s-text-field class="tag-search-input" v-model="inputValue" label="搜索标签" @change="addTag" @focus="ifAutoRecommendShow = 1" @blur="ifAutoRecommendShow -= 1" />

        <s-chip class="tag-chip" :class="{ 'tag-disabled': tag.disabled }" type="filled"
            v-for="(tag, index) in searchTags" :key="tag.raw" @click="toggleTag(index)">
            <!-- 不同的标签类型，显示不同的图标 -->
            <s-tooltip slot="start" class="tag-tooltip">
                <s-icon v-html="tagTypeSvg[tag.type]" slot="trigger"></s-icon>
                {{ tag.disabled ? '已禁用 - ' + tag.type : tag.type }}
            </s-tooltip>
            <p>{{ tag.value }}</p>
            <s-icon-button slot="action" @click="searchTags.splice(index, 1)"
                style="display: flex; align-items: center; justify-content: center;margin: 0 -12px 0 2px;">
                <s-icon name="close"></s-icon>
            </s-icon-button>
        </s-chip>
    </div>
</template>

<script setup lang="ts">
// 提供一个搜索输入框，允许用户输入标签进行搜索
// 窗口将多个标签动态渲染为多个标签按钮
// 暴露一个函数 用于外部判断 是否符合搜索条件

import { UnreactiveModInfo } from '@/features/mod-manager/ModInfo';
import { computed, ref } from 'vue';
import { SearchTag, TagType } from '@/shared/types/search-tag';
import { ModLoader } from '@/features/mod-manager/ModLoader';
import { AutoRecommendItem } from '../types/auto-recommend';
import AutoRecommend from './AutoRecommend.vue';


const searchTags = defineModel<SearchTag[]>('searchTags', {
    type: Array as () => SearchTag[],
    default: () => []
});
const inputValue = ref('');

// 触发搜索的标签类型的关键词，比如 $c abc 指的是分类为abc的标签
const tagTypeMarkers: Record<TagType, string> = {
    category: '$c',
    tags: '#',
    description: '$d',
    location: '$l',
    hotkeys: '$h',
    name: '',
};
const tagTypeSvg: Record<TagType, string> = {
    category: `<svg viewBox="0 -960 960 960">
  <path d="m260-520 220-360 220 360H260ZM700-80q-75 0-127.5-52.5T520-260q0-75 52.5-127.5T700-440q75 0 127.5 52.5T880-260q0 75-52.5 127.5T700-80Zm-580-20v-320h320v320H120Zm580-60q42 0 71-29t29-71q0-42-29-71t-71-29q-42 0-71 29t-29 71q0 42 29 71t71 29Zm-500-20h160v-160H200v160Zm202-420h156l-78-126-78 126Zm78 0ZM360-340Zm340 80Z"></path>
</svg>`,
    tags: `<svg viewBox="0 -960 960 960">
  <path d="m240-160 40-160H120l20-80h160l40-160H180l20-80h160l40-160h80l-40 160h160l40-160h80l-40 160h160l-20 80H660l-40 160h160l-20 80H600l-40 160h-80l40-160H360l-40 160h-80Zm140-240h160l40-160H420l-40 160Z"></path>
</svg>`,
    description: `<svg viewBox="0 -960 960 960">
  <path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"></path>
</svg>`,
    location: `<svg viewBox="0 -960 960 960">
  <path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"></path>
</svg>`,
    hotkeys: `<svg viewBox="0 -960 960 960">
  <path d="M160-200q-33 0-56.5-23.5T80-280v-400q0-33 23.5-56.5T160-760h640q33 0 56.5 23.5T880-680v400q0 33-23.5 56.5T800-200H160Zm0-80h640v-400H160v400Zm160-40h320v-80H320v80ZM200-440h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM200-560h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80Zm120 0h80v-80h-80v80ZM160-280v-400 400Z"></path>
</svg>`,
    name: `<svg viewBox="0 -960 960 960">
  <path d="M560-440h200v-80H560v80Zm0-120h200v-80H560v80ZM200-320h320v-22q0-45-44-71.5T360-440q-72 0-116 26.5T200-342v22Zm160-160q33 0 56.5-23.5T440-560q0-33-23.5-56.5T360-640q-33 0-56.5 23.5T280-560q0 33 23.5 56.5T360-480ZM160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h640q33 0 56.5 23.5T880-720v480q0 33-23.5 56.5T800-160H160Zm0-80h640v-480H160v480Zm0 0v-480 480Z"></path>
</svg>`
}
const parseTag = (tagInput: string): SearchTag => {
    // 根据标签的前缀返回对应的标签类型
    const detectType = (): TagType => {
        if (tagInput.startsWith(tagTypeMarkers.category)) return 'category';
        if (tagInput.startsWith(tagTypeMarkers.tags)) return 'tags';
        if (tagInput.startsWith(tagTypeMarkers.description)) return 'description';
        if (tagInput.startsWith(tagTypeMarkers.location)) return 'location';
        if (tagInput.startsWith(tagTypeMarkers.hotkeys)) return 'hotkeys';
        return 'name'; // 默认返回 name
    }

    const type = detectType();
    const value = tagInput.replace(tagTypeMarkers[type], '').trim();

    return {
        type,
        value,
        disabled: false,
        raw: tagInput
    }
};

const addTag = () => {
    // 将输入的内容添加到搜索标签中
    if (inputValue.value && !searchTags.value.some(tag => tag.raw === inputValue.value)) {
        searchTags.value.push(parseTag(inputValue.value));
    }
    // 清空搜索
    inputValue.value = '';
};

// 切换标签的禁用状态
const toggleTag = (index: number) => {
    searchTags.value[index].disabled = !searchTags.value[index].disabled;
};

const matchesTags = (modInfo: UnreactiveModInfo): boolean => {
    // 如果没有搜索标签，匹配所有mod
    if (searchTags.value.length === 0) {
        return true;
    }

    // 获取所有启用的标签
    const activeTags = searchTags.value.filter(tag => !tag.disabled);

    // 如果所有标签都被禁用，匹配所有mod
    if (activeTags.length === 0) {
        return true;
    }

    // 检查每个启用的标签是否匹配
    return activeTags.every(tag => {
        switch (tag.type) {
            case 'category':
                // 精确匹配分类路径：完全相等或是子分类
                const categoryPath = modInfo.category || '';
                return categoryPath === tag.value || categoryPath.startsWith(tag.value + '/');

            case 'tags':
                return modInfo.tags.includes(tag.value);

            case 'name':
                return modInfo.name.includes(tag.value);

            case 'description':
                return modInfo.description.includes(tag.value);

            case 'location':
                return modInfo.location.includes(tag.value);

            case 'hotkeys':
                return modInfo.hotkeys.some(hotkey =>
                    hotkey.key.includes(tag.value) || hotkey.description.includes(tag.value)
                );

            default:
                return false;
        }
    });
};

const recommendList = computed(() => {
    // 根据ModList 的标签和分类生成推荐列表

    // 1. hints
    // 提示各种功能
    const hints: AutoRecommendItem[] = [
        {
            type: "matchRegex",
            match: `^$`,
            content: `输入 ${tagTypeMarkers.category}分类名 来搜索分类`,
            callback: (_item: AutoRecommendItem) => {
                inputValue.value = tagTypeMarkers.category;
            }
        },
        {
            type: "matchRegex",
            match: `^$`,
            content: `输入 ${tagTypeMarkers.tags}标签名 来搜索标签`,
            callback: (_item: AutoRecommendItem) => {
                inputValue.value = tagTypeMarkers.tags;
            }
        },
        {
            type: "matchRegex",
            match: `^$`,
            content: `输入 ${tagTypeMarkers.description}描述 来搜索描述`,
            callback: (_item: AutoRecommendItem) => {
                inputValue.value = tagTypeMarkers.description;
            }
        },
        {
            type: "matchRegex",
            match: `^$`,
            content: `输入 ${tagTypeMarkers.location}位置 来搜索位置`,
            callback: (_item: AutoRecommendItem) => {
                inputValue.value = tagTypeMarkers.location;
            }
        },
        {
            type: "matchRegex",
            match: `^$`,
            content: `输入 ${tagTypeMarkers.hotkeys}热键 来搜索热键`,
            callback: (_item: AutoRecommendItem) => {
                inputValue.value = tagTypeMarkers.hotkeys;
            }
        }
    ];
    // 2. tags
    const tags: AutoRecommendItem[] = Object.keys(ModLoader.allTags.value).map((tag: string) => ({
        type: "matchContent",
        match: ``,
        content: `${tagTypeMarkers.tags}${tag}`,
        callback: (item: AutoRecommendItem) => {
            searchTags.value.push(parseTag(item.content));
            //清空输入框
            inputValue.value = '';
        }
    }));

    // 3. categories
    const categories: AutoRecommendItem[] = ModLoader.mods.map(mod => {
        const category = mod.category.getRef().value;
        if (category) {
            return {
                type: "matchContent",
                match: ``,
                content: `${tagTypeMarkers.category}${category}`,
                callback: (item: AutoRecommendItem) => {
                    searchTags.value.push(parseTag(item.content));
                    //清空输入框
                    inputValue.value = '';
                }
            };
        }
        return null;
    }).filter(item => item !== null) as AutoRecommendItem[];


    const result: AutoRecommendItem[] = [
        ...hints,
        ...tags,
        ...categories
    ]
    console.log('推荐列表:', result);
    return result;
});

const ifAutoRecommendShow = ref(0);

// 导出函数供外部使用
defineExpose({
    matchesTags,
    searchTags,
    recommendList,
    toggleTag
});

</script>

<style scoped lang="scss">
.tag-search-autocomplete{
    position: relative;
    border-radius: 10px;
    max-height: 20vh;
}

.tag-chip-list {
    display: flex;
    flex-wrap: wrap;

    gap: 8px;
}

.tag-chip {
    height: 36px;
    transition: opacity 0.2s ease;
}

.tag-disabled {
    opacity: 0.5;
    filter: grayscale(50%);
}

.tag-disabled:hover {
    opacity: 0.7;
}

.tag-search-input {
    transform: skew(-20deg);
    border-radius: 10px;
    --text-field-border-radius: 10px;
    --text-field-padding: 10px;
    --border-radius: 10px;
    transform: skew(-20deg);
    left: 5px;
    margin-right: 5px;
    position: relative;
    height: 36px;
    min-height: 36px;
    padding: 0;
    align-items: center;
}

.tag-tooltip {
    margin: 0 4px 0 -10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    ::after {
        // 显示一个斜的竖线作为分隔符
        content: '';
        width: 1px;
        height: 16px;
        background: var(--s-color-on-surface-variant);
        margin: 0 2px;
        transform: skew(-20deg);
    }
}
</style>