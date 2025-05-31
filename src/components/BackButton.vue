<template>
<FlashingButton>
    <s-tooltip>
    <s-button slot="trigger">Tooltip</s-button>
    {{ $t('buttons.back') }}
    </s-tooltip>
</FlashingButton>
</template>
<script setup lang="ts">
import FlashingButton from './base/FlashingButton.vue';
</script>
<style lang="scss" scoped>

</style>
