<template>
    <div class="route-list">
        <h1>XX Mod Manager {{ $route.name }}</h1>
        <h2>Version: {{ version }}</h2>
        <h2>Version Info: {{ versionInfo }}</h2>
        <h2>You are currently on the {{ $route.name }} page</h2>
        <nav>
            <ul>
                <li><router-link to="/">Main</router-link></li>
                <li><router-link to="/switch-config">Switch Config</router-link></li>
                <li><router-link to="/tutorial">Tutorial</router-link></li>
                <li><router-link to="/test-rw">Test RW</router-link></li>
            </ul>
        </nav>
    </div>
</template>
<script lang="ts" setup>
import { getVersion } from '@tauri-apps/api/app';
import { getVersionInfo } from '@/scripts/lib/VersionInfo';
import { onMounted, ref } from 'vue';

const version = ref<string>('0.0.0');
const versionInfo = ref<string>('0.0.0');


onMounted(async () => {
    version.value = await getVersion();
    versionInfo.value = getVersionInfo();
});


</script>
<style lang="scss" scoped>
.route-list {
    display: flex;
    flex-direction: column;
    align-items: start;
    justify-content: center;
    padding-left: 20px;
    width: calc(100%);
}

</style>