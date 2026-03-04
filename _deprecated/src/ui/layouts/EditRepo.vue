<template>
    <div class="edit-repo" ref="editRepo">
        <div class="edit-repo-left OO-box">
            <div class="repo-cover">
                <div class="repo-img-container">
                    <img :src="imgSrc" alt="Repository Cover" />
                </div>
                <s-button class="OO-button" :class="{ 'flashOnce': buttonFlash }"
                    @mousedown="buttonFlash = true; handleUpdateCoverButtonClick()" @animationend="buttonFlash = false">
                    {{ $t('editRepo.selectCover') }}
                </s-button>
            </div>
        </div>
        <div class="edit-repo-right OO-box">
            <div class="bottom-details">
                <p @dblclick="console.log('repo', Repo)">{{ $t('editRepo.uid') }}: <span> {{ Repo.uid }} </span></p>
                <p>{{ $t('editRepo.createdAt') }}: <span> {{ Repo.createdAt || "unknown" }} </span></p>
                <p>{{ $t('editRepo.updatedAt') }}: <span> {{ Repo.updatedAt || "unknown" }} </span></p>
                <p @dblclick="defaultModService.getFileSystem().showDirectoryInExplorer(repo.configLocation)">{{ $t('editRepo.location') }}: <span> <s-tooltip
                            style="width: calc(25% + 10px);">
                            <span slot="trigger">{{ Repo.configLocation }}</span>
                            <span>{{ $t('editRepo.locationTip') }}</span>
                        </s-tooltip></span></p>
            </div>
            <div class="OO-setting-bar" id="edit-repo-name">
                <h3>{{ $t('editRepo.title') }}</h3>
                <s-text-field v-model="Repo.name" />
            </div>
            <!-- <div class="OO-setting-bar">
                <h3>{{ $t('editRepo.location') }}</h3>
                <s-text-field v-model="Repo.location" disabled />
            </div> -->
            <div class="OO-setting-bar">
                <h3>{{ $t('editRepo.cover') }}</h3>
                <s-text-field v-model="Repo.cover" disabled />
            </div>
            <div class="OO-setting-bar"
                style="display: flex;flex-direction: column;align-items: flex-start;justify-content: space-between;height:150px;">
                <s-tooltip style="padding:10px 0;">
                    <h3 slot="trigger"> {{ $t('editRepo.description') }} </h3>
                    <p style="line-height: 1.2;">
                        {{ $t('editDialog.mod-info-description-tip') }} </p>
                </s-tooltip>
                <s-text-field class="OO-shade-box multiLine-text-field" :multiLine="true"
                    v-model="Repo.description"></s-text-field>
            </div>
        </div>
    </div>

    <DialogTemplate v-model:visible="ifUsePastedImageDialog" id="dialog-if-use-pasted-image">
        <template #header>
            <h3>{{ $t('editRepo.youJustPasted') }}</h3>
        </template>
        <template #default>
            <p>{{ $t('editRepo.ifUsePastedImage') }}</p>
        </template>
        <template #footer>
            <s-button class="OO-button dialog-button font-hongmeng"
                @click="ifUsePastedImageDialog = false">取消</s-button>
            <s-button class="OO-button dialog-button OO-color-gradient font-hongmeng"
                @click="handleComfirmPaste">确认</s-button>
        </template>
    </DialogTemplate>
</template>

<script setup lang="ts">

import { ref, onMounted,watch } from 'vue';
import { type repo } from '@/compat/legacy-bridge';
import { EmptyImage, getImage, releaseImage, writeImageFromBase64, writeImageFromUrl, type ImageUrl } from '@/kernels/image';
import { FileDialogOption, openFileDialog } from '@/kernels/file-dialog';
import { $t } from '@/compat/legacy-bridge';
import { $t_snack, snack } from '@/shared/composables/use-snack';
import { basename, isAbsolute, join } from '@tauri-apps/api/path';
import { defaultModService } from '@/services';
import DialogTemplate from '@/ui/dialogs/dialogTemplate.vue';

const Repo = defineModel('repo', {
    type: Object as () => repo,
    required: true,
});
const imgSrc = ref<ImageUrl>(EmptyImage);
const updateCover = async () => {
    if (Repo.value.cover) {
        // 仓库的封面默认是相对于仓库位置的相对路径
        if (await isAbsolute(Repo.value.cover)) {
            // 如果是绝对路径，则直接使用
            console.warn('Repo cover is an absolute path, this may cause issues:', Repo.value.cover);
            imgSrc.value = await getImage(Repo.value.cover);
            return;
        }
        // 拼接一下路径
        const coverPath = await join(Repo.value.configLocation, Repo.value.cover);
        const imgUrl: ImageUrl = await getImage(coverPath);
        imgSrc.value = imgUrl;
    } else {
        imgSrc.value = EmptyImage;
    }
};

// 监听仓库的封面变化
watch(() => Repo.value.cover, (newCover) => {
    if (newCover) {
        // 如果仓库的封面有变化，则更新图片
        updateCover();
    } else {
        // 如果没有封面，则使用默认图片
        imgSrc.value = EmptyImage;
    }
});

const buttonFlash = ref(false);
const handleUpdateCoverButtonClick = async () => {
    // 打开文件选择器，选择图片文件
    const fileDialogOptions: FileDialogOption = {
        title: $t('editRepo.selectCover'),
        filters: [
            { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif'] },
        ],
    };
    const files = await openFileDialog(fileDialogOptions);
    if (!files || files.length === 0) {
        console.warn('No file selected');
        $t_snack('editRepo.noFileSelected', "error");
        return;
    }
    const filePath = files[0];
    // 获取文件名称
    const fileName = await basename(filePath);
    // debug
    console.log('Selected file:', filePath, 'File name:', fileName);
    // 将新的文件写到仓库位置下，并更新仓库的封面路径
    const newCoverPath = await join(Repo.value.configLocation, fileName);
    await writeImageFromUrl(newCoverPath, filePath);

    // 显式的释放旧的图片资源
    if (Repo.value.cover) {
        releaseImage(await join(Repo.value.configLocation, Repo.value.cover));
    }
    imgSrc.value = await getImage(newCoverPath, true);

    // 提示成功
    snack($t('editRepo.coverUpdated') + `${Repo.value.cover || ''} -> ${fileName}`, "success");

    // 更新仓库的封面路径
    Repo.value.cover = fileName;
};

// paste
const ifUsePastedImageDialog = ref(false);
const pasteImg = ref("");
const handlePaste = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        // debug
        console.log("get paste", item)
        if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    pasteImg.value = e.target?.result as string;
                    ifUsePastedImageDialog.value = true;
                };
                reader.readAsDataURL(file);
            }
        }
    }
    // 然后打开确认对话框
    ifUsePastedImageDialog.value = true;
};
const handleComfirmPaste = () => {

}
const handleDrop = async (event: DragEvent) => {
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
        $t_snack('editRepo.noFileDrop', "error");
        return;
    }
    const file = files[0];
    if (!file.type.startsWith('image/')) {
        $t_snack('editRepo.notImageFile', "error");
        return;
    }
    //debug
    console.log('get drop file:', file)
    // 生成文件名
    const fileName = file.name;
    const newCoverPath = await join(Repo.value.configLocation, fileName);

    // 读取图片为base64
    const reader = new FileReader();
    reader.onload = async (e) => {
        // 写入图片
        await writeImageFromBase64(newCoverPath, e.target?.result as string,true);

        // 释放旧图片
        if (Repo.value.cover) {
            releaseImage(await join(Repo.value.configLocation, Repo.value.cover));
        }
        imgSrc.value = await getImage(newCoverPath, true);

        snack($t('editRepo.coverUpdated') + `${Repo.value.cover || ''} -> ${fileName}`, "success");
        Repo.value.cover = fileName;
    };
    reader.readAsDataURL(file);
};

const editRepo = ref<HTMLElement | null>(null);

onMounted(() => {
    updateCover();

    if (editRepo.value) {
        editRepo.value.addEventListener('paste', handlePaste);
        editRepo.value.addEventListener('drop', (event) => {
            // debug
            console.log("getFileDrop");
            event.preventDefault();
            event.stopPropagation();
            handleDrop(event);
        });
    }
});



</script>

<style scoped lang="scss">
.edit-repo {
    display: flex;
    flex-direction: row;
    width: 100%;
    height: 100%;
    background-color: var(--bg-color);
}

.edit-repo-left {
    height: 100%;
    margin: 10px;
}

.edit-repo-right {
    position: relative;
    width: 70%;
    height: calc(100% + 20px); // 让右侧的盒子高度与左侧的盒子高度一致
    margin: 10px;
    padding-bottom: 0;
    padding-top: 0;
    margin-left: 0;



    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;

    >* {
        margin-bottom: 0;
    }

    &>:last-child {
        flex: 1;
        margin-bottom: 40px;
    }
}

.repo-cover {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: calc(100%);

    .repo-img-container {
        height: calc(100% - 50px); // 减去文字高度
        aspect-ratio: 2/3;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 8px;
        position: relative;
        z-index: 1; // 确保图片容器在网点效果之上

        img {
            width: 100%;
            height: 100%;
            object-fit: cover; // 或 cover，根据需求选择
            image-rendering: auto; // 让浏览器自动优化渲染
            position: relative;
            z-index: 2; // 确保图片在最上层
        }
    }

    .OO-button {
        width: 100%;
        height: 40px;
        margin-top: 10px;
    }
}

.bottom-details {
    opacity: 0.3;
    // 设置过渡效果
    transition: opacity 0.3s ease-in-out;

    // 当鼠标悬停在bottom-details上时显示
    &:hover {
        opacity: 1;
        animation: flashOnce 0.3s;
    }

    position: absolute;
    bottom: 10px;
    // 水平排布
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    width: calc(100% - 30px);
    padding: 0px 5px;
    border-radius: 8px;

    color: var(--s-color-on-surface-variant);
    font-size: 0.9em;

    // 每个段落之间有间距
    p {
        padding: 0;
        margin: 0;
        font-weight: bold;
        max-width: 23%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        & span {
            font-weight: normal;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        &::after {
            // 添加分隔符
            content: '|';
            margin-left: 10px;
            margin-right: 10px;
        }
    }
}


.multiLine-text-field {
    position: absolute;
    bottom: 5px;
    top: 45px;
    left: 5px;
    right: 5px;
    max-width: calc(100% - 10px);
    width: calc(100% - 10px);

    min-height: 200px;
    height: 200px;

    border-radius: 24px;
    --text-field-border-radius: 24px;
    --text-field-padding: 24px;
}

.dialog-button {
    margin-left: 40px;
    margin-right: 40px;
}
</style>
