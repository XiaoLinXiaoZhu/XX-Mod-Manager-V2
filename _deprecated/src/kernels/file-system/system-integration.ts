/**
 * 系统集成操作
 * 提供与系统集成相关的功能，如打开文件、浏览器、程序等
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 用默认应用打开文件
 */
export async function openFileWithDefaultApp(path: string): Promise<void> {
  try {
    await invoke('open_file_with_default_app', { path_str: path });
  } catch (error) {
    throw new KernelError(
      `Failed to open file with default app: ${path}`,
      'OPEN_FILE_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 用默认应用打开目录
 */
export async function openDirectoryWithDefaultApp(path: string, ifCreate?: boolean): Promise<void> {
  try {
    await invoke('open_directory_with_default_app', { path_str: path, if_create: ifCreate || false });
  } catch (error) {
    throw new KernelError(
      `Failed to open directory with default app: ${path}`,
      'OPEN_DIR_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 用默认浏览器打开链接
 */
export async function openUrlWithDefaultBrowser(url: string): Promise<void> {
  try {
    await invoke('open_url_with_default_browser', { url });
  } catch (error) {
    throw new KernelError(
      `Failed to open URL with default browser: ${url}`,
      'OPEN_URL_ERROR',
      { url, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 在资源管理器中显示文件
 */
export async function showFileInExplorer(path: string): Promise<void> {
  try {
    await invoke('show_file_in_explorer', { path_str: path });
  } catch (error) {
    throw new KernelError(
      `Failed to show file in explorer: ${path}`,
      'SHOW_FILE_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 在资源管理器中显示目录
 */
export async function showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void> {
  try {
    await invoke('show_directory_in_explorer', { path_str: path, if_create: ifCreate || false });
  } catch (error) {
    throw new KernelError(
      `Failed to show directory in explorer: ${path}`,
      'SHOW_DIR_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 打开程序
 */
export async function openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
  try {
    await invoke('open_program', { path_str: path, args, hide, uac });
  } catch (error) {
    throw new KernelError(
      `Failed to open program: ${path}`,
      'OPEN_PROGRAM_ERROR',
      { path, error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 获取应用数据目录
 */
export async function getAppdataDir(): Promise<string> {
  try {
    return await invoke<string>('get_appdata_dir');
  } catch (error) {
    throw new KernelError(
      'Failed to get appdata directory',
      'APPDATA_DIR_ERROR',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * 获取配置目录
 */
export async function getConfigDir(): Promise<string> {
  try {
    return await invoke<string>('get_appdata_dir');
  } catch (error) {
    throw new KernelError(
      'Failed to get config directory',
      'CONFIG_DIR_ERROR',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}