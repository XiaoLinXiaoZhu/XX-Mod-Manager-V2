import { invoke } from '@tauri-apps/api/core';

export type FileFilter = {
  name: string,
  extensions: string[]
}

export type FileDialogOption = {
  title?: string
  startingPath?: string
  filters?: FileFilter[]
  multiple?: boolean
  folder?: boolean
  save?: boolean
}

// 默认值处理逻辑
const DEFAULT_OPTIONS: Required<Omit<FileDialogOption, 'filters' | 'startingPath'>> = {
  title: 'Select',
  multiple: false,
  folder: false,
  save: false
}


/**
 * 打开文件/文件夹/保存对话框
 * @param options 配置选项
 * @returns 返回选中的路径数组（如果是保存或单选，则返回长度为1的数组）
 */
export async function openFileDialog(options: FileDialogOption): Promise<string[] | null> {
  const finalOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  try {
    const result = await invoke<string[]>('open_file_dialog', {options: finalOptions})
    return result ?? null
  } catch (err) {
    console.error('打开文件对话框失败:', err)
    return null
  }
}