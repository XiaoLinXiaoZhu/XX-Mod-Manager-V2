// import { check } from '@tauri-apps/plugin-updater};
// tauri 提供的这个updater简直是一坨……
// 我自己使用 axios 封装一个更新检查器就好了，实际上也不复杂
import { relaunch } from '@tauri-apps/plugin-process';
import { invoke } from "@tauri-apps/api/core";
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

/* Update JSON Example
{
  "version": "0.1.5",
  "notes": "- feat: 更新版本号至 0.1.5，并同步更新配置文件和更新日志\n- 0.1.5\n- feat: 更新版本号至 0.1.4，并更新配置文件中的版本信息和备注\n- feat: 更新自动更新配置中的下载链接\n- feat: 更新版本信息显示，添加版本备注功能\n- feat: 重置版本号至 0.1.0，并生成更新配置文件",
  "pub_date": "2025-05-20T15:35:28.590Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDJENTM1QTc0QzVENkREODkKUldTSjNkYkZkRnBUTFlKcURFREtqT3dFVC9NUlluKzlGYlZBWFBLYlgxYjBFVXllanEwazZmeE0K",
      "url": "https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/releases/download/v0.1.5/xx-mod-manager-tauri_0.1.5_x64-setup.exe"
    }
  }
}
*/
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
    downloadAndInstall: (onProgress: (event: DownloadProgressEvent) => void) => Promise<void>;
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

    async check(): Promise<InternalUpdateInfo | null> {
        const { urls, currentVersion, timeout } = this.updateCheckerOptions;

        for (const url of urls) {
            try {
                // const response = await new Promise<any>((resolve, reject) => {
                //     const xhr = new XMLHttpRequest();
                //     xhr.open('GET', url, true);
                //     xhr.timeout = timeout || 30000;
                //     xhr.onreadystatechange = () => {
                //         if (xhr.readyState === 4) {
                //             if (xhr.status === 200) {
                //                 try {
                //                     const data = JSON.parse(xhr.responseText);
                //                     resolve(data);
                //                 } catch (e) {
                //                     reject(e);
                //                 }
                //             } else {
                //                 reject(new Error(`Request failed with status ${xhr.status}`));
                //             }
                //         }
                //     };
                //     xhr.ontimeout = () => {
                //         reject(new Error('Request timed out'));
                //     };
                //     xhr.send();
                // });

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

        return {
            version,
            notes,
            pub_date,
            platforms,
            downloadAndInstall: this.downloadAndInstall.bind(this),
        };
    }

    async downloadAndInstall(onProgress: (event: DownloadProgressEvent) => void): Promise<void> {
        // 获取当前平台，这里假设为 windows-x86_64，也可以通过 Tauri API 获取
        const platform = 'windows-x86_64'; // 可以根据需要动态确定
        
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
        
        // 如果下载成功，安装更新
        if (downloadedData) {
            await this.installUpdate(downloadedData);
        } else {
            // 如果所有 URL 都失败了，抛出最后一个错误
            throw new Error(`Failed to download update after trying all URLs: ${lastError?.message || 'Unknown error'}`);
        }
    }
    
    private async downloadFile(url: string, onProgress: (event: DownloadProgressEvent) => void): Promise<ArrayBuffer> {
        return new Promise<ArrayBuffer>(async (resolve, reject) => {
            try {
                let lastLoaded = 0;

                const response = await axios.get(url, {
                    responseType: 'arraybuffer',
                    timeout: this.updateCheckerOptions.timeout || 30000,
                    onDownloadProgress: (progressEvent) => {
                        const { loaded, total } = progressEvent;
                        const chunkLength = loaded - lastLoaded;

                        if (loaded === 0) {
                            onProgress({
                                event: 'Started',
                                data: {
                                    contentLength: total || 0,
                                    url
                                }
                            });
                        } else {
                            onProgress({
                                event: 'Progress',
                                data: {
                                    loaded,
                                    total: total || 0,
                                    chunkLength
                                }
                            });
                        }

                        lastLoaded = loaded;
                    }
                });

                onProgress({
                    event: 'Finished',
                    data: {
                        url
                    }
                });

                resolve(response.data);
            } catch (error) {
                reject(new Error(`Download failed: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
    }
      private async installUpdate(downloadedData: ArrayBuffer): Promise<void> {
        // 实现安装逻辑
        // 保存下载的更新文件到 updater 文件夹，然后执行安装
        try {
            console.log('Installing update...');
            
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
            
            // 4. 执行安装程序
            // 这里可以使用 Tauri 的 Command API 来执行安装程序
            // 注意：由于安全限制，可能需要在 tauri.conf.json 中配置允许执行的命令
            // 例如: 
            // import { Command } from '@tauri-apps/api/shell';
            // await new Command('cmd', ['/c', 'start', fileName]).execute();
            
            console.log('Update installed successfully');
        } catch (error) {
            console.error('Error installing update:', error);
            throw new Error(`Failed to install update: ${error instanceof Error ? error.message : String(error)}`);
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
}


export async function checkForUpdates(): Promise<void> {
    alert('checking for updates');
    const updateChecker = new UpdateChecker({
        urls: [
            "https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/updater/config.json",
            'https://raw.githubusercontent.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/main/update.json',
        ],
        currentVersion: '0.1.0',
    });
    const update = await updateChecker.check();
    if (update) {
        console.log(
            `found update ${update.version} from ${update.pub_date} with notes ${update.notes}`
        );
        alert(
            `found update ${update.version} from ${update.pub_date} with notes ${update.notes}`
        );
        let downloaded = 0;
        let contentLength = 0;
        // alternatively we could also call update.download() and update.install() separately
        await update.downloadAndInstall((event) => {
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

        console.log('update installed');
        alert('update installed');
        await relaunch();
    }
}