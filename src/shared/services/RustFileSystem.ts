import { IFileSystem } from '../types/filesystem';
import { invoke } from '@tauri-apps/api/core';
import * as TauriPath from '@tauri-apps/api/path';

export class RustFileSystem implements IFileSystem {
    // 基础文件操作 (继承自 IFileSystemBase)
    async readFile(path: string, ifCreate: boolean = false): Promise<string> {
        try {
            const content = await invoke<string>('read_file', { pathStr: path, ifCreate });
            return content;
        } catch (error) {
            console.error('Error reading file:', error);
            return '';
        }
    }

    async writeFile(path: string, content: string, ifCreate: boolean = false): Promise<void> {
        try {
            await invoke('write_file', { pathStr: path, content, ifCreate });
        } catch (error) {
            console.error('Error writing file:', error);
            return;
        }
    }

    async deleteFile(path: string): Promise<void> {
        try {
            await invoke('delete_file', { pathStr: path });
        } catch (error) {
            console.error('Error deleting file:', error);
            return;
        }
    }

    async createDirectory(path: string): Promise<void> {
        try {
            await invoke('create_directory', { pathStr: path });
        } catch (error) {
            console.error('Error creating directory:', error);
            return;
        }
    }

    async deleteDirectory(path: string): Promise<void> {
        try {
            await invoke('delete_directory', { pathStr: path });
        } catch (error) {
            console.error('Error deleting directory:', error);
            return;
        }
    }

    async isFileExists(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('is_file_exists', { pathStr: path });
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    }

    async isDirectoryExists(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('is_directory_exists', { pathStr: path });
        } catch (error) {
            console.error('Error checking if directory exists:', error);
            return false;
        }
    }

    // 扩展的文件系统功能
    async readBinaryFile(path: string, ifCreate: boolean = false): Promise<Uint8Array> {
        try {
            const data = await invoke<number[]>('read_binary_file', { pathStr: path, ifCreate });
            return new Uint8Array(data);
        } catch (error) {
            console.error('Error reading binary file:', error);
            return new Uint8Array();
        }
    }

    async writeBinaryFile(path: string, data: Uint8Array, ifCreate: boolean = false): Promise<void> {
        try {
            const dataArray = Array.from(data);
            await invoke('write_binary_file', { pathStr: path, data: dataArray, ifCreate });
        } catch (error) {
            console.error('Error writing binary file:', error);
            return;
        }
    }

    async renameFile(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('rename_file', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error('Error renaming file:', error);
            return;
        }
    }

    async renameDirectory(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('rename_directory', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error(`Error renaming directory: ${oldPath} to ${newPath}`, error);
            return;
        }
    }

    async moveFile(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('move_file', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error('Error moving file:', error);
            return;
        }
    }

    async moveDirectory(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('move_directory', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error('Error moving directory:', error);
            return;
        }
    }

    async copyFile(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('copy_file', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error('Error copying file:', error);
            return;
        }
    }

    async copyDirectory(oldPath: string, newPath: string): Promise<void> {
        try {
            await invoke('copy_directory', { oldPathStr: oldPath, newPathStr: newPath });
        } catch (error) {
            console.error('Error copying directory:', error);
            return;
        }
    }

    async getDirectoryList(path: string): Promise<string[]> {
        try {
            return await invoke<string[]>('get_directory_list', { pathStr: path });
        } catch (error) {
            console.error('Error getting directory list:', error);
            return [];
        }
    }

    async getFullPath(path: string): Promise<string> {
        return TauriPath.resolve(path);
    }

    async joinPath(basePath: string, relativePath: string): Promise<string> {
        return TauriPath.join(basePath, relativePath);
    }

    async hasParentDirectory(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('has_parent_directory', { pathStr: path });
        } catch (error) {
            console.error('Error checking parent directory:', error);
            return false;
        }
    }

    async createSymlink(target: string, link: string): Promise<void> {
        try {
            await invoke('create_symlink', { targetStr: target, linkStr: link });
        } catch (error) {
            console.error('Error creating symlink:', error);
            return;
        }
    }

    async isSymlinkSupported(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('is_symlink_supported', { pathStr: path });
        } catch (error) {
            console.error('Error checking if symlink is supported:', error);
            return false;
        }
    }

    async downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
        try {
            await invoke('download_file_to_path', { url, savePathStr: savePath, timeoutMs });
        } catch (error) {
            console.error('Error downloading file to path:', error);
            return;
        }
    }

    async downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
        try {
            const data = await invoke<number[]>('download_file_to_binary', { url, timeoutMs });
            return new Uint8Array(data);
        } catch (error) {
            console.error('Error downloading file to binary:', error);
            return new Uint8Array();
        }
    }

    async openFileWithDefaultApp(path: string): Promise<void> {
        try {
            await invoke('open_file_with_default_app', { pathStr: path });
        } catch (error) {
            console.error('Error opening file with default app:', error);
            return;
        }
    }

    async openDirectoryWithDefaultApp(path: string): Promise<void> {
        try {
            await invoke('open_directory_with_default_app', { pathStr: path });
        } catch (error) {
            console.error('Error opening directory with default app:', error);
            return;
        }
    }

    async openUrlWithDefaultBrowser(url: string): Promise<void> {
        try {
            await invoke('open_url_with_default_browser', { url });
        } catch (error) {
            console.error('Error opening URL with default browser:', error);
            return;
        }
    }

    async showFileInExplorer(path: string): Promise<void> {
        try {
            await invoke('show_file_in_explorer', { pathStr: path });
        } catch (error) {
            console.error('Error showing file in explorer:', error);
            return;
        }
    }

    async showDirectoryInExplorer(path: string, ifCreate: boolean = false): Promise<void> {
        try {
            await invoke('show_directory_in_explorer', { pathStr: path, ifCreate });
        } catch (error) {
            console.error('Error showing directory in explorer:', error);
            return;
        }
    }

    async openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
        try {
            await invoke('open_program', { pathStr: path, args, hide, uac });
        } catch (error) {
            console.error('Error opening program:', error);
            return;
        }
    }

    async getAppdataDir(): Promise<string> {
        try {
            return await invoke<string>('get_appdata_dir');
        } catch (error) {
            console.error('Error getting appdata directory:', error);
            return '';
        }
    }

    async getConfigFolder(): Promise<string> {
        try {
            return await invoke<string>('get_appdata_dir');
        } catch (error) {
            console.error('Error getting appdata directory:', error);
            return '';
        }
    }

    // IFileSystemBase 中的其他方法
    async checkFileExists(path: string): Promise<boolean> {
        try {
            return await invoke<boolean>('is_file_exists', { pathStr: path });
        } catch (error) {
            console.error('Error checking if file exists:', error);
            return false;
        }
    }

    async normalizePath(path: string): Promise<string> {
        return TauriPath.normalize(path);
    }

    async getBaseName(filePath: string): Promise<string> {
        return TauriPath.basename(filePath);
    }

    async getDirName(filePath: string): Promise<string> {
        return TauriPath.dirname(filePath);
    }

    async getExtension(filePath: string): Promise<string> {
        return TauriPath.extname(filePath);
    }
}

// 导出单例实例
export const rustFileSystem = new RustFileSystem();