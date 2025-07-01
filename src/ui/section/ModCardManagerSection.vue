<template>
    <div class="mod-card-manager-section">
        <LeftIndex class="OO-left-container OO-box" :structure="IndexStructure" v-model:selected-path="selectedPath" />
        <div class="OO-right-container OO-box">
            <p>Selected Path: {{ selectedPath }}</p>
            <TagSearch ref="tagSearchRef"></TagSearch>
            <s-scroll-view style="width: 100%;flex: 1 1 0;">
                <div class="mod-item-list" ref="modListRef">
                    <ModCard class="mod-item" v-for="(mod, index) in mods" :data-uid="mod.id.getRef()" :key="index"
                        :mod-info="mod.convertToUnreactive()" :display="true"
                        :class="{
                            'hidden': !isMatch(mod.convertToUnreactive()),
                        }"
                        @mouseenter="(event: Event) => handleModCardHover(mod, event)" @mouseleave="handleModCardLeave">
                    </ModCard>
                </div>
            </s-scroll-view>
            <!-- 悬浮窗口 -->
            <Transition name="tooltip-fade">
                <div v-if="hoveredMod" ref="tooltipRef" 
                     class="mod-tooltip" 
                     :class="{ 'animate-move': shouldAnimateMove }"
                     :style="tooltipStyle"
                     @mouseenter="handleTooltipHover" 
                     @mouseleave="handleTooltipLeave">
                    <div class="tooltip-content">
                        <h3>Mod 详细信息</h3>
                        <h3>{{ hoveredMod.name.getRef() }}</h3>
                        <p>描述: {{ hoveredMod.description.getRef() }}</p>
                        <p>热键: {{ hoveredMod.hotkeys.getRef().value.join(', ') }}</p>
                        <p>标签: {{ hoveredMod.tags.getRef().value.join(', ') }}</p>
                        <p>类型: {{ hoveredMod.category.getRef() }}</p>
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
import { ref, computed, nextTick } from 'vue';
import ModCard from '@/shared/components/modCard.vue';


const tagSearchRef = ref<InstanceType<typeof TagSearch> | null>(null);
const isMatch = (modInfo: UnreactiveModInfo): boolean => {
    return tagSearchRef.value?.matchesTags(modInfo) ?? false;
};

const IndexStructure = {
    "Character": {
        "Character1": {},
        "Character2": {},
        "Character3": {
            "SubCharacter1": {},
            "SubCharacter2": {},
            "SubCharacter3": {}
        }
    },
    "Environment": {
        "Environment1": {},
        "Environment2": {},
        "Environment3": {}
    },
    "Items": {
        "Item1": {},
        "Item2": {},
        "Item3": {}
    },
}
const selectedPath = ref<string>('');

const mods = ref<ModInfo[]>([] as ModInfo[]);

// 悬浮窗口相关状态
const hoveredMod = ref<ModInfo | null>(null);
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
    const tooltipPadding = 20; // 悬浮窗口与边界的间距

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

    // 如果当前有悬浮窗口，设置0.5秒后隐藏
    if (hoveredMod.value) {
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
    // 立即移除移动动画，确保离开动画正常工作
    shouldAnimateMove.value = false;
    // 设置0.5秒后隐藏
    hideTimer = setTimeout(() => {
        hoveredMod.value = null;
    }, HIDE_DELAY);
};

// 监听 ModLoader 的 mods 变化
ModLoader.onAfterLoad(() => {
    console.log('Mods loaded successfully:', mods.value);
    mods.value = ModLoader.mods;
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