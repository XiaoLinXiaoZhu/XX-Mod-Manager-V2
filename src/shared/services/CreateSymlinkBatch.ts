import { globalServiceContainer } from "@/shared/services/ServiceContainer";
import { basename } from "@tauri-apps/api/path";

export async function createSymlinkBatch(
    fromFiles: string[],
    toFolder: string,
) {
    await Promise.all(
        fromFiles.map(async (fromFile) => {
            try {
                const fileName = await basename(fromFile);
                // 如果文件名为空，跳过
                if (!fileName) {
                    return;
                }
                const toFile = `${toFolder}/${fileName}`;
                // 如果目标文件已存在，跳过
                if (await globalServiceContainer.fs.checkDirectoryExists(toFile)) {
                    console.warn(`Symlink target already exists: ${toFile}`);
                    return;
                }
                await globalServiceContainer.fs.createSymlink(fromFile, toFile);
            } catch (error) {
                console.error(`Failed to create symlink from ${fromFile} to ${toFolder}`, error);
            }
        })
    );
}