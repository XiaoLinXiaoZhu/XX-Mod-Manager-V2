/**
 * 系统集成操作实现
 * 包含与操作系统交互的功能，如打开文件、浏览器等
 */

import { invoke } from '@tauri-apps/api/core';
import { KernelError } from '../types';

/**
 * 系统集成操作类
 */
export class SystemIntegration {
  /**
   * 用默认应用打开文件
   */
  async openFileWithDefaultApp(path: string): Promise<void> {
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
  async openDirectoryWithDefaultApp(path: string): Promise<void> {
    try {
      await invoke('open_directory_with_default_app', { path_str: path });
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
  async openUrlWithDefaultBrowser(url: string): Promise<void> {
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
  async showFileInExplorer(path: string): Promise<void> {
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
  async showDirectoryInExplorer(path: string, ifCreate?: boolean): Promise<void> {
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
  async openProgram(path: string, args?: string, hide?: boolean, uac?: boolean): Promise<void> {
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
}
