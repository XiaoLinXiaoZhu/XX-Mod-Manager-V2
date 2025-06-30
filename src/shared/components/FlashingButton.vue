<template>
    <div class="blend-button" @mousedown="handleClick" ref="blendButtonRef">
        <div class="button-content" ref="buttonRef">
            <slot>Click Me!</slot>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { defineEmits } from 'vue'
import { animate, createTimeline } from 'animejs'
const emits = defineEmits(['click'])

const buttonRef = ref(null)
const blendButtonRef = ref(null)


const isClicked = ref(false)

const handleClick = () => {
    if (isClicked.value) return // 防止重复点击
    isClicked.value = true
    const btn = buttonRef.value
    btn.classList.add('blinking')
    const blendButton = blendButtonRef.value
    blendButton.classList.add('blinking')

    setTimeout(() => {
        isClicked.value = false
        emits('click')
        btn.classList.remove('blinking')
        blendButton.classList.remove('blinking')
    }, 400)
}
</script>

<style lang="scss" scoped>
$flash-color: #ccff00;
$flash-duration: 0.4s;

.blend-button {
    width: fit-content;
    height: fit-content;
    padding: 1px;
    overflow: visible;

    // filter mod
    &.blinking {
        filter: brightness(1.2);
    }
}

.button-content {
    position: relative;
    cursor: pointer;
    color: white;
    border-radius: 4px;
    overflow: hidden;
    z-index: 1;

    &.blinking {
        animation-iteration-count: infinite;
        animation-direction: alternate;
        // animation-timing-function: ease-in-out;
        animation-duration: $flash-duration;
        animation-name: glow;

        // 通过filter将其调整为黄色纯色
        filter: invert(50%) sepia(100%) saturate(99999%) hue-rotate(87deg) brightness(20);
    }
}

@keyframes glow {
    0%, 100% {
        opacity: 0.6;
        transform: scale(1);
    }
    
    16.67%, 50%, 83.33% {
        opacity: 1;
        transform: scale(1.2);
    }
    
    33.33%, 66.67% {
        opacity: 0.6;
        transform: scale(1);
    }
}
</style>