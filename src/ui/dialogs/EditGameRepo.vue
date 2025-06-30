<template>
    <dialogTemplate id="dialog-edit-repo" v-model:visible="showEditRepoDialog" :close-on-click-mask="true"
        @show="init">
        <template #header>
            <h3>{{ $t('dialogs.editRepo') }}</h3>
        </template>
        <template #default>
            <div style="height: 400px;">
                <editRepo v-if="tempRepo" :repo="tempRepo" />
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
                <p>{{ $t('buttons.save') }}</p>
            </s-button>
        </template>
    </dialogTemplate>
</template>

<script setup lang="ts">
import { defineModel, onMounted, ref, watch, type Ref } from 'vue';
import dialogTemplate from '@/dialogs/dialogTemplate.vue';
import editRepo from '@/components/EditRepo.vue';
import { type repo, repos } from '@/features/repository/Repo';
import { snack } from '@/scripts/lib/SnackHelper';

import { $t } from '@/scripts/lib/localHelper';
const showEditRepoDialog = defineModel<boolean>("visible", {
    type: Boolean,
    default: false,
});

const repoToEdit: Ref<repo | null> = defineModel<repo | null>("repo", {
    type: Object as () => repo | null,
    required: true
});

const tempRepo: Ref<repo> = ref(JSON.parse(JSON.stringify(repoToEdit.value)))

const handleCancel = () => {
    tempRepo.value = JSON.parse(JSON.stringify(repoToEdit.value));
    showEditRepoDialog.value = false;
};

const handleSave = () => {
    repoToEdit.value = JSON.parse(JSON.stringify(tempRepo.value));
    // 上面这个方法好像保存不了，因为 repoToEdit.value 是一个引用类型，直接赋值可能不会触发更新
    // 直接操作repos
    if (!repos) {
        console.warn('Repos not initialized yet.');
        return;
    }
    tempRepo.value.updatedAt = new Date().toISOString();
    repos.value = repos.value.map(r => r.uid === repoToEdit.value?.uid ? tempRepo.value : r);
    console.log('Repo updated:', tempRepo.value);
    showEditRepoDialog.value = false;
}

const init = async () => {
    // debug
    console.log('CreateGameRepo initialized');
    if (!repoToEdit.value) {
        return;
    }
    tempRepo.value = JSON.parse(JSON.stringify(repoToEdit.value));
}

const addDeleteButton = () => {
        // 增加一个删除按钮
    const deleteButton = document.createElement('s-icon-button');
    deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
  <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"></path>
</svg>`
    deleteButton.style.marginRight = '10px';
    deleteButton.style.color = 'red';
    deleteButton.style.zIndex = '1';
    deleteButton.style.position = 'relative';
    deleteButton.style.left = '23px';
    deleteButton.classList.add('OO-button');
    deleteButton.id = 'dialog-delete-repo';

    // 单击删除按钮时弹出提示
    deleteButton.addEventListener('click', () => {
        snack($t("editDialog.deleteCheck", { repoName: repoToEdit.value?.name }), "info");
    });

    // 双击删除按钮时删除
    deleteButton.addEventListener('dblclick', () => {
        if (!repos) {
            console.warn('Repos not initialized yet.');
            return;
        }
        if (!repos.value) {
            console.warn('Repos not initialized yet.');
            return;
        }
        const index = repos.value.findIndex(r => r.uid === repoToEdit.value?.uid);
        if (index !== -1) {
            repos.value.splice(index, 1);
            snack($t("editDialog.deleteSuccess", { repoName: repoToEdit.value?.name }), "success");
            showEditRepoDialog.value = false;
        } else {
            console.warn('Repo not found:', repoToEdit.value?.uid);
        }
    });

    // 将删除按钮添加到对话框的edit-repo-name

    const editGameDialog = document.querySelector('#dialog-edit-repo');
    if (editGameDialog) {
        const editRepoName = editGameDialog.querySelector('#edit-repo-name');
        if (editRepoName) {
            editRepoName.appendChild(deleteButton);
            // debug
            console.log('Delete button added to dialog header.');   
        } else {
            console.warn('Header not found in dialog.');
        }
    } else {
        console.warn('Dialog not found: #dialog-add-game-repo');
    }
}

onMounted(async () => {
    await init();

    addDeleteButton();
});
</script>
