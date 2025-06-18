<template>
    <dialogTemplate id="dialog-add-game-repo" v-model:visible="showEditRepoDialog" :close-on-click-mask="true" @show="init">
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
import { defineModel, onMounted, ref ,watch,type Ref} from 'vue';
import dialogTemplate from '@/dialogs/dialogTemplate.vue';
import editRepo from '@/components/EditRepo.vue';
import { type repo,repos } from '@/scripts/lib/Repo';
const showEditRepoDialog = defineModel<boolean>("visible", {
    type: Boolean,
    default: false,
});

const repoToEdit: Ref<repo | null> = defineModel<repo | null>("repo", {
    type: Object as () => repo | null,
    required: true
});

// watch(repoToEdit, (newRepo) => {
//  init();
// });

const tempRepo : Ref<repo> = ref(JSON.parse(JSON.stringify(repoToEdit.value)))

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
    repos.value = repos.value.map(r => r.uid === repoToEdit.value?.uid ? tempRepo.value : r);
    console.log('Repo updated:', tempRepo.value);
    showEditRepoDialog.value = false;
}

const init = async () => {
    // debug
    console.log('CreateGameRepo initialized');
    if (!repoToEdit.value){
        return;
    }
    tempRepo.value = JSON.parse(JSON.stringify(repoToEdit.value));
}

onMounted(async () => {
    await init();
});
</script>
