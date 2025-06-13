<!-- 这个组件只负责将一个 repo 的信息展示出来， 转化为可编辑的模式 -->
<template>
            <h3 style="height: fit-content;margin: -5px 30px 5px 30px;font-size: 26px;z-index:1" class="font-hongmeng">
                {{ $t('editDialog.edit-repo-info') }}
            </h3>

            <div id="edit-repo-info-dialog-container"
                style="display: flex;flex-direction: column;align-items: center;width: 100%;  font-size: 15px;z-index:1">
                <div id="edit-repo-info-dialog-top" style="display: flex;width: 100%;">
                    <!-- 展示mod当前名称、图片 -->
                    <div class="OO-box"
                        style="width: 280px;min-width: 0;display:flex;flex-direction: column;align-items: center;flex-wrap: nowrap;justify-content: flex-start;"
                        id="edit-repo-info-left">

                        <div id="img-container"
                            style="width: 280px;height: 224px;border-radius: 0 30px;overflow: hidden;">
                            <img id="editDialog-mod-info-image"
                                style="width: 100%; height: 100%; max-width: 100%; max-height: 100%; object-fit: cover;"
                                :src="img" />
                        </div>

                        <div class="OO-setting-bar">
                            <s-tooltip>
                                <h3 slot="trigger"> {{ $t('editDialog.mod-info-image') }} </h3>
                                <p style="line-height: 1.2;">
                                    {{ $t('editDialog.mod-info-image-tip') }} </p>
                            </s-tooltip>

                            <s-tooltip style="position: relative; left: 15px;">
                                <s-icon-button icon="image" @click="handleSelectImage" class="OO-icon-button"
                                    style="border: 5px solid var(--s-color-surface-container-high);transform: scale(1);"
                                    slot="trigger">
                                    <s-icon type="add"></s-icon>
                                </s-icon-button>

                                <p style="line-height: 1.2;">
                                    {{ $t('editDialog.edit-repo-image-preview') }} </p>
                            </s-tooltip>
                        </div>
                    </div>

                    <div style="height: 100%;margin-left: 1%;flex: 1;" id="edit-repo-info-content" class="OO-box">

                        <!-- -mod角色 -->
                        <div class="OO-setting-bar">
                            <s-tooltip>
                                <h3 slot="trigger"> {{ $t('editDialog.mod-info-character') }} </h3>
                                <p style="line-height: 1.2;">
                                    {{ $t('editDialog.mod-info-character-tip') }} </p>
                            </s-tooltip>
                            <s-text-field :value="tempRepoInfo.character"
                                @input="tempRepoInfo.character = $event.target.value" />
                        </div>

                        <!-- -mod链接 -->
                        <div class="OO-setting-bar">
                            <s-tooltip>
                                <h3 slot="trigger"> {{ $t('editDialog.mod-info-url') }} </h3>
                                <p style="line-height: 1.2;">
                                    {{ $t('editDialog.mod-info-url-tip') }} </p>
                            </s-tooltip>
                            <div class="OO-s-text-field-container">
                                <s-text-field :value="tempRepoInfo.url"
                                    @input="tempRepoInfo.url = $event.target.value" />
                                <s-icon-button type="filled" slot="start" class="OO-icon-button"
                                    @click="iManager.openUrl(tempRepoInfo.url)">
                                    <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                            <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                                        </svg></s-icon>
                                </s-icon-button>
                            </div>
                        </div>

                        <!-- -mod描述 -->
                        <div class="OO-setting-bar"
                            style="display: flex;flex-direction: column;align-items: flex-start;justify-content: space-between;height:150px;">
                            <s-tooltip style="padding:15px 0;">
                                <h3 slot="trigger"> {{ $t('editDialog.mod-info-description') }} </h3>
                                <p style="line-height: 1.2;">
                                    {{ $t('editDialog.mod-info-description-tip') }} </p>
                            </s-tooltip>
                            <s-text-field class="OO-shade-box"
                                style="min-height: calc(100% - 50px);height: 0px;border-radius: 20px;bottom: 5px;top: 45px;left: 5px;right: 5px;max-width: calc(100% - 10px);width: calc(100% - 10px);"
                                :multiLine="true" v-model="tempRepoInfo.description"
                                id="edit-repo-description"></s-text-field>
                        </div>
                    </div>
                </div>
            </div>



    <!-- -取消时再次询问是否保存 -->
    <!-- -提示是否保存更改 -->

</template>

<script setup lang="ts">
import { ref } from 'vue';
import { defineProps, onMounted, watch, useTemplateRef } from 'vue';
import dialogTemplate from '@/dialogs/dialogTemplate.vue';
import horizontalScrollBar from '../components/horizontalScrollBar.vue';
import { type repo } from '@/scripts/lib/Repo';
import { getImage, EmptyImage,type ImageBase64, type PathOrUrl, writeImageFromUrl, releaseImage, writeImageFromBase64 } from '@/scripts/lib/ImageHelper';
import { FileDialogOption, openFileDialog } from '@/scripts/lib/FileDialogHelper';
import { getFullPath, joinPath } from '@/scripts/lib/FileHelper';
import { $t_snack } from '@/scripts/lib/SnackHelper';

// 参数为 字符串类型的 mod，之后通过 iManager.getModInfo(mod) 获取 mod 信息
const props = defineProps<{
    repo: repo
}>();

const img = ref(EmptyImage as ImageBase64);



// 需要显示的repo发生变化时，更新 临时repo信息
watch(() => props.repo.cover, async (newVal) => {
    // 更新 image,其他都是同步的
    img.value = await getImage(await joinPath(props.repo.location, newVal || ''));
});

// 检查 location 是否存在，如果不存在则设置为默认值
const checkLocation = async (location: string): Promise<string> => {
    if (!location || location.trim() === '') {
        $t_snack('message.error.repoLocationRequired');
        return ''; // 如果 location 为空或仅包含空格，则返回空字符串
    }
    // 检查路径是否存在，如果不存在则返回默认路径
    const fullPath = await getFullPath(location);
    return fullPath || '/default/location'; // 替换为实际的默认路径
}


const handleSelectImage = async () => {
    const dialogOptions : FileDialogOption = {
        title: '选择预览图片',
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] }
        ],
        startingPath: await getFullPath(props.repo.location) || undefined,
    };
    const selectedFiles = await openFileDialog(dialogOptions);
    if (selectedFiles && selectedFiles.length > 0) {
        const selectedFile = selectedFiles[0];
        console.log('Selected file:', selectedFile);
        // 读取图片并转换为 base64
        img.value = await getImage(selectedFile);
        tempRepoInfo.value.cover = selectedFile; // 更新临时 repo 信息的封面图片路径
    } else {
        console.log('No file selected');
    }
}

const handleCancel = async () => {
    // 取消时，重置临时 repo 信息
    tempRepoInfo.value = JSON.parse(JSON.stringify(props.repo));
    img.value = await getImage(await joinPath(props.repo.location, props.repo.cover || ''));
}

const ifRepoEqual = (a: repo, b: repo): boolean => {
    // 比较两个 repo 对象是否相等
    return a.uid === b.uid &&
        a.location === b.location &&
        a.name === b.name &&
        a.description === b.description &&
        a.cover === b.cover &&
        a.createdAt === b.createdAt &&
        a.updatedAt === b.updatedAt;
}

const handleSave = async () => {
    //debug
    const ifEqual = ifRepoEqual(props.repo, tempRepoInfo.value);
    console.log('saved', saved, `equals`, ifEqual);
    // 保存修改的 mod 信息

    if (ifEqual && !changdPreviewByPaste) {
        return;
    }

    // 处理 图片 更改
    let needChangePreview = false;
    if (tempRepoInfo.value.cover !== props.repo.cover) {
        needChangePreview = true;
    }

    // 保存修改的 repo 信息
    // props.mod.editModInfo(tempRepoInfo.value);
    props.repo.uid = tempRepoInfo.value.uid;
    props.repo.location = tempRepoInfo.value.location;
    props.repo.name = tempRepoInfo.value.name;
    props.repo.description = tempRepoInfo.value.description;
    props.repo.createdAt = tempRepoInfo.value.createdAt;
    props.repo.updatedAt = new Date().toISOString(); // 更新修改时间

    // cover 需要特殊处理，因为这里存储的直接是文件的绝对路径（如果更改了封面图片）
    // props.repo.cover = tempRepoInfo.value.cover;


    if (needChangePreview && tempRepoInfo.value.cover) {
        // props.mod.setPreviewByPath(tempRepoInfo.value.preview);
        // 将图片 复制到 repo 的 location 目录下
        const fileName = tempRepoInfo.value.cover.split('/').pop() || 'preview.png';
        const fullPath = await joinPath(tempRepoInfo.value.location, fileName);
        console.log('Saving preview image to:', fullPath);
        await writeImageFromUrl(img.value, fullPath);
        props.repo.cover = fileName; // 更新 repo 的 cover 路径

        // 释放之前的预览图片资源
        releaseImage(tempRepoInfo.value.cover);
    }

    // 如果是通过粘贴操作更改的预览图片，则保存到本地
    if (changdPreviewByPaste) {
        const fileName = `preview-${Date.now()}.png`; // 使用时间戳作为文件名
        const fullPath = await joinPath(tempRepoInfo.value.location, fileName);
        console.log('Saving pasted preview image to:', fullPath);
        await writeImageFromBase64(img.value, fullPath);
        props.repo.cover = fileName; // 更新 repo 的 cover 路径

        changdPreviewByPaste = false; // 重置粘贴标志
    }

    tempRepoInfo.value = JSON.parse(JSON.stringify(props.repo));
    // 更新 img 的值
    img.value = await getImage(await joinPath(props.repo.location, props.repo.cover || ''));
    saved = true;
}

let changdPreviewByPaste = false;
const editModInfoDialog = ref<HTMLElement | null>(null);
onMounted(() => {
    if (!editModInfoDialog.value) {
        console.error('editModInfoDialog is not defined');
        return;
    }
    // 监听 dialog 的 dismiss 事件，如果未保存则弹出保存更改的 dialog
    editModInfoDialog.value.addEventListener('dismiss', () => {
        console.log('dismiss', 'props.repo', props.repo, 'tempRepoInfo', tempRepoInfo.value, saved);
        if (!saved && !ifRepoEqual(props.repo, tempRepoInfo.value)) {
            saveChangeDialogVisible.value = true;
        }
        saved = false;
    });

    // 监听 dialog 的 show 事件，再同步一次 tempRepoInfo
    editModInfoDialog.value.addEventListener('show', async () => {
        tempRepoInfo.value = props.mod.copy();
        img.value = await props.mod.getPreviewBase64(true);
    });

    // 监听粘贴操作，如果粘贴的是图片则将其设置为 mod 的预览图片
    window.addEventListener('paste', async (event) => {
        //debug
        console.log('paste', event.clipboardData);
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        for (const item of items) {
            if (item.kind === 'file') {
                const blob = item.getAsFile();
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const imgBase64 = e.target.result;
                    img.value = imgBase64;
                    // tempRepoInfo.value.preview = imgBase64;
                    changdPreviewByPaste = true;
                };
                reader.readAsDataURL(blob);
            }
        }
    });
});
</script>


<style scoped>
.hotkey-container {
    overflow-y: hidden;
    overflow-x: auto;
    height: 35px;
    align-items: center;
    max-width: 450px;
    padding: 0 10px;
    border-radius: 20px;
}
</style>