<template>
    <div class="route-list">
        <h1>XX Mod Manager {{ $route.name }}</h1>
        <h2>You are currently on the {{ $route.name }} page</h2>
        <nav>
            <ul>
                <!-- <li><router-link to="/">Main</router-link></li> -->
                 <li><s-button class="OO-button" @click="$router.push('/');">Main</s-button></li>
                <li><s-button class="OO-button" @click="$router.push('/switch-config')">Switch Config</s-button></li>
                <li><s-button class="OO-button" @click="$router.push('/tutorial')">Tutorial</s-button></li>
                <li><s-button class="OO-button" @click="$router.push('/test-rw')">Test RW</s-button></li>
                <li><s-button class="OO-button" @click="$router.push('/test-dialog')">Test Dialog</s-button></li>
            </ul>
        </nav>
        <h2>Tauriapp Version: {{ version }} | Package Version: {{ versionInfo }}</h2>
        <pre>{{ versionNote }}</pre>
    </div>
</template>
<script lang="ts" setup>
import { getVersion } from '@tauri-apps/api/app';
import { getVersionInfo, getVersionNote } from '@/scripts/lib/VersionInfo';
import { onMounted, ref } from 'vue';

const version = ref<string>('0.0.0');
const versionInfo = ref<string>('0.0.0');
const versionNote = ref<string>('');

onMounted(async () => {
    version.value = await getVersion();
    versionInfo.value = getVersionInfo();
    versionNote.value = getVersionNote();
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