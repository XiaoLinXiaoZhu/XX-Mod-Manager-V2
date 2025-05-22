import { invoke } from '@tauri-apps/api/core';

export async function readFile(path: string, ifCreate: boolean = false): Promise<string> {
    try {
        const content = await invoke<string>('read_file', { pathStr: path, ifCreate });
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

