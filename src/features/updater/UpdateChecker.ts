// import { check } from '@tauri-apps/plugin-updater};
// tauri 提供的这个updater简直是一坨……
// 我自己使用 axios 封装一个更新检查器就好了，实际上也不复杂
import { exit } from '@tauri-apps/plugin-process';
import { invoke } from "@tauri-apps/api/core";
import { Command } from '@tauri-apps/plugin-shell';
import { getVersion } from '@tauri-apps/api/app';

import axios from 'axios';
import { downloadFile, type downloadOptions } from '@/shared/services/DownloadFile';

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
    }    async check(): Promise<InternalUpdateInfo | null> {
        const { urls, currentVersion, timeout } = this.updateCheckerOptions;
        
        let lastError: Error | null = null;
        let foundVersionButNotNewer = false;

        for (const url of urls) {
            try {
                const response = await axios.get(url, { timeout }).then(res => res.data).catch(error => {
                    throw new Error(`请求失败: ${error.message}`);
                });

                const updateInfo = this.formatUpdateInfo(response);

                if (updateInfo) {
                    if (this.isNewerVersion(updateInfo.version, currentVersion)) {
                        this.updateInfo = updateInfo;
                        return updateInfo;
                    } else {
                        // 找到了版本信息，但不是较新的版本
                        foundVersionButNotNewer = true;
                        console.log(`版本 ${updateInfo.version} 不比当前版本 ${currentVersion} 更新。`);
                    }
                } else {
                    console.error('从URL获取到的响应格式无效:', url, response);
                    lastError = new Error(`从 ${url} 获取的响应格式无效`);
                }
            } catch (error) {
                console.warn(`从 ${url} 检查更新时出错:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
                // 继续尝试下一个URL
            }
        }

        // 如果找到了版本信息，但不是较新的版本，则不是错误
        if (foundVersionButNotNewer) {
            console.log('当前已是最新版本。');
            return null;
        }

        // 所有URL都检查完了，但没有找到有效的更新
        if (lastError) {
            console.error('检查所有URL后未找到有效更新。', lastError);
            throw lastError; // 抛出错误，让调用者处理
        } else {
            console.error('检查所有URL后未找到有效更新。');
            throw new Error('无法获取更新信息');
        }
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
                if (!this.updateInfo) { return filePath; }
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
    }    async downloadOnly(onProgress: (event: DownloadProgressEvent) => void): Promise<string> {
        // 获取当前平台，这里假设为 windows-x86_64，也可以通过 Tauri API 获取
        const platform = await this.getPlatform();

        // 使用已保存的更新信息或重新获取
        const updateInfo = this.updateInfo || await this.check();
        if (!updateInfo || !updateInfo.platforms || !updateInfo.platforms[platform] || !updateInfo.platforms[platform].url) {
            throw new Error(`未找到适用于平台 ${platform} 的有效下载链接`);
        }

        const { url: mainUrl } = updateInfo.platforms[platform];
        // 构建备用链接列表，可以添加其他备用下载地址
        const downloadUrls = [mainUrl];

        // 生成文件名，使用版本号和时间戳
        const version = updateInfo ? updateInfo.version : 'unknown';
        const timestamp = new Date().getTime();
        const fileName = `./updater/xxmm_update_${version}_${timestamp}.exe`;

        let lastError: Error | null = null;
        let isSuccess = false;

        // 依次尝试每个下载链接，直到成功或全部失败
        for (const url of downloadUrls) {
            console.log(`尝试从 ${url} 下载更新...`);

            const downloadOptions: downloadOptions = {
                url,
                targetPath: fileName,
                onProgress: onProgress as any,
                retryCount: 3,
                retryDelay: 1000,
                onError: (error) => {
                    console.error(`从 ${url} 下载时出错:`, error);
                    lastError = error instanceof Error ? error : new Error(String(error));
                },
                onComplete: () => {
                    console.log(`从 ${url} 下载完成`);
                    isSuccess = true;
                }
            };

            try {
                await downloadFile(downloadOptions);
                
                // 如果下载成功，退出循环
                if (isSuccess) {
                    break;
                } else {
                    console.warn(`从 ${url} 下载失败:`, lastError);
                }
            } catch (error) {
                console.error(`从 ${url} 下载过程中发生异常:`, error);
                lastError = error instanceof Error ? error : new Error(String(error));
            }
        }

        // 如果下载成功，返回文件路径
        if (isSuccess) {
            // 更新内部状态，记录下载的文件路径和名称
            if (this.updateInfo) {
                this.updateInfo.downloadedFilePath = fileName;
                this.updateInfo.downloadedFileName = fileName.split('/').pop() || null;
            }
            return fileName;
        } else {
            // 如果所有 URL 都失败了，抛出最后一个错误
            throw new Error(`尝试所有下载链接后下载更新失败: ${lastError?.message || '未知错误'}`);
        }
    }

    async downloadAndInstall(onProgress: (event: DownloadProgressEvent) => void): Promise<void> {
        const filePath = await this.downloadOnly(onProgress);

        // 如果下载成功，写入更新,然后执行安装
        if (filePath) {
            // 执行安装程序
            await this.installUpdate(filePath);
        } else {
            console.error('Failed to download update');
            throw new Error('Failed to download update');
        }
    }

    //执行安装程序
    private async installUpdate(downloadedPath: string): Promise<void> {
        if (!downloadedPath) {
            throw new Error('安装路径无效');
        }
        
        try {
            // 获取文件的完整路径
            const fullPath = await invoke<string>('get_full_path', {
                pathStr: downloadedPath
            }).catch(error => {
                console.error('获取完整路径失败:', error);
                throw new Error(`无法获取安装文件的完整路径: ${error}`);
            });

            console.log(`正在启动安装程序: ${fullPath}`);

            let installerStarted = false;
            
            // 首先尝试使用Command执行安装程序
            try {
                // 在Windows上使用PowerShell调用方式
                const command = Command.create('exec-powershell', [`& "${fullPath}"`]);

                // 执行命令
                await command.execute();
                console.log('通过PowerShell成功启动安装程序');
                installerStarted = true;
            } catch (execError) {
                // 记录错误但不立即抛出，因为我们会尝试备用方法
                console.error('使用Command执行安装程序失败:', execError);
                console.log('尝试使用Tauri后端执行安装程序...');
            }
            
            // 如果第一种方法失败，尝试使用tauri后端的open_program来执行
            if (!installerStarted) {
                try {
                    await invoke('open_program', {
                        pathStr: fullPath,
                        args: '',
                        hide: false,
                        uac: true,
                    });
                    console.log('通过Tauri后端成功启动安装程序');
                    installerStarted = true;
                } catch (tauriError) {
                    console.error('使用Tauri后端执行安装程序失败:', tauriError);
                    throw new Error(`无法启动安装程序: ${tauriError}`);
                }
            }
            
            if (!installerStarted) {
                throw new Error('无法启动安装程序，所有尝试均失败');
            }

            // 给安装程序一点时间启动
            console.log('等待安装程序启动...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 关闭当前应用程序
            console.log('正在退出应用程序...');
            try {
                await exit(0); // 使用 exit(0) 而不是 relaunch() 因为我们是要退出并安装新版本
            } catch (exitError) {
                console.error('应用程序退出失败:', exitError);
                throw new Error(`应用程序退出失败: ${exitError}`);
            }
        } catch (execError) {
            console.error('执行安装程序时发生错误:', execError);
            throw execError instanceof Error ? execError : new Error(String(execError));
        }
    }
}

export type checkForUpdatesOptions = {
    // 开始检查更新时的回调
    onStartGetNewVersion?: () => Promise<void>;
    
    // 网络错误，无法获取更新信息时的回调
    onNetworkError?: (error: Error) => Promise<void>;
    
    // 当前已是最新版本的回调
    onAlreadyLatestVersion?: () => Promise<void>;
    
    // 获取到新版本的回调
    onGetNewVersion?: (update: InternalUpdateInfo) => Promise<void>;
    
    // 询问是否下载新版本的回调
    checkIfDownload?: (update: InternalUpdateInfo) => Promise<boolean>;
    
    // 下载进度回调
    onDownloadProgress?: (downloaded: number, total: number) => Promise<void>;
    
    // 下载错误回调
    onDownloadError?: (error: Error) => Promise<void>;
    
    // 下载完成回调
    onDownloadComplete?: (filePath: string) => Promise<void>;
    
    // 询问是否安装新版本的回调
    checkIfInstall?: (update: InternalUpdateInfo) => Promise<boolean>;
    
    // 安装错误回调
    onInstallError?: (error: Error) => Promise<void>;
};
export async function checkForUpdates(
    options?: checkForUpdatesOptions
): Promise<void> {
    const { 
        onStartGetNewVersion = async () => { console.log('正在检查更新...'); },
        onNetworkError = async (error: Error) => { console.error('网络错误:', error); },
        onAlreadyLatestVersion = async () => { console.log('当前已是最新版本'); alert('当前已是最新版本'); },
        onGetNewVersion = async (update: InternalUpdateInfo) => { console.log('发现新版本:', update); alert(`发现新版本: ${update.version}\n发布于: ${update.pub_date}\n更新说明: ${update.notes}`); },
        checkIfDownload = async (update: InternalUpdateInfo) => { return confirm(`是否要下载新版本 ${update.version}？`); },
        onDownloadProgress = async (downloaded: number, total: number) => { console.log(`下载进度: ${downloaded} / ${total}`); },
        onDownloadError = async (error: Error) => { console.error('下载错误:', error); },
        onDownloadComplete = async (filePath: string) => { console.log('下载完成:', filePath); },
        checkIfInstall = async (update: InternalUpdateInfo) => { return confirm(`是否要安装新版本 ${update.version}？`); },
        onInstallError = async (error: Error) => { console.error('安装错误:', error); }
    } = options || {};

    await onStartGetNewVersion();
    
    const updateChecker = new UpdateChecker({
        urls: [
            "https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/updater/config.json",
            'https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/update.json',
        ],
        currentVersion: await getVersion(),
        timeout: 30000,
    });
    
    try {
        // 2. 检查更新
        const update = await updateChecker.check();
        
        // 3. 处理检查结果
        if (!update) {
            // 当前已是最新版本
            await onAlreadyLatestVersion();
            return;
        }
        
        // 4. 发现新版本
        await onGetNewVersion(update);

        // 5. 询问是否下载新版本
        const download = await checkIfDownload(update);
        if (!download) {
            return;
        }
        
        // 6. 下载新版本
        let downloaded = 0;
        let contentLength = 0;
        
        try {
            const filePath = await update.downloadOnly((event) => {
                switch (event.event) {
                    case 'Started':
                        contentLength = event.data.contentLength || 0;
                        console.log(`开始下载，总大小 ${event.data.contentLength} 字节`);
                        break;
                    case 'Progress':
                        downloaded += event.data.chunkLength || 0;
                        console.log(`已下载 ${downloaded} / ${contentLength}`);
                        
                        // 调用下载进度回调
                        if (onDownloadProgress) {
                            onDownloadProgress(downloaded, contentLength).catch(err => {
                                console.error('下载进度回调错误:', err);
                            });
                        }
                        break;
                    case 'Finished':
                        console.log('下载完成');
                        break;
                }
            });
            
            console.log(`文件已下载到: ${filePath}`);
            
            // 7. 下载完成回调
            await onDownloadComplete(filePath);
            
            // 8. 询问是否安装新版本
            const install = await checkIfInstall(update);

            if (install) {
                try {
                    // 9. 安装新版本
                    await update.install();
                    console.log('更新已安装');
                    alert('更新已安装');
                } catch (installError) {
                    // 10. 处理安装错误
                    console.error('安装更新时发生错误:', installError);
                    await onInstallError(installError instanceof Error ? installError : new Error(String(installError)));
                }
            } else {
                console.log(`取消安装`);
                // 打开文件夹展示下载的文件
                invoke('show_directory_in_explorer', {
                    pathStr: filePath,
                    ifCreate: true,
                }).then(() => {
                    console.log('已打开目录');
                }).catch((error) => {
                    console.error('打开目录出错:', error);
                    alert('打开目录出错');
                });
                console.log('未安装更新');
            }
        } catch (downloadError) {
            // 处理下载错误
            console.error('下载更新时发生错误:', downloadError);
            await onDownloadError(downloadError instanceof Error ? downloadError : new Error(String(downloadError)));
        }
    } catch (networkError) {
        // 处理网络错误
        console.error('检查更新时发生网络错误:', networkError);
        await onNetworkError(networkError instanceof Error ? networkError : new Error(String(networkError)));
    }
}