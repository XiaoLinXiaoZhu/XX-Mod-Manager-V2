<template>
    <dialogTemplate id="dialog-add-game-repo" v-model:visible="showAddRepoDialog" :close-on-click-mask="true" @show="init">
        <template #header>
            <h3>{{ $t('dialogs.addNewRepo') }}</h3>
        </template>
        <template #default>
            <div style="height: 400px;">
                <editRepo :repo="newRepo" />
            </div>
        </template>
        <template #footer>
            <s-button slot="action" type="text" id="dialog-cancel" class="OO-button font-hongmeng" @click="handleCancel"
                style="margin-left: 20px;
    margin-right: 20px;">
                <p>{{ $t('buttons.cancel') }}</p>
            </s-button>
            <s-button slot="action" type="text" id="preset-add-confirm"
                class="OO-button font-hongmeng OO-color-gradient" @click="handleSave" style="color: var(--s-color-surface);margin-left: 20px;
    margin-right: 20px;">
                <p>{{ $t('buttons.create') }}</p>
            </s-button>
        </template>
    </dialogTemplate>
</template>

<script setup lang="ts">
import { defineModel, ref ,type Ref} from 'vue';
import dialogTemplate from './dialogTemplate.vue';
import EditRepo from '../layouts/EditRepo.vue';
import { type repo,repos,getRepos } from '@/features/repository/Repo';
import { EventSystem, EventType } from '@/core/event/EventSystem';
import { path } from '@tauri-apps/api';
const showAddRepoDialog = defineModel<boolean>("visible", {
    type: Boolean,
    default: false,
});

const newRepo: Ref<repo> = ref({
    uid: '',
    configLocation: '',
    name: '',
    description: '',
    cover: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

const handleCancel = () => {
    showAddRepoDialog.value = false;
};

const handleSave = () => {
    // 将 newRepo 添加到 repos 中
    if (!repos) {
        console.warn('Repos not initialized yet.');
        return;
    }
    if (repos.value) {
        // repos.value.push(newRepo.value);
        repos.value = [...repos.value, newRepo.value]; // 使用展开运算符添加新仓库
        console.log('New repo added:', newRepo.value);

        // 重置 newRepo
        newRepo.value = {
            uid: `repo-${repos.value.length + 1}`,
            configLocation: '',
            name: '',
            description: '',
            cover: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        showAddRepoDialog.value = false;
    } else {
        console.warn('Repos not initialized yet.');
    }
}

const init = async () => {
    // debug
    await getRepos();
    console.log('CreateGameRepo initialized');
    if (!repos) {
        console.warn('Repos not initialized yet.');
        return;
    }
    newRepo.value.uid = repos.value.length > 0 ? `repo-${repos.value.length + 1}` : 'repo-1';
    newRepo.value.configLocation = await path.join(await path.appDataDir(),'repos', newRepo.value.uid);
}

EventSystem.on(EventType.initDone,async () => {
    await init();
})
</script>
