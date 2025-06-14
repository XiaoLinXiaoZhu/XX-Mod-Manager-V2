import { invoke } from '@tauri-apps/api/core';
import { join } from '@tauri-apps/api/path';

export async function readFile(path: string, ifCreate: boolean = false): Promise<string> {
    try {
        const content = await invoke<string>('read_file', { pathStr: path, ifCreate });
        // debug
        // console.log('read file', path, content,new Error())
        return content;
    } catch (error) {
        console.error('Error reading file:', error);
        // throw error;
        // don't throw error, just return empty string
        return '';
    }
}

export async function writeFile(path: string, content: string, ifCreate: boolean = false): Promise<void> {
    try {
        await invoke('write_file', { pathStr: path, content, ifCreate });
    } catch (error) {
        console.error('Error writing file:', error);
        // don't throw error, just return
        // throw error;
        return;
    }
}

export async function deleteFile(path: string): Promise<void> { 
    try {
        await invoke('delete_file', { pathStr: path });
    } catch (error) {
        console.error('Error deleting file:', error);
        // don't throw error, just return
        // throw error;
        return;
    }
}

// 读取二进制文件
export async function readBinaryFile(path: string, ifCreate: boolean = false): Promise<Uint8Array> {
    try {
        const data = await invoke<number[]>('read_binary_file', { pathStr: path, ifCreate });
        return new Uint8Array(data);
    } catch (error) {
        console.error('Error reading binary file:', error);
        return new Uint8Array();
    }
}

// 写入二进制文件
export async function writeBinaryFile(path: string, data: Uint8Array, ifCreate: boolean = false): Promise<void> {
    try {
        const dataArray = Array.from(data);
        await invoke('write_binary_file', { pathStr: path, data: dataArray, ifCreate });
    } catch (error) {
        console.error('Error writing binary file:', error);
        return;
    }
}

// 重命名文件
export async function renameFile(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('rename_file', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error renaming file:', error);
        return;
    }
}

// 重命名目录
export async function renameDirectory(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('rename_directory', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error renaming directory:', error);
        return;
    }
}

// 创建目录
export async function createDirectory(path: string): Promise<void> {
    try {
        await invoke('create_directory', { pathStr: path });
    } catch (error) {
        console.error('Error creating directory:', error);
        return;
    }
}

// 删除目录
export async function deleteDirectory(path: string): Promise<void> {
    try {
        await invoke('delete_directory', { pathStr: path });
    } catch (error) {
        console.error('Error deleting directory:', error);
        return;
    }
}

// 移动文件
export async function moveFile(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('move_file', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error moving file:', error);
        return;
    }
}

// 移动目录
export async function moveDirectory(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('move_directory', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error moving directory:', error);
        return;
    }
}

// 复制文件
export async function copyFile(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('copy_file', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error copying file:', error);
        return;
    }
}

// 复制目录
export async function copyDirectory(oldPath: string, newPath: string): Promise<void> {
    try {
        await invoke('copy_directory', { oldPathStr: oldPath, newPathStr: newPath });
    } catch (error) {
        console.error('Error copying directory:', error);
        return;
    }
}

// 检查文件是否存在
export async function isFileExists(path: string): Promise<boolean> {
    try {
        return await invoke<boolean>('is_file_exists', { pathStr: path });
    } catch (error) {
        console.error('Error checking if file exists:', error);
        return false;
    }
}

// 检查目录是否存在
export async function isDirectoryExists(path: string): Promise<boolean> {
    try {
        return await invoke<boolean>('is_directory_exists', { pathStr: path });
    } catch (error) {
        console.error('Error checking if directory exists:', error);
        return false;
    }
}

// 获取目录列表
export async function getDirectoryList(path: string): Promise<string[]> {
    try {
        return await invoke<string[]>('get_directory_list', { pathStr: path });
    } catch (error) {
        console.error('Error getting directory list:', error);
        return [];
    }
}

// 获取完整路径
export async function getFullPath(path: string): Promise<string> {
    try {
        return await invoke<string>('get_full_path', { pathStr: path });
    } catch (error) {
        console.error('Error getting full path:', error);
        return '';
    }
}

// 创建符号链接
export async function createSymlink(target: string, link: string): Promise<void> {
    try {
        await invoke('create_symlink', { targetStr: target, linkStr: link });
    } catch (error) {
        console.error('Error creating symlink:', error);
        return;
    }
}

// 检查是否支持符号链接
export async function isSymlinkSupported(path: string): Promise<boolean> {
    try {
        return await invoke<boolean>('is_symlink_supported', { pathStr: path });
    } catch (error) {
        console.error('Error checking if symlink is supported:', error);
        return false;
    }
}

// 下载文件到指定路径
export async function downloadFileToPath(url: string, savePath: string, timeoutMs?: number): Promise<void> {
    try {
        await invoke('download_file_to_path', { url, savePathStr: savePath, timeoutMs });
    } catch (error) {
        console.error('Error downloading file to path:', error);
        return;
    }
}

// 下载文件为二进制数据
export async function downloadFileToBinary(url: string, timeoutMs?: number): Promise<Uint8Array> {
    try {
        const data = await invoke<number[]>('download_file_to_binary', { url, timeoutMs });
        return new Uint8Array(data);
    } catch (error) {
        console.error('Error downloading file to binary:', error);
        return new Uint8Array();
    }
}

// 拼接路径，处理 .. 为返回父目录
export async function joinPath(basePath: string, relativePath: string): Promise<string> {
    // try {
    //     return await invoke<string>('join_path', { basePathStr: basePath, relativePathStr: relativePath });
    // } catch (error) {
    //     console.error('Error joining paths:', error);
    //     return '';
    // }
    // 这里重复实现了，实际上可以直接使用 @tauri-apps/api/path 提供的 join 和 normalize 方法
    // error
    console.warn('joinPath is using @tauri-apps/api/path.join instead of invoke',new Error());
    return join(basePath, relativePath)
}

// 判断路径是否有父目录
export async function hasParentDirectory(path: string): Promise<boolean> {
    try {
        return await invoke<boolean>('has_parent_directory', { pathStr: path });
    } catch (error) {
        console.error('Error checking parent directory:', error);
        return false;
    }
}

// 用默认应用打开文件
export async function openFileWithDefaultApp(path: string): Promise<void> {
    try {
        await invoke('open_file_with_default_app', { pathStr: path });
    } catch (error) {
        console.error('Error opening file with default app:', error);
        return;
    }
}

// 用默认应用打开目录
export async function openDirectoryWithDefaultApp(path: string): Promise<void> {
    try {
        await invoke('open_directory_with_default_app', { pathStr: path });
    } catch (error) {
        console.error('Error opening directory with default app:', error);
        return;
    }
}

// 在默认浏览器中打开URL
export async function openUrlWithDefaultBrowser(url: string): Promise<void> {
    try {
        await invoke('open_url_with_default_browser', { url });
    } catch (error) {
        console.error('Error opening URL with default browser:', error);
        return;
    }
}

// 在资源管理器中显示文件
export async function showFileInExplorer(path: string): Promise<void> {
    try {
        await invoke('show_file_in_explorer', { pathStr: path });
    } catch (error) {
        console.error('Error showing file in explorer:', error);
        return;
    }
}

// 在资源管理器中显示目录
export async function showDirectoryInExplorer(path: string, ifCreate: boolean = false): Promise<void> {
    try {
        await invoke('show_directory_in_explorer', { pathStr: path, ifCreate });
    } catch (error) {
        console.error('Error showing directory in explorer:', error);
        return;
    }
}

// 打开程序
export async function openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
    try {
        await invoke('open_program', { pathStr: path, args, hide, uac });
    } catch (error) {
        console.error('Error opening program:', error);
        return;
    }
}

// 获取应用数据目录
export async function getAppdataDir(): Promise<string> {
    try {
        return await invoke<string>('get_appdata_dir');
    } catch (error) {
        console.error('Error getting appdata directory:', error);
        return '';
    }
}


