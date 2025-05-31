<template>
    <div class="berger-frame" ref="bergerFrame">
        <div class="berger-header">
            <slot name="header"></slot>
        </div>
        <div class="berger-content">
            <slot name="content"></slot>
        </div>
        <div class="berger-footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
</script>


<style scoped lang="scss">
.berger-frame {
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-image: url('@assets/background.png');

    .berger-header {
        position:fixed;
        top: 0;
        height: 60px;
        width: 100%;

        // 居中
        display: flex;
        align-items: center;

        border-bottom: 1px solid #eee;
    }

    .berger-content {
        position: relative;
        top: 60px; // Adjust based on header height
        bottom: 60px; // Adjust based on footer height
        overflow-y: auto;
        height: calc(100% - 120px); // Adjust based on header and footer heights
    }

    .berger-footer {
        position: fixed;
        bottom: 0;
        width: 100%;
        height: 60px;

        // 居中
        display: flex;
        align-items: center;

        border-top: 1px solid #eee;
    }
}
</style>