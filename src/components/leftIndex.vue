<!-- *
* @ Author: GitHub Copilot
* @ Description: 左侧多层级索引菜单，支持展开/折叠子目录

* @ Input: v-model: string 当前选中项的路径，如 "B/1"
*         structure: Object 多层级目录结构
*         translatedStructure: Object 多层级目录结构的翻译
* @ Output: update:modelValue: string 当选中项发生变化时触发

* @ function: selectPath: (path: string) => void 选中指定路径
*           toggleFolder: (path: string) => void 切换文件夹展开/折叠状态

* @ Slot: up-button: 用于自定义上方按钮
*        down-button: 用于自定义下方按钮
* -->

<template>
    <div class="left-index OO-box">
        <div class="OO-button-box" id="up-button">
            <slot name="up-button">
                <s-icon type="arrow_drop_up"></s-icon>
            </slot>
        </div>

        <div class="index-content">
            <div class="menu-items">
                <div v-for="(item, key) in structure" :key="key" class="menu-item"
                    :class="{ active: isPathActive(key), childrenActive: isPathChildrenActive(key) }" :data-path="key">
                    <div class="item-content" @click="handleItemClick(key, item)">
                        <span v-if="typeof item === 'object' && Object.keys(item).length > 0" class="toggle-icon"
                            @click.stop="toggleFolder(key)">
                            <s-icon :name="expandedFolders.has(key) ? 'arrow_drop_down' : 'arrow_drop_right'"></s-icon>
                        </span>
                        <span v-else class="toggle-icon" style="visibility: hidden;">
                            <s-icon :name="'home'"></s-icon>
                        </span>
                        <span class="item-text">{{ key }}</span>
                        <s-ripple :attached="true"></s-ripple>
                    </div>

                    <!-- 子项 -->
                    <div v-if="typeof item === 'object' && expandedFolders.has(key)" class="sub-items">
                        <div v-for="(subItem, subKey) in item" :key="subKey" class="menu-item"
                            :class="{ active: isPathActive(`${key}/${subKey}`), childrenActive: isPathChildrenActive(`${key}/${subKey}`) }" :style="{ paddingLeft: '12px' }"
                            :data-path="`${key}/${subKey}`">
                            <div class="item-content" @click="handleItemClick(`${key}/${subKey}`, subItem)">
                                <span v-if="typeof subItem === 'object' && Object.keys(subItem).length > 0"
                                    class="toggle-icon" @click.stop="toggleFolder(`${key}/${subKey}`)">
                                    <s-icon
                                        :name="expandedFolders.has(`${key}/${subKey}`) ? 'arrow_drop_down' : 'arrow_drop_right'"></s-icon>
                                </span>
                                <span v-else class="toggle-icon" style="visibility: hidden;">
                                    <s-icon :name="'menu'"></s-icon>
                                </span>
                                <span class="item-text">
                                    {{ subKey }}
                                </span>
                                <s-ripple :attached="true"></s-ripple>
                            </div>

                            <!-- 递归渲染第三级 (可以根据需要扩展到更多级别) -->
                            <div v-if="typeof subItem === 'object' && expandedFolders.has(`${key}/${subKey}`)"
                                class="sub-items">
                                <div v-for="(_, grandKey) in subItem" :key="grandKey" class="menu-item"
                                    :class="{ active: isPathActive(`${key}/${subKey}/${grandKey}`), childrenActive: isPathChildrenActive(`${key}/${subKey}/${grandKey}`) }"
                                    :style="{ paddingLeft: '24px' }" :data-path="`${key}/${subKey}/${grandKey}`">
                                    <div class="item-content" @click="selectPath(`${key}/${subKey}/${grandKey}`)">
                                        <span class="item-text">
                                            {{ grandKey }}
                                        </span>
                                        <s-ripple :attached="true"></s-ripple>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="slider" :style="sliderStyle" v-if="activeElement"></div>
        </div>

        <div class="placeholder"></div>

        <div class="OO-button-box" id="down-button">
            <slot name="down-button">
                <s-icon type="arrow_drop_down"></s-icon>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue';

// 主组件props
defineProps({
    structure: {
        type: Object,
        required: true
    },
});

const selectedPath = defineModel<string>('selectedPath', {
    type: String,
    default: ''
});

// 记录展开的文件夹状态
const expandedFolders = ref<Set<string>>(new Set<string>());

// 用于管理当前活动元素和滑块位置
const activeElement = ref<Element | null>(null);
const sliderStyle = reactive({
    top: '0px',
    height: '0px',
    // width: '0px',
    left: '0px',
    right: '0px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'var(--s-color-primary)'
});

// 检查路径是否处于活动状态
const isPathActive = (path: string): boolean => {
    return selectedPath.value === path ||
        (!!selectedPath.value && selectedPath.value.startsWith(path + '/'));
};
// 检查路径的子路径是否处于活动状态
const isPathChildrenActive = (path: string): boolean => {
    return !!selectedPath.value && selectedPath.value.startsWith(path + '/');
};

// 处理项目点击
const handleItemClick = (path: string, item: any): void => {
    selectPath(path);

    // 如果是文件夹，则切换展开状态
    if (typeof item === 'object') {
        toggleFolder(path);
    }
};

// 更新滑块位置
const updateSlider = (): void => {
    if (!selectedPath.value) return;

    setTimeout(() => {
        // 先查找选中路径对应的元素
        let el = document.querySelector(`[data-path="${selectedPath.value}"]`);

        // 如果找不到元素（可能已被折叠），查找其父路径的元素
        if (!el) {
            const pathParts = selectedPath.value.split('/');
            while (pathParts.length > 1 && !el) {
                pathParts.pop(); // 移除最后一个部分
                const parentPath = pathParts.join('/');
                el = document.querySelector(`[data-path="${parentPath}"]`);
            }
        }

        if (el) {
            activeElement.value = el;
            const container = document.querySelector('.index-content');
            if (container) {
                const containerRect = container.getBoundingClientRect();
                const contentEl = el.querySelector('.item-content');
                const elementRect = contentEl ? contentEl.getBoundingClientRect() : el.getBoundingClientRect();

                sliderStyle.top = `${elementRect.top - containerRect.top + container.scrollTop}px`;
                sliderStyle.height = `${elementRect.height}px`;
                // sliderStyle.width = `${elementRect.width}px`;
                sliderStyle.left = `${elementRect.left - containerRect.left}px`;
                sliderStyle.right = `${containerRect.right - elementRect.right}px`;

                // 当路径被折叠时，添加特殊样式
                if (el.getAttribute('data-path') !== selectedPath.value) {
                    // 使滑块变为中空的高亮边框
                    sliderStyle.borderRadius = '12px';
                    sliderStyle.border = '2px solid var(--s-color-primary)';
                    sliderStyle.backgroundColor = 'transparent';
                } else {
                    // 恢复正常样式
                    sliderStyle.borderRadius = '10px';
                    sliderStyle.border = 'none';
                    sliderStyle.backgroundColor = 'var(--s-color-primary)';
                }

                // 滚动到可见区域
                if (elementRect.bottom > containerRect.bottom || elementRect.top < containerRect.top) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }
        }
    }, 50);
};

// 选择路径处理
const selectPath = (path: string): void => {
    selectedPath.value = path;
};

// 切换文件夹展开/折叠状态
const toggleFolder = (path: string): void => {
    const newExpandedFolders = new Set<string>(expandedFolders.value);
    if (newExpandedFolders.has(path)) {
        newExpandedFolders.delete(path);
    } else {
        newExpandedFolders.add(path);

        // 自动展开父文件夹
        const pathParts = path.split('/');
        for (let i = 1; i < pathParts.length; i++) {
            const parentPath = pathParts.slice(0, i).join('/');
            if (parentPath) {
                newExpandedFolders.add(parentPath);
            }
        }
    }
    expandedFolders.value = newExpandedFolders;
    updateSlider();
};

// 监听选中路径变化，自动展开父文件夹
watch(() => selectedPath.value, (newPath) => {
    if (newPath) {
        const pathParts = newPath.split('/');
        // 如果不是顶层路径，自动展开父路径
        if (pathParts.length > 1) {
            const newExpandedFolders = new Set<string>(expandedFolders.value);
            for (let i = 1; i < pathParts.length; i++) {
                const parentPath = pathParts.slice(0, i).join('/');
                if (parentPath) {
                    newExpandedFolders.add(parentPath);
                }
            }
            expandedFolders.value = newExpandedFolders;
        }
        updateSlider();
    }
}, { immediate: true });

onMounted(() => {
    updateSlider();
});
</script>

<style scoped lang="scss">
.left-index {
    display: flex;
    flex-direction: column;
    position: relative;
    width: 200px;
    min-width: 100px;
    max-width: 200px;
    height: calc(100% - 20px);
}

.index-content {
    position: relative;
    overflow-y: auto;
    overflow-x: hidden;
    height: calc(100% - 64px);
    width: calc(100%);
    padding-right: 8px;
}

.menu-items {
    position: relative;
    z-index: 1;
}

.menu-item {
    position: relative;
    transition: background-color 0.3s;
    text-align: left;
    z-index: 1;
}

.item-content {
    display: flex;
    align-items: center;
    padding: 10px;
    cursor: pointer;
    position: relative;

    box-sizing: border-box;
}

.toggle-icon {
    // margin-right: 5px;
    display: flex;
    align-items: center;
    transition: transform 0.3s;
    cursor: pointer;
}

.item-text {
    flex: 1;
    font-weight: bolder;
    margin: 0;
    transition: color 0.3s;
}

.sub-items {
    position: relative;
    overflow: hidden;
    transition: max-height 0.3s ease;
}

.menu-item.active>.item-content {
    color: var(--s-color-on-primary);

    s-ripple {
        opacity: 1;
        color: var(--s-color-primary);
        transition: opacity 0.3s, color 0.5s;
    }
}

.menu-item.childrenActive>.item-content {
    color: var(--s-color-on-surface-variant);
    box-sizing: border-box;
}

.menu-item.childrenActive > .item-content::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background-color: transparent;
    border-bottom: 2px solid var(--s-color-primary);
    border-radius: 10px;
    z-index: 1;
}


.slider {
    position: absolute;
    transition: all 0.3s ease-in-out;
    will-change: height, top, width, background-color, border;
    z-index: 0;
}

s-ripple {
    border-radius: 10px;
}

.OO-button-box {
    position: relative;
    height: 32px;
    margin: 0;
    border-radius: 16px;
    width: calc(100% - 26px);
    display: flex;
    align-items: center;
    justify-content: center;
}

#up-button {
    left: -7px;
    top: -7px;
}

.placeholder {
    flex: 1;
}

#down-button {
    left: -7px;
    bottom: -7px;
}

// 滚动条 变细且右移动
.index-content::-webkit-scrollbar {

}

</style>
