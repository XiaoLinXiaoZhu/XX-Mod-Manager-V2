// import { check } from '@tauri-apps/plugin-updater};
// tauri 提供的这个updater简直是一坨……
// 我自己使用 axios 封装一个更新检查器就好了，实际上也不复杂
import { exit } from '@tauri-apps/plugin-process';
import { invoke } from "@tauri-apps/api/core";
import { Command } from '@tauri-apps/plugin-shell';
import { getVersion } from '@tauri-apps/api/app';

import axios from 'axios';

type UpdateCheckerOptions = {
    urls: string[];
    currentVersion: string;
    timeout?: number;
};

// 定义下载进度事件类型
type DownloadProgressEvent = {
    event: 'Started' | 'Progress' | 'Finished';
    data: {
        contentLength?: number;
        url?: string;
        loaded?: number;
        total?: number;
        chunkLength?: number;
    };
};

type UpdateInfo = {
    version: string;
    notes: string;
    pub_date: string;
    platforms: {
        [key: string]: {
            signature: string;
            url: string;
        };
    };
};

type InternalUpdateInfo = UpdateInfo & {
    downloadedFilePath: string | null;
    downloadedFileName: string | null;
    downloadAndInstall: (onProgress: (event: DownloadProgressEvent) => void) => Promise<void>;
    downloadOnly: (onProgress: (event: DownloadProgressEvent) => void) => Promise<string>;
    install: () => Promise<void>;
};

class UpdateChecker {
    updateCheckerOptions: UpdateCheckerOptions;

    private updateInfo: InternalUpdateInfo | null = null;

    constructor(options: UpdateCheckerOptions) {
        this.updateCheckerOptions = {
            urls: options.urls,
            currentVersion: options.currentVersion,
            timeout: options.timeout || 30000,
        }
    }

    isNewerVersion(newVersion: string, currentVersion: string): boolean {
        const newVersionParts = newVersion.split('.').map(Number);
        const currentVersionParts = currentVersion.split('.').map(Number);

        for (let i = 0; i < Math.max(newVersionParts.length, currentVersionParts.length); i++) {
            const newPart = newVersionParts[i] || 0;
            const currentPart = currentVersionParts[i] || 0;

            if (newPart > currentPart) {
                return true;
            } else if (newPart < currentPart) {
                return false;
            }
        }

        return false;
    }

    async check(): Promise<InternalUpdateInfo | null> {
        const { urls, currentVersion, timeout } = this.updateCheckerOptions;

        for (const url of urls) {
            try {
                const response = await axios.get(url, { timeout }).then(res => res.data).catch(error => {
                    throw new Error(`Request failed: ${error.message}`);
                });

                const updateInfo = this.formatUpdateInfo(response);

                if (updateInfo) {
                    if (this.isNewerVersion(updateInfo.version, currentVersion)) {
                        this.updateInfo = updateInfo;
                        return updateInfo;
                    } else {
                        // try to check the next url
                        console.log(`Version ${updateInfo.version} is not newer than current version ${currentVersion}.`);
                    }
                } else {
                    console.error('Invalid response format from url:', url, response);
                }
            } catch (error) {
                console.warn(`Error checking update from ${url}:`, error);
                // Continue to the next URL
            }
        }

        console.error('No valid update found after checking all URLs.');
        return null;
    }

    formatUpdateInfo(data: any): InternalUpdateInfo | null {
        if (!data) return null;

        const { version, notes, pub_date, platforms } = data;

        if (!version || !notes || !pub_date || !platforms) return null;

        const result: InternalUpdateInfo = {
            version,
            notes,
            pub_date,
            platforms,
            downloadedFilePath: null,
            downloadedFileName: null,
            downloadAndInstall: this.downloadAndInstall.bind(this),
            downloadOnly: async (onProgress: (event: DownloadProgressEvent) => void): Promise<string> => {
                const filePath = await this.downloadOnly(onProgress);
                if (!this.updateInfo) {return filePath;}
                this.updateInfo.downloadedFilePath = filePath;
                this.updateInfo.downloadedFileName = filePath.split('/').pop() || null;
                return filePath;
            },
            install: () => this.installUpdate(this.updateInfo?.downloadedFilePath || ''),
        };

        return result;
    }

    async getPlatform(): Promise<string> {
        // 获取当前平台，这里假设为 windows-x86_64，也可以通过 Tauri API 获取
        const platform = 'windows-x86_64'; // 可以根据需要动态确定
        return platform;
    }

    async downloadOnly(onProgress: (event: DownloadProgressEvent) => void): Promise<string> {
        // 获取当前平台，这里假设为 windows-x86_64，也可以通过 Tauri API 获取
        const platform = await this.getPlatform();

        // 使用已保存的更新信息或重新获取
        const updateInfo = this.updateInfo || await this.check();
        if (!updateInfo || !updateInfo.platforms || !updateInfo.platforms[platform] || !updateInfo.platforms[platform].url) {
            throw new Error(`No valid download URL found for platform ${platform}`);
        }

        const { url: mainUrl } = updateInfo.platforms[platform];
        // 构建备用链接列表，可以添加其他备用下载地址
        const downloadUrls = [mainUrl];

        let lastError: Error | null = null;
        let downloadedData: ArrayBuffer | null = null;

        // 依次尝试每个下载链接，直到成功或全部失败
        for (const url of downloadUrls) {
            try {
                downloadedData = await this.downloadFile(url, onProgress);
                // 下载成功，退出循环
                break;
            } catch (error) {
                console.warn(`Failed to download from ${url}:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                // 继续尝试下一个 URL
            }
        }

        // 如果下载成功，写入更新,然后执行安装
        if (downloadedData) {
            const filePath = await this.writeUpdate(downloadedData);
            // 执行安装程序
            return filePath;
        } else {
            // 如果所有 URL 都失败了，抛出最后一个错误
            throw new Error(`Failed to download update after trying all URLs: ${lastError?.message || 'Unknown error'}`);
        }
    }

    async downloadAndInstall(onProgress: (event: DownloadProgressEvent) => void): Promise<void> {
        // 获取当前平台，这里假设为 windows-x86_64，也可以通过 Tauri API 获取
        const platform = await this.getPlatform();

        // 使用已保存的更新信息或重新获取
        const updateInfo = this.updateInfo || await this.check();
        if (!updateInfo || !updateInfo.platforms || !updateInfo.platforms[platform] || !updateInfo.platforms[platform].url) {
            throw new Error(`No valid download URL found for platform ${platform}`);
        }

        const { url: mainUrl } = updateInfo.platforms[platform];
        // 构建备用链接列表，可以添加其他备用下载地址
        const downloadUrls = [mainUrl];

        let lastError: Error | null = null;
        let downloadedData: ArrayBuffer | null = null;

        // 依次尝试每个下载链接，直到成功或全部失败
        for (const url of downloadUrls) {
            try {
                downloadedData = await this.downloadFile(url, onProgress);
                // 下载成功，退出循环
                break;
            } catch (error) {
                console.warn(`Failed to download from ${url}:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                // 继续尝试下一个 URL
            }
        }

        // 如果下载成功，写入更新,然后执行安装
        if (downloadedData) {
            const filePath = await this.writeUpdate(downloadedData);
            // 执行安装程序
            await this.installUpdate(filePath);
        } else {
            // 如果所有 URL 都失败了，抛出最后一个错误
            throw new Error(`Failed to download update after trying all URLs: ${lastError?.message || 'Unknown error'}`);
        }
    }
    private async downloadFile(url: string, onProgress: (event: DownloadProgressEvent) => void): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>(async (resolve, reject) => {
            try {
                // 通知开始下载
                onProgress({
                    event: 'Started',
                    data: {
                        contentLength: 0,
                        url
                    }
                });

                // 直接使用 Rust 函数下载文件，绕过所有 CORS 限制
                try {
                    console.log(`Downloading from ${url} using Rust backend...`);
                    // 确保下载目录存在
                    console.log(`Creating download directory...`);
                    await invoke('create_directory', {
                        pathStr: './updater'
                    }).catch(e => console.warn('Unable to create directory (可能目录已存在):', e));
                    // 使用临时文件路径
                    const timestamp = new Date().getTime();
                    const tempFilePath = `./updater/temp_${timestamp}.exe`;

                    console.log(`Starting download to ${tempFilePath}...`);
                    // 方法 1：直接下载到文件（推荐，一步到位）
                    try {
                        await invoke('download_file_to_path', {
                            url,
                            savePathStr: tempFilePath,
                            timeoutMs: this.updateCheckerOptions.timeout || 30000
                        });

                        console.log(`Successfully downloaded file to ${tempFilePath}`);                        // 读取下载的文件内容
                        const fileData = await invoke<number[]>('read_binary_file', {
                            pathStr: tempFilePath,
                            ifCreate: false
                        });

                        // 转换为 Uint8Array
                        const data = new Uint8Array(fileData);
                        // 删除临时文件（可选）
                        await invoke('delete_file', {
                            pathStr: tempFilePath
                        }).catch(e => console.warn('Unable to delete temp file:', e));

                        // 报告下载进度和完成
                        onProgress({
                            event: 'Progress',
                            data: {
                                loaded: data.byteLength,
                                total: data.byteLength,
                                chunkLength: data.byteLength
                            }
                        });

                        onProgress({
                            event: 'Finished',
                            data: {
                                url
                            }
                        });

                        resolve(data.buffer);
                    } catch (downloadError) {
                        console.warn(`Direct file download failed: ${downloadError}`);

                        // 方法 2：如果直接下载到文件失败，尝试下载到内存
                        console.log(`Trying to download to memory...`); const binaryData = await invoke<number[]>('download_file_to_binary', {
                            url,
                            timeoutMs: this.updateCheckerOptions.timeout || 30000
                        });

                        const data = new Uint8Array(binaryData);

                        // 报告下载进度和完成
                        onProgress({
                            event: 'Progress',
                            data: {
                                loaded: data.byteLength,
                                total: data.byteLength,
                                chunkLength: data.byteLength
                            }
                        });

                        onProgress({
                            event: 'Finished',
                            data: {
                                url
                            }
                        });

                        resolve(data.buffer);
                    }
                } catch (error) {
                    console.error(`Rust download failed: ${error instanceof Error ? error.message : String(error)}`);
                    reject(new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`));
                }
            } catch (error) {
                reject(new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
    }

    //执行安装程序
    public async installUpdate(downloadedPath: string): Promise<void> {
        try {
            // 获取文件的完整路径
            const fullPath = await invoke<string>('get_full_path', {
                pathStr: downloadedPath
            });

            console.log(`Starting installer from: ${fullPath}`);

            try {
                // 使用Command执行安装程序
                // 在Windows上使用更简单的PowerShell调用方式
                const command = Command.create('exec-powershell', [`& "${fullPath}"`]);

                // 执行命令
                await command.execute();

                console.log('Installer started successfully');


            } catch (execError) {
                // 如果执行安装程序失败，尝试使用 tauri 后端的 open_program 来执行
                console.error('Error executing installer with Command:', execError);
                console.log('Trying to execute installer with Tauri backend...');
                try {
                    invoke('open_program', {
                        pathStr: fullPath,
                        args: '',
                        hide: false,
                        uac: true,
                    }).then(() => {
                        console.log('Installer started successfully with Tauri backend');
                    }).catch((tauriError) => {
                        console.error('Error executing installer with Tauri backend:', tauriError);
                        throw tauriError;
                    });
                    console.log('Installer started successfully with Tauri backend');
                } catch (tauriError) {
                    console.error('Error executing installer with Tauri backend:', tauriError);
                    throw tauriError;
                }
            }

            // 5. 给安装程序一点时间启动
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 6. 关闭当前应用程序
            console.log('Exiting application...');
            await exit(0); // 使用 exit(0) 而不是 relaunch() 因为我们是要退出并安装新版本
        } catch (execError) {
            console.error('Error executing installer:', execError);
            throw execError;
        }
    }

    private async writeUpdate(downloadedData: ArrayBuffer): Promise<string> {
        // 实现安装逻辑
        // 保存下载的更新文件到 updater 文件夹，然后执行安装
        try {
            console.log('Writing update to file...');

            // 1. 将 ArrayBuffer 转换为 Uint8Array
            const uint8Array = new Uint8Array(downloadedData);

            // 2. 生成文件名，使用版本号和时间戳
            const updateInfo = this.updateInfo;
            const version = updateInfo ? updateInfo.version : 'unknown';
            const timestamp = new Date().getTime();
            const fileName = `./updater/xxmm_update_${version}_${timestamp}.exe`;
            // 3. 保存下载的更新文件            
            await invoke('write_binary_file', {
                pathStr: fileName,
                data: uint8Array,
                ifCreate: true
            });

            console.log(`Update file saved to: ${fileName}`);

            // 4. 输出安装文件路径
            return fileName;
        } catch (error) {
            console.error('Error writing update file:', error);
            throw new Error(`Failed to write update file: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}


export async function checkForUpdates(
    checkIfDownload?: (update: InternalUpdateInfo) => Promise<boolean>,
    checkIfInstall?: (update: InternalUpdateInfo) => Promise<boolean>
): Promise<void> {
    alert('checking for updates');
    const updateChecker = new UpdateChecker({
        urls: [
            "https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/updater/config.json",
            'https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/update.json',
        ],
        currentVersion: await getVersion(),
        timeout: 30000,
    });
    const update = await updateChecker.check();
    if (update) {
        console.log(
            `found update ${update.version} from ${update.pub_date} with notes ${update.notes}`
        );
        alert(
            `found update ${update.version} from ${update.pub_date} with notes ${update.notes}`
        );
        // 询问用户是否下载更新
        // 这里可以使用一个简单的 confirm 对话框，或者使用更复杂的 UI
        // 这里使用 confirm 对话框
        const download = checkIfDownload
            ? await checkIfDownload(update)
            : confirm('Do you want to download the update?');
        if (!download) {
            return;
        }
        let downloaded = 0;
        let contentLength = 0;

        const filePath = await update.downloadOnly((event) => {
            switch (event.event) {
                case 'Started':
                    contentLength = event.data.contentLength || 0;
                    console.log(`started downloading ${event.data.contentLength} bytes`);
                    break;
                case 'Progress':
                    downloaded += event.data.chunkLength || 0;
                    console.log(`downloaded ${downloaded} from ${contentLength}`);
                    break;
                case 'Finished':
                    console.log('download finished');
                    break;
            }
        });
        console.log(`downloaded file to ${filePath}`);

        // 询问用户是否安装更新
        const install = checkIfInstall
            ? await checkIfInstall(update)
            : confirm('Do you want to install the update?');
            
        if (install) {
            await installUpdate(filePath);
            console.log('update installed');
            alert('update installed');
        } else {
            console.log(`cancelled install`);
            alert('cancelled install');
        }
    }
}

export async function installUpdate(filePath: string): Promise<void> {
    const updateChecker = new UpdateChecker({
        urls: [
            "https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/updater/config.json",
            'https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/update.json',
        ],
        currentVersion: await getVersion(),
        timeout: 30000,
    });

    updateChecker.installUpdate(filePath).then(() => {
        console.log('update installed');
        alert('update installed');
    }).catch((error) => {
        console.error('Error installing update:', error);
        alert('Error installing update');
    });
}
