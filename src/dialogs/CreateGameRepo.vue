<template>
    <dialogTemplate id="dialog-add-game-repo" v-model:visible="showAddRepoDialog" :close-on-click-mask="false">
        <template #header>
            <h3>{{ $t('dialogs.addNewRepo') }}</h3>
        </template>
        <template #default>
            <p>{{ $t('dialogs.addNewRepoContent') }}</p>
            <editRepo :repo="newRepo" />
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
import { defineModel } from 'vue';
import dialogTemplate from '@/dialogs/dialogTemplate.vue';
import editRepo from '@/components/EditRepo.vue';
const showAddRepoDialog = defineModel<boolean>("visible", {
    type: Boolean,
    default: false,
});

import { type repo } from '@/scripts/lib/Repo';

const newRepo: repo = {
    uid: '',
    location: '',
    name: '',
    description: '',
    cover: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};
</script>
