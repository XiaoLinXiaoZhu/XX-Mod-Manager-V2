// repo 只会保存三个内容：
// uid - 作为仓库的唯一标识符
// location - 仓库的存储位置
// 其他用于展示的的信息

import { isAbsolute, join,appDataDir } from "@tauri-apps/api/path";
import { useGlobalConfig } from "../core/GlobalConfigLoader";
import type { StorageValue } from "../../core/plugin/Storge";
import { createDirectory, isDirectoryExists } from "../../scripts/lib/FileHelper";

export type repo = {
    /**
     * @desc 仓库的唯一标识符
     * @example 'repo-12345'
     */
    uid: string;
    /**
     * @desc 仓库的存储位置
     * @example '/path/to/repo'
     * @note 这个位置是一个绝对路径，指向仓库的根目录
     */
    configLocation: string; 
    name?: string;
    description?: string;
    cover?: string;
    createdAt?: string;
    updatedAt?: string;
};

export let repos: StorageValue<repo[]> | null = null;
export const getRepos = async (): Promise<repo[]> => {
    // 从 GlobalStorage 中获取仓库列表
    repos = useGlobalConfig("repos",[] as repo[]);

    // 使用checkRepo函数检查每个仓库的配置
    const validRepos: repo[] = [];
    for (const repoItem of repos.value) {
        const isValid = await checkRepo(repoItem);
        if (isValid) {
            validRepos.push(repoItem);
        } else {
            console.warn('Invalid repo configuration, skipping:', repoItem);
        }
    }

    // 过滤掉无效的仓库
    repos.value = validRepos;

    // debug
    console.log('获取到的仓库列表:', repos.value);
    return repos.value;
};

const checkRepo = async (repo: repo): Promise<boolean> => {
    let flag = true;
    // 对于每个repo，确保configLocation不为空，且是一个绝对路径
    if (!repo.configLocation || repo.configLocation.trim() === '') {
        console.warn('Repo configLocation is not set:', repo);
        flag = false;
    }
    if (!isAbsolute(repo.configLocation)) {
        console.warn('Repo configLocation is not absolute:', repo);
        flag = false;
    }
    if (!await isDirectoryExists(repo.configLocation)) {
        // 确保configLocation存在，如果不存在则尝试创建
        console.warn('Repo configLocation does not exist, creating:', repo.configLocation);
        try {
            await createDirectory(repo.configLocation);
        } catch (error) {
            console.error('Error creating repo directory:', error);
            flag = false; // 如果创建失败，设置标志为false
        }
    }

    // 确保每个repo的uid是唯一的
    if (!repo.uid || repo.uid.trim() === '') {
        console.warn('Repo uid is not set:', repo);
        flag = false;
    }
    if (repos) {
        const existingRepo = repos.value.find(r => r.uid === repo.uid);
        if (existingRepo && existingRepo !== repo) {
            console.warn(`Duplicate repo uid found, skipping: ${repo.uid}`);
            flag = false; // 如果uid重复，则设置标志为false
        }
    }

    return flag;
};

