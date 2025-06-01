<template>
    <FlashingButton>
        <s-tooltip>
            <div slot="trigger" class="back-button">
            </div>
            {{ $t('buttons.back') }}
        </s-tooltip>
    </FlashingButton>
</template>

<script setup lang="ts">
import FlashingButton from './base/FlashingButton.vue';
</script>
<style lang="scss" scoped>
.back-button {
    width: 80px;
    aspect-ratio: 160/97;
    background-image: url('@/assets/backButton.png');
    background-size: cover;
    background-position: center;
    cursor: pointer;
    filter: brightness(1.2);
}
</style>
