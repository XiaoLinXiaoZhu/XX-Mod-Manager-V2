<template>
    <div 
        class="blend-button" 
        @mousedown="handleClick" 
        @keydown.enter="handleClick"
        @keydown.space="handleClick"
        ref="blendButtonRef"
        :class="{ 'blinking': isFlashing, 'disabled': disabled }"
        tabindex="0"
        role="button"
        :aria-pressed="isClicked"
        :aria-disabled="disabled"
    >
        <div class="button-content" ref="buttonRef" :class="{ 'blinking': isFlashing }">
            <slot>Click Me!</slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
    disabled?: boolean
    flashDuration?: number
}

const props = withDefaults(defineProps<Props>(), {
    disabled: false,
    flashDuration: 400
})

// Emits
const emits = defineEmits<{
    click: []
}>()

// Refs with proper typing
const buttonRef = ref<HTMLElement | null>(null)
const blendButtonRef = ref<HTMLElement | null>(null)

// State
const isClicked = ref(false)
const isFlashing = ref(false)

// Computed properties
const isFlashingComputed = computed(() => isFlashing.value)

const handleClick = (event?: Event) => {
    // Prevent action if disabled or already processing
    if (props.disabled || isClicked.value) return
    
    // Prevent default behavior for keyboard events
    if (event) {
        event.preventDefault()
    }
    
    isClicked.value = true
    isFlashing.value = true
    
    const btn = buttonRef.value
    const blendButton = blendButtonRef.value
    
    // Safely add blinking class if elements exist
    if (btn) {
        btn.classList.add('blinking')
    }
    if (blendButton) {
        blendButton.classList.add('blinking')
    }

    setTimeout(() => {
        isClicked.value = false
        isFlashing.value = false
        
        // Safely remove blinking class if elements exist
        if (btn) {
            btn.classList.remove('blinking')
        }
        if (blendButton) {
            blendButton.classList.remove('blinking')
        }
        
        // Emit click event after animation
        emits('click')
    }, props.flashDuration)
}

// Expose for template access
defineExpose({
    handleClick,
    isFlashing: isFlashingComputed
})
</script>

<style lang="scss" scoped>
$flash-color: #ccff00;
$flash-duration: 0.4s;

.blend-button {
    width: fit-content;
    height: fit-content;
    padding: 1px;
    overflow: visible;
    outline: none;
    transition: opacity 0.2s ease, filter 0.2s ease;

    // Focus styles for accessibility
    &:focus-visible {
        outline: 2px solid var(--s-color-primary, #007bff);
        outline-offset: 2px;
    }

    // Disabled state
    &.disabled {
        opacity: 0.5;
        pointer-events: none;
        cursor: not-allowed;
    }

    // Flash effect
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
    transition: transform 0.1s ease, filter 0.1s ease;

    // Hover effect (only if not disabled)
    .blend-button:not(.disabled) &:hover {
        transform: scale(1.05);
    }

    // Active state
    .blend-button:not(.disabled) &:active {
        transform: scale(0.95);
    }

    // Flash animation
    &.blinking {
        animation: glow $flash-duration infinite alternate;
        
        // Cross-browser compatible yellow filter
        filter: 
            invert(50%) 
            sepia(100%) 
            saturate(99999%) 
            hue-rotate(87deg) 
            brightness(20);
    }
}

// Keyframe animation with better browser support
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

// Fallback for older browsers that don't support CSS filters
@supports not (filter: invert(1)) {
    .button-content.blinking {
        background-color: $flash-color;
        animation: glow-fallback $flash-duration infinite alternate;
    }
    
    @keyframes glow-fallback {
        0%, 100% {
            opacity: 0.6;
            box-shadow: 0 0 5px $flash-color;
        }
        
        50% {
            opacity: 1;
            box-shadow: 0 0 15px $flash-color;
        }
    }
}

// Reduce motion for users who prefer it
@media (prefers-reduced-motion: reduce) {
    .button-content.blinking {
        animation-duration: 0.1s;
        animation-iteration-count: 1;
    }
    
    .blend-button, .button-content {
        transition-duration: 0.01s;
    }
}
</style>
