// repo 只会保存三个内容：
// uid - 作为仓库的唯一标识符
// location - 仓库的存储位置
// 其他用于展示的的信息

import { isAbsolute, join,appDataDir } from "@tauri-apps/api/path";
import { useGlobalConfig } from "../core/GlobalConfigLoader";
import type { StorageValue } from "./Storge";
import { createDirectory, isDirectoryExists } from "./FileHelper";

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
    location: string; 
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
    // 对于每个repo，确保location不为空，且是一个绝对路径
    const _repos = await Promise.all(repos.value.map(async (repo) => {
        if (!repo.location || repo.location.trim() === '' || !isAbsolute(repo.location)) {
            console.warn('Repo location is not set or not absolute:', repo);
            repo.location = await join(await appDataDir(), `repos/${repo.uid}`);
        }
        if (!await isDirectoryExists(repo.location)) {
            // 确定location是否存在，如果不存在则尝试创建
            console.warn('Repo location does not exist, creating:', repo.location);
            try {
                await createDirectory(repo.location);
            } catch (error) {
                console.error('Error creating repo directory:', error);
                return null; // 如果创建失败，返回null
            }
        }
        return repo;
    }));
    const filteredRepos = _repos.filter(repo => repo !== null) as repo[];
    repos.set(filteredRepos);
    // debug
    console.log('获取到的仓库列表:', filteredRepos);
    return repos.getRef().value;
};

