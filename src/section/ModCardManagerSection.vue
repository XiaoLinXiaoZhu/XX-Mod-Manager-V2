<template>
    <div class="mod-card-manager-section">
        <div class="left-bar OO-box">

        </div>
        <div class="mod-card-container OO-box">

        </div>
    </div>

</template>
<script setup lang="ts">
</script>

<style scoped lang="scss">
.mod-card-manager-section {
    display: flex;
    flex-direction: row;
    height: 100%;
    width: 100%;
    flex: 0 0 auto;
    place-content: center;

    .left-bar {
        width: 20vw;
        min-width: 150px;
        max-width: 200px;
        height: calc(100% - 20px);
        padding: 10px;
        margin: 10px;


        display: flex;
        flex-direction: column;
        align-items: center;
        box-sizing: border-box;


    }

    .mod-card-container {
        flex: 1 1 0;
        min-width: 0;
        height: calc(100% - 20px);
        margin: 10px 10px 10px 0px;

        overflow-y: auto;
        padding: 10px;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        box-sizing: border-box;
    }
}
</style>