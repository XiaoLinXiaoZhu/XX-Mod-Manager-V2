/**
 * 符号链接工具函数
 * 提供批量符号链接创建功能
 */

import { basename } from "@tauri-apps/api/path";
import type { ExtendedFileSystem } from '../file-system/types';
import type { SymlinkBatchOptions } from './types';

/**
 * 批量创建符号链接
 * @param fileSystem 文件系统实例
 * @param fromFiles 源文件路径数组
 * @param toFolder 目标文件夹路径
 * @param options 选项配置
 */
export async function createSymlinkBatch(
    fileSystem: ExtendedFileSystem,
    fromFiles: string[],
    toFolder: string,
    options: SymlinkBatchOptions = {}
): Promise<void> {
    const { skipExisting = true, createTargetDir = true } = options;

    // 确保目标目录存在
    if (createTargetDir) {
        await fileSystem.createDirectory(toFolder);
    }

    await Promise.all(
        fromFiles.map(async (fromFile) => {
            try {
                const fileName = await basename(fromFile);
                // 如果文件名为空，跳过
                if (!fileName) {
                    return;
                }
                const toFile = `${toFolder}/${fileName}`;
                
                // 如果目标文件已存在，根据选项决定是否跳过
                if (skipExisting && await fileSystem.checkDirectoryExists(toFile)) {
                    console.warn(`Symlink target already exists: ${toFile}`);
                    return;
                }
                
                await fileSystem.createSymlink(fromFile, toFile);
            } catch (error) {
                console.error(`Failed to create symlink from ${fromFile} to ${toFolder}`, error);
            }
        })
    );
}
