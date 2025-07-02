<template>
    <div class="mod-card-manager-section">
        <LeftIndex class="OO-left-container OO-box" :structure="IndexStructure" :displayStructure="translatedIndexStructure" v-model:selected-path="selectedPath" />
        <div class="OO-right-container OO-box">
            <!-- {{ selectedPath }} -->
            
            <TagSearch ref="tagSearchRef" v-model:search-tags="searchTags" style="position: relative; left: 10px;" />
            <s-scroll-view style="width: 100%;flex: 1 1 0;">
                <div class="mod-item-list" ref="modListRef">
                    <ModCard class="mod-item" v-for="(mod, index) in mods" :data-uid="mod.id.getRef()" :key="index"
                        :mod-info="mod.convertToUnreactive()" :display="true" v-model:clicked="ifModSelected[index]"
                        :class="{
                            'hidden': !isMatch(mod.convertToUnreactive()),
                        }" @mouseenter="(event: Event) => handleModCardHover(mod, event)"
                        @mouseleave="handleModCardLeave">
                    </ModCard>
                </div>
            </s-scroll-view>
            <!-- 悬浮窗口 -->
            <Transition name="tooltip-fade">
                <div v-if="hoveredMod" ref="tooltipRef" class="mod-tooltip"
                    :class="{ 'animate-move': shouldAnimateMove, 'pinned': isPinned }" :style="tooltipStyle"
                    @mouseenter="handleTooltipHover" @mouseleave="handleTooltipLeave">
                    <div class="tooltip-header">
                        <h3>Mod 详细信息</h3>
                        <button 
                            class="pin-button" 
                            :class="{ 'pinned': isPinned }"
                            @click="togglePin"
                            :title="isPinned ? '取消固定' : '固定窗口'"
                        >
                            📌
                        </button>
                    </div>
                    <div class="tooltip-content">
                        <h3>{{ hoveredMod.name.getRef() }}</h3>
                        <p>描述: {{ hoveredMod.description.getRef() }}</p>
                        <p>热键: {{ hoveredMod.hotkeys.getRef().value.join(', ') }}</p>
                        <p>标签: {{ hoveredMod.tags.getRef().value.join(', ') }}</p>
                        <s-text-field v-model="tempTagInput" label="标签"/>
                        <s-text-field v-model="hoveredMod.category.value" label="类型"/>
                        <p>位置: {{ hoveredMod.location.getRef() }}</p>
                        <p>Uid: {{ hoveredMod.id.getRef() }}</p>
                        <!-- 这里可以添加更多详细信息 -->
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>
<script setup lang="ts">
import LeftIndex from '@/shared/components/leftIndex.vue';
import TagSearch from '@/shared/components/TagSearch.vue';

import { ModLoader } from '@/features/mod-manager/ModLoader';
import { ModInfo, UnreactiveModInfo } from '@/features/mod-manager/ModInfo';
import { ref, computed, nextTick, watch } from 'vue';
import ModCard from '@/shared/components/modCard.vue';
import { SearchTag } from '@/shared/types/search-tag';
import { currentLanguageRef } from '@/shared/composables/localHelper';

const tagSearchRef = ref<InstanceType<typeof TagSearch> | null>(null);
const searchTags = ref<SearchTag[]>([] as SearchTag[]);
const isMatch = (modInfo: UnreactiveModInfo): boolean => {
    return tagSearchRef.value?.matchesTags(modInfo) ?? false;
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
currentLanguageRef.watch(() => {
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

// 悬浮窗口相关状态
const hoveredMod = ref<ModInfo | null>(null);
const tempTagInput = ref<string>(''); // 用于临时输入标签
const isPinned = ref<boolean>(false); // 固定状态
watch(hoveredMod, (newValue,oldValue) => {
    if (newValue) {
        // 当 hoveredMod 变化时，保存标签，之后设置为新的
        if (oldValue) {
            // 如果之前有 hoveredMod，清空之前的输入
            oldValue.tags.set(tempTagInput.value.split(/[,，]/).map(tag => tag.trim()));
        }
        tempTagInput.value = newValue.tags.getRef().value.join(', ');
    } else {
        // 如果没有悬浮的 mod，清空输入
        tempTagInput.value = '';
    }
});


const tooltipRef = ref<HTMLElement | null>(null);
const modListRef = ref<HTMLElement | null>(null);
const tooltipPosition = ref({ x: 0, y: 0, side: 'right' as 'left' | 'right' });
const currentHoveredElement = ref<HTMLElement | null>(null);
const shouldAnimateMove = ref(false); // 控制是否显示移动动画

// 定时器
let hoverTimer: NodeJS.Timeout | null = null;
let hideTimer: NodeJS.Timeout | null = null;

// 配置常量
const HOVER_DELAY = 500; // 悬浮显示延迟时间（毫秒）
const HIDE_DELAY = 200;   // 隐藏延迟时间（毫秒）

// 悬浮窗口样式
const tooltipStyle = computed(() => ({
    position: 'fixed' as const,
    left: `${tooltipPosition.value.x}px`,
    top: `${tooltipPosition.value.y}px`,
    zIndex: 1000,
}));

// 计算悬浮窗口位置
const calculateTooltipPosition = (targetElement: HTMLElement) => {
    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 300; // 预估悬浮窗口宽度
    const tooltipHeight = 200; // 预估悬浮窗口高度
    const tooltipPadding = 10; // 悬浮窗口与边界的间距

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = 0;
    let y = rect.top;
    let side: 'left' | 'right' = 'right';

    // 判断显示在左侧还是右侧
    if (rect.right + tooltipWidth + tooltipPadding <= viewportWidth) {
        // 右侧有足够空间
        x = rect.right + tooltipPadding;
        side = 'right';
    } else if (rect.left - tooltipWidth - tooltipPadding >= 0) {
        // 左侧有足够空间
        x = rect.left - tooltipWidth - tooltipPadding;
        side = 'left';
    } else {
        // 两侧都没有足够空间，选择较宽的一侧
        const rightSpace = viewportWidth - rect.right;
        const leftSpace = rect.left;
        if (rightSpace >= leftSpace) {
            x = rect.right + tooltipPadding;
            side = 'right';
        } else {
            x = Math.max(tooltipPadding, rect.left - tooltipWidth - tooltipPadding);
            side = 'left';
        }
    }

    // 调整垂直位置，确保不溢出屏幕
    if (y + tooltipHeight > viewportHeight) {
        y = Math.max(tooltipPadding, viewportHeight - tooltipHeight - tooltipPadding);
    }
    if (y < tooltipPadding) {
        y = tooltipPadding;
    }

    return { x, y, side };
};

// 处理 mod 卡片悬浮
const handleModCardHover = (mod: any, event: Event) => {
    const targetElement = event.currentTarget as HTMLElement;
    currentHoveredElement.value = targetElement;

    // 清除隐藏定时器
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    // 如果已经有悬浮的 mod，直接更新
    if (hoveredMod.value) {
        shouldAnimateMove.value = true; // 切换卡片时启用移动动画
        hoveredMod.value = mod;
        nextTick(() => {
            tooltipPosition.value = calculateTooltipPosition(targetElement);
        });
        return;
    }

    // 清除之前的悬浮定时器
    if (hoverTimer) {
        clearTimeout(hoverTimer);
    }

    // 设置1秒后显示悬浮窗口
    hoverTimer = setTimeout(() => {
        // 只有当前悬浮的元素还是同一个时才显示悬浮窗口
        if (currentHoveredElement.value === targetElement) {
            shouldAnimateMove.value = false; // 首次显示时不启用移动动画
            hoveredMod.value = mod;
            nextTick(() => {
                tooltipPosition.value = calculateTooltipPosition(targetElement);
            });
        }
    }, HOVER_DELAY);
};

// 处理 mod 卡片离开
const handleModCardLeave = () => {
    currentHoveredElement.value = null;

    // 清除悬浮定时器
    if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
    }

    // 如果当前有悬浮窗口且没有固定，设置延迟后隐藏
    if (hoveredMod.value && !isPinned.value) {
        // 立即移除移动动画，确保离开动画正常工作
        shouldAnimateMove.value = false;
        hideTimer = setTimeout(() => {
            hoveredMod.value = null;
        }, HIDE_DELAY);
    }
};

// 处理悬浮窗口悬浮
const handleTooltipHover = () => {
    // 清除隐藏定时器
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
};

// 处理悬浮窗口离开
const handleTooltipLeave = () => {
    // 如果已固定，则不隐藏
    if (isPinned.value) {
        return;
    }
    
    // 立即移除移动动画，确保离开动画正常工作
    shouldAnimateMove.value = false;
    // 设置延迟后隐藏
    hideTimer = setTimeout(() => {
        hoveredMod.value = null;
    }, HIDE_DELAY);
};

// 切换固定状态
const togglePin = () => {
    isPinned.value = !isPinned.value;
    
    // 如果取消固定且当前没有悬浮在卡片上，则隐藏悬浮窗口
    if (!isPinned.value && !currentHoveredElement.value) {
        hideTimer = setTimeout(() => {
            hoveredMod.value = null;
        }, HIDE_DELAY);
    }
    
    // 如果固定了，清除所有隐藏定时器
    if (isPinned.value && hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
};

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

/* 悬浮窗口样式 */
.mod-tooltip {
    position: fixed;
    background: rgba(30, 30, 30, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 16px;
    max-width: 300px;
    min-width: 250px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(10px);
    color: white;
    font-size: 14px;
    z-index: 1000;
    pointer-events: auto;

    &.pinned {
        border-color: rgba(255, 215, 0, 0.5);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.1);
    }
}

/* 悬浮窗口头部 */
.tooltip-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
    }
}

/* 固定按钮样式 */
.pin-button {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
    font-size: 12px;
    transition: all 0.2s ease;

    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        color: rgba(255, 255, 255, 0.9);
        transform: scale(1.05);
    }

    &.pinned {
        background: rgba(255, 215, 0, 0.2);
        border-color: rgba(255, 215, 0, 0.4);
        color: #ffd700;
        
        &:hover {
            background: rgba(255, 215, 0, 0.3);
            border-color: rgba(255, 215, 0, 0.5);
        }
    }
}

/* 移动动画 - 仅在切换卡片时启用 */
.mod-tooltip.animate-move {
    transition: left 0.23s ease-out, top 0.3s ease-out;
}

/* 悬浮窗口过渡动画 */
.tooltip-fade-enter-active {
    transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tooltip-fade-leave-active {
    transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);
}

.tooltip-fade-enter-from {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
}

.tooltip-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px) scale(0.9);
}

.tooltip-fade-enter-to {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.tooltip-content {
    h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 8px;
    }

    p {
        margin: 8px 0;
        line-height: 1.4;
        color: rgba(255, 255, 255, 0.9);
    }
}
</style>