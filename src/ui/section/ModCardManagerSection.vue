<template>
    <div class="mod-card-manager-section">
        <LeftIndex class="OO-left-container OO-box" :structure="IndexStructure" :displayStructure="translatedIndexStructure" v-model:selected-path="selectedPath" />
        <div class="OO-right-container OO-box">
            <!-- {{ selectedPath }} -->
            
            <TagSearch ref="tagSearchRef" v-model:search-tags="searchTags" style="position: relative; left: 10px;" />
            <s-scroll-view style="width: 100%;flex: 1 1 0;">
                <div class="mod-item-list" ref="modListRef">
                    <ModCard class="mod-item" v-for="(mod, index) in mods" :data-uid="mod.metadata.id" :key="index"
                        :mod-info="mod.getSelf()" :display="true" v-model:clicked="ifModSelected[index]"
                        :class="{
                            'hidden': !isMatch(mod.metadata as ModMetadata),
                        }">
                    </ModCard>
                </div>
            </s-scroll-view>
        </div>
    </div>
</template>
<script setup lang="ts">
import LeftIndex from '@/shared/components/leftIndex.vue';
import TagSearch from '@/shared/components/TagSearch.vue';

import { ModLoader, ModInfo, ModMetadata } from '@/compat/legacy-bridge';
import { ref, computed, nextTick, watch } from 'vue';
import ModCard from '@/shared/components/modCard.vue';
import { SearchTag } from '@/shared/types/search-tag';
import { currentLanguageRef } from '@/compat/legacy-bridge';

const tagSearchRef = ref<InstanceType<typeof TagSearch> | null>(null);
const searchTags = ref<SearchTag[]>([] as SearchTag[]);
const isMatch = (modMetadata: ModMetadata): boolean => {
    return tagSearchRef.value?.matchesTags(modMetadata) ?? false;
};


const IndexStructure = computed(() => {
    return {
        "all": "",
        ...ModLoader.categoryIndexStructure.value,
        "tag": ModLoader.allTags.value
    }
});

let translatedIndexStructure = {};
const updateTranslatedIndexStructure = () => {
    return {
        "all": "全部",
        "tag": "标签",
    }
};
watch(currentLanguageRef, () => {
    translatedIndexStructure = updateTranslatedIndexStructure();
    console.log("当前语言变更，更新左侧菜单结构:", translatedIndexStructure);
});



const selectedPath = ref<string>('');
watch(selectedPath, (newValue, oldValue) => {
    // 当选中的路径变化时，更新 searchTags
    if (newValue) {
        // 如果选中的是 "all"，则清空 searchTags
        if (newValue === 'all') {
            searchTags.value.forEach(tag => {
                tag.disabled = true; // 恢复所有标签的可用状态
            });
            return;
        }

        // 如果选中的 newvalue 为 tag/XXX , 则增加一个tag
        if (newValue.startsWith('tag/')) {
            const tagName = newValue.replace('tag/', '');
            // 检查是否已经存在该标签
            const existingTag = searchTags.value.find(tag => tag.type === 'tags' && tag.value === tagName);
            if (!existingTag) {
                searchTags.value.push({
                    type: 'tags',
                    value: tagName,
                    disabled: false,
                    raw: `#${tagName}` // 原始输入字符串
                });
            } else {
                existingTag.disabled = false; // 恢复标签的可用状态
            }
            return;
        }

        if (newValue.startsWith('tag')) {
            return;
        }

        // 3. category 
        // 从searchTags中找到对应的标签 (type = 'category' 且 value 与 oldValue 相同)
        const categoryTag = searchTags.value.find(tag => tag.type === 'category' && tag.value === oldValue);
        if (categoryTag) {
            // 更新标签的值
            categoryTag.value = newValue;
        } else {
            // 如果没有找到，则添加新的标签
            const existingTag = searchTags.value.find(tag => tag.type === 'category' && tag.value === newValue);
            if (!existingTag) {
                searchTags.value.push({
                    type: 'category',
                    value: newValue,
                    disabled: false,
                    raw: `#${newValue}` // 原始输入字符串
                });
            } else {
                existingTag.disabled = false; // 恢复标签的可用状态
            }
        }
    }

});

const mods = ref<ModInfo[]>([] as ModInfo[]);
const ifModSelected = ref<boolean[]>([] as boolean[]);

// 监听 ModLoader 的 mods 变化
ModLoader.onAfterLoad(() => {
    console.log('Mods loaded successfully:', mods.value);
    mods.value = ModLoader.mods;
    // IndexStructure = ModLoader.categoryIndexStructure.value;
});

defineExpose({
    ifModSelected
});
</script>

<style scoped lang="scss">
.mod-card-manager-section {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    flex: 0 0 auto;
    place-content: center;
}
</style>

<style lang="scss">
.OO-left-container {
    position: relative;
    width: 20vw;
    min-width: 150px;
    max-width: 300px;
    height: 100%;
    padding: 10px;
    margin: 0px 10px;


    display: flex;
    flex-direction: column;
    box-sizing: border-box;
}

.OO-right-container {
    position: relative;
    flex: 1 1 0;
    min-width: 0;
    height: 100%;
    margin: 0px 10px 0 0;

    overflow-y: auto;
    padding: 10px;
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    gap: 10px;
    box-sizing: border-box;
}

.mod-item-list {
    flex: 1 1 1;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    box-sizing: border-box;
    padding-top: 10px;

    .mod-item {
        &.hidden {
            display: none;
        }
    }
}

</style>
