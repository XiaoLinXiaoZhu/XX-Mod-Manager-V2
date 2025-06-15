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
import { defineModel, onMounted, ref ,type Ref} from 'vue';
import dialogTemplate from '@/dialogs/dialogTemplate.vue';
import editRepo from '@/components/EditRepo.vue';
import { type repo,repos,getRepos } from '@/scripts/lib/Repo';
import { EventSystem, EventType } from '@/scripts/core/EventSystem';
const showEditRepoDialog = defineModel<boolean>("visible", {
    type: Boolean,
    default: false,
});

const repoToEdit: Ref<repo | null> = defineModel<repo | null>("repo", {
    type: Object as () => repo | null,
    required: true
});

const tempRepo : Ref<repo> = ref(JSON.parse(JSON.stringify(repoToEdit.value)))

const handleCancel = () => {
    tempRepo.value = JSON.parse(JSON.stringify(repoToEdit.value));
    showEditRepoDialog.value = false;
};

const handleSave = () => {
    repoToEdit.value = tempRepo.value;
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
