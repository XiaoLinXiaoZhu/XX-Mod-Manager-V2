/**
 * 命令行参数工具函数
 * 提供命令行参数解析功能
 */

import { invoke } from '@tauri-apps/api/core';
import { Argv } from './types';

/**
 * 获取命令行参数
 * @returns 解析后的命令行参数
 */
export async function getArgv(): Promise<Argv> {
  return await invoke('get_command_line_args') as Argv;
}
