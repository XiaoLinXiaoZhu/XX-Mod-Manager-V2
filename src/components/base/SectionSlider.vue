<template>
    <div class="section-slider" :style="sectionStyle" ref="sectionSlider">
        <slot></slot>
    </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';

const currentSection = defineModel<number>('currentSection', {
    default: 0,
    type: Number
});


const sectionSlider = ref<HTMLElement | null>(null);
const sectionCount = computed(() => {
    return sectionSlider.value ? sectionSlider.value.children.length : 0;
});
const sectionStyle = computed(() => {
    return {
        transform: `translateX(calc(${currentSection.value} * -100%))`,
        transition: 'transform 0.3s ease-in-out'
    };
});
// :style="{transform: `translateX(calc(${sections.indexOf(currentSection)} * (10px - 100vw) ))`}
onMounted(() => {
    // 初始化时设置当前section-slider的子元素的样式
    if (sectionSlider.value) {
        const children = sectionSlider.value.children;
        for (let i = 0; i < children.length; i++) {
            (children[i] as HTMLElement).style.width = '100%';
            (children[i] as HTMLElement).style.flex = 'none';
        }
    }
});
</script>

<style scoped lang="scss">
.section-slider {
    display: flex;
    flex-direction: row;
    flex: 1;
    transition: transform 0.3s;
    overflow: visible;
    position: relative;
    height: calc(100%);
    width: 100%;
}
</style>