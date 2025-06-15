<template>
    <div class="slider-container ">
        <div class="slider OO-color-gradient OO-bump" :style="sliderStyle" ref="sliderRef"></div>
        <div class="section-selector">
            <div v-for="(sec, index) in sections" :key="index" class="section-item"
                :class="{ active: index == currentIndex }" @mousedown="setCurrentSection(index)" ref="sectionRefs">
                <p> {{ sec }} </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
const props = defineProps({
    sections: {
        type: Array as () => string[],
        default: () => [],
        required: true,
        validator: (value: unknown) => {
            if (!Array.isArray(value)) return false;
            return value.every(sec => typeof sec === 'string');
        }
    }
});

// v-model binding
const currentSection = defineModel("currentSection", {
    type: String,
    required: false
});
const currentIndex = defineModel("index", {
    default: 0,
    required: false
});

const setCurrentSection = (idx: number) => {
    if (props.sections.length <= 0) {
        currentIndex.value = 0;
        currentSection.value = '';
        console.warn('No sections available, resetting currentIndex to 0');
    }
    else if (currentIndex.value === idx) {
        currentSection.value = props.sections[idx] || '';
    } else {
        currentIndex.value = idx % props.sections.length;
        currentSection.value = props.sections[currentIndex.value];
    }
};
watch(currentIndex, (newIndex) => {
    setCurrentSection(newIndex);
});

//-================= slider =========================
const sectionRefs = ref<HTMLElement[]>([]);
const sliderRef = ref();
const sliderStyle = ref<Record<string, string>>({});
const sliderPadding = 10; // Padding for the slider
const updateSliderStyle = () => {
    const el = sectionRefs.value[currentIndex.value];
    if (!el) {
        console.warn('No section element found for currentIndex:', currentIndex.value);
        return {};
    }
    let sliderWidth = el.offsetWidth + (sliderPadding * 2);
    let sliderLeft = el.offsetLeft - sliderPadding;

    // 微调宽度使得 滑块超出 边缘
    // 这样可以使得 裁切边缘完整
    const padding = 10; // Padding for the slider
    if (currentIndex.value == 0) {
        sliderWidth += padding;
        sliderLeft -= padding;
    }
    else if (currentIndex.value == props.sections.length - 1) {
        sliderWidth += padding;
        sliderLeft += padding;
    }

    sliderStyle.value = {
        width: `${sliderWidth}px`,
        transform: `translateX(${sliderLeft}px) skew(-20deg)`,
    };
};

watch(() => currentIndex.value, () => {
    updateSliderStyle();
});

watch(() => props.sections, (newSection) => {
    if (newSection.length <= 0 || currentIndex.value >= newSection.length) {
        setCurrentSection(0);
    } else {
        // 如果不超出范围，则更新仍然使用当前索引，但是需要刷新滑块样式
        updateSliderStyle();
    }
});

onMounted(() => {
    console.log('SectionSelector mounted with sections:', sectionRefs.value, sectionRefs.value.length, props.sections);
    if (props.sections.length > 0) {
        if (!currentIndex.value || currentIndex.value >= props.sections.length) {
            setCurrentSection(0);
        }
    }
    setCurrentSection(currentIndex.value);
    updateSliderStyle();

    window.addEventListener('resize', () => {
        updateSliderStyle();
    });
});
</script>

<style scoped lang="scss">
.section-selector {
    height: 40px;
    min-width: 150px;
    width: 100%;

    display: flex;
    align-items: center;
    position: relative;
    background-color: var(--s-color-on-primary);
    border: 5px solid var(--s-color-outline-variant);
    border-radius: 20px;
    box-shadow: 0 0 0px 3px var(--s-color-surface-container-high), inset 1px 1px 1px rgba(255, 255, 255, 0.2);
    box-sizing: border-box;
    overflow: hidden;
}

.section-item {
    padding: 10px 0px;
    flex: 1 1 auto;

    text-align: center;

    // 布局
    display: flex;
    justify-content: center;
    align-items: center;

    // 效果
    transition: background-color 0.3s;
    z-index: 4;
    pointer-events: auto;
    cursor: pointer;
}


.section-item>p {
    transition: color 0.3s;
    font-weight: 900;
    // 单行文本
    white-space: nowrap;
    // 溢出省略号
    overflow: hidden;
    text-overflow: ellipsis;
}

.section-item.active {
    color: var(--s-color-on-primary);
}

.slider-container {
    position: relative;
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
    pointer-events: none;
    padding: 13px 10px;
    border-radius: 28px;
    overflow: hidden;
    background-color: #007bff00;
    z-index: 1;
}



.slider {
    position: absolute;
    top: 0;
    bottom: 0;
    background-color: var(--s-color-primary);
    transition: transform 0.3s, width 0.3s, left 0.3s;
    pointer-events: none;
    // padding: 0px 10px;
    border-radius: 12px;
    box-sizing: content-box;
    transform: skew(-20deg);
    z-index: 3;
}
</style>