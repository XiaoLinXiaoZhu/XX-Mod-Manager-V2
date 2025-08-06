// 将Mod应用到游戏中，有两种方式：
// 1. 传统模式： 通过在游戏文件夹名称前添加 disable_ 前缀来禁用Mod
// 2. 新模式：通过创建 软链接 来实现Mod的应用

import { SubConfig } from "@/core/config/ConfigLoader";
import { createSymlinkBatch } from "@/shared/services/CreateSymlinkBatch";
import { globalServiceContainer } from "@/shared/services/ServiceContainer";
import { basename, dirname } from "@tauri-apps/api/path";

import { ModInfo } from "../mod-manager/ModInfo";
import { $t_snack } from "@/shared/composables/use-snack";

export async function applyMod(allMods: ModInfo[], selectedMods: ModInfo[], distFolder: string, useSymlink: boolean): Promise<void> {
    if (useSymlink) {
        await applyModBySymlink(allMods, selectedMods, distFolder);
    } else {
        await applyModTraditionally(allMods, selectedMods, distFolder);
    }
}

async function pathsToNames(paths: string[]): Promise<string[]> {
    return await Promise.all(
        paths.map(async (path) => {
            return await basename(path);
        })
    );
}

async function applyModBySymlink(allMods: ModInfo[], selectedMods: ModInfo[], distFolder: string): Promise<void> {
    const allModPaths = allMods.map(mod => mod.metadata.location.value);
    const selectedModPaths = selectedMods.map(mod => mod.metadata.location.value);

    // 如果使用软链接方式，那么需要确保distFolder和 allModPaths 位于不同目录下
    if (await dirname(allModPaths[0]) === distFolder) {
        console.warn(`Mods must be in a different directory than the distFolder: ${distFolder}`);
        $t_snack('applyMods.symlinkError_sameDir', "error");
        return;
    }
    
    // 首先, 检查文件夹是否存在
    if (!await globalServiceContainer.fs.checkDirectoryExists(distFolder)) {
        console.warn(`Directory does not exist: ${distFolder}`);
        return;
    }
    // 检查是否支持符号链接
    if (!await globalServiceContainer.fs.isSymlinkSupported(distFolder)) {
        console.warn(`Symlink is not supported in ${distFolder}`);
        return;
    }
    // distFolder 目录下可能已经存在一些文件或目录
    // 获取 distFolder 目录下的所有文件和目录
    const selectedModNames = await pathsToNames(selectedModPaths);
    const allModNames = await pathsToNames(allModPaths);


    const existingFiles = await globalServiceContainer.fs.listDirectory(distFolder);
    const folderNeedRemove: string[] = [];
    const selectedModPathsToCreate: string[] = [...selectedModPaths];
    
    await Promise.all(
        existingFiles.map(async (filePath) => {
            // 1. 如果不是文件夹，则跳过
            if (!await globalServiceContainer.fs.checkDirectoryExists(filePath)) {
                return;
            }
            // 2. 如果该文件名在 selectedModNames 中存在，则跳过
            const fileName = await basename(filePath);
            if (selectedModNames.includes(fileName)) {
                // 找到对应的mod路径并从待创建列表中移除
                const matchingModPath = selectedModPaths.find(async (modPath) => 
                    await basename(modPath) === fileName
                );
                if (matchingModPath) {
                    const index = selectedModPathsToCreate.indexOf(matchingModPath);
                    if (index > -1) {
                        selectedModPathsToCreate.splice(index, 1);
                    }
                }
                return;
            }
            // 3. 如果该文件名不在 allModNames 中存在，则该文件并不受管理
            if (!allModNames.includes(fileName)) {
                return;
            }
            folderNeedRemove.push(filePath);
        })
    );

    // debug
    console.log(`Removing folders: ${folderNeedRemove.join(', ')}`);
    // 删除不需要的文件夹
    await Promise.all(
        folderNeedRemove.map(async (folderPath) => {
            try {
                await globalServiceContainer.fs.deleteDirectory(folderPath);
            } catch (error) {
                console.error(`Failed to remove folder ${folderPath}`, error);
            }
        })
    );

    // 创建软链接
    console.log(`Creating symlinks for: ${selectedModPathsToCreate.join(', ')}`);
    await createSymlinkBatch(selectedModPathsToCreate, distFolder);
}

async function applyModTraditionally(allMods: ModInfo[], selectedMods: ModInfo[], distFolder: string): Promise<void> {
    const allModPaths = allMods.map(mod => mod.metadata.location.value);
    const selectedModIds = selectedMods.map(mod => mod.metadata.id.value);
    // 如果使用传统方式，那么需要确保distFolder和 allModPaths 位于的同一目录下
    if (!(await dirname(allModPaths[0]) === distFolder)) {
        console.warn(`mods Must in the distFolder: ${distFolder}`);
        $t_snack('applyMods.traditionalError_notSameDir', "error");
        return;
    }
    // 且需要保证 “保持mod名称和文件夹名称一致”，因为这种方式是通过在文件夹名称前添加 disable_ 前缀来禁用Mod的
    if (SubConfig.ifKeepModNameAsModFolderName.value) {
        console.warn("Using traditional apply method, but keepModNameAsModFolderName is enabled. This may cause issues.");
        $t_snack('applyMods.traditionalError_keepModNameAsFolderName', "error");
        return;
    }

    // 首先, 检查文件夹是否存在
    if (!await globalServiceContainer.fs.checkDirectoryExists(distFolder)) {
        console.warn(`Directory does not exist: ${distFolder}`);
        return;
    }

    const folderNeedDisable: string[] = [];
    const folderNeedEnable: string[] = [];
    
    // 遍历所有mods，根据是否在selectedMods中来决定启用或禁用
    await Promise.all(
        allMods.map(async (mod) => {
            const modPath = mod.metadata.location.value;
            const isSelected = selectedModIds.includes(mod.metadata.id.value);
            
            // 1. 如果mod路径不存在，跳过
            if (!await globalServiceContainer.fs.checkDirectoryExists(modPath)) {
                return;
            }
            
            const fileName = await basename(modPath);
            const isCurrentlyDisabled = fileName.startsWith('disable_');
            
            // debug
            console.log(`Processing mod: ${mod.metadata.name.value} (ID: ${mod.metadata.id.value}), folder: ${fileName}, disabled: ${isCurrentlyDisabled}, selected: ${isSelected}`);
            
            // 2. 如果mod当前被禁用，但是在选中列表中，则需要启用
            if (isCurrentlyDisabled && isSelected) {
                folderNeedEnable.push(modPath);
                return;
            }
            
            // 3. 如果mod当前未被禁用，但是不在选中列表中，则需要禁用
            if (!isCurrentlyDisabled && !isSelected) {
                folderNeedDisable.push(modPath);
                return;
            }
        })
    );

    // debug
    console.log(`Disabling folders: ${folderNeedDisable.join(', ')}`);
    console.log(`Enabling folders: ${folderNeedEnable.join(', ')}`);


    // 禁用文件夹
    await Promise.all(
        allMods.map(async (mod) => {
            if (folderNeedDisable.includes(mod.metadata.location.value)) {
                // 将mod的文件夹名称前添加 disable_ 前缀
                const folderPath = mod.metadata.location.value;
                const newFolderName = `disable_${await basename(folderPath)}`;
                try {
                    console.log(`Disabling mod folder: ${folderPath} to ${newFolderName}`);
                    await mod.fileOperator.changeFolderName(newFolderName);
                } catch (error) {
                    console.error(`Failed to disable mod folder ${folderPath}`, error);
                }
            }
        })
    );

    // 启用文件夹
    await Promise.all(
        allMods.map(async (mod) => {
            if (folderNeedEnable.includes(mod.metadata.location.value)) {
                // 将mod的文件夹名称前添加 disable_ 前缀
                const folderPath = mod.metadata.location.value;
                const baseName = await basename(folderPath);
                let newFolderName = baseName;
                while (newFolderName.startsWith('disable_')) {
                    // 去掉 disable_ 前缀
                    newFolderName = newFolderName.slice(8);
                }
                try {
                    console.log(`Enabled mod folder: ${folderPath} to ${newFolderName}`);
                    await mod.fileOperator.changeFolderName(newFolderName);
                } catch (error) {
                    console.error(`Failed to enable mod folder ${folderPath}`, error);
                }
            }
        })
    );
}
