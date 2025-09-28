/**
 * 脚本加载工具函数
 * 提供外部脚本加载和执行功能
 */

import { path } from '@tauri-apps/api';
import type { ExtendedFileSystem } from '../file-system/types';
import type { ScriptLoadOptions, ScriptLoadResult } from './types';

/**
 * 加载外部脚本
 * @param fileSystem 文件系统实例
 * @param scriptPath 脚本路径
 * @param options 加载选项
 * @returns 脚本加载结果
 */
export async function loadExternScript(
    fileSystem: ExtendedFileSystem,
    scriptPath: string,
    options: ScriptLoadOptions = {}
): Promise<ScriptLoadResult> {
    const { 
        normalizePath = true, 
        replaceExportDefault = true,
        timeout = 30000 
    } = options;

    try {
        console.log('Loading external script from:', scriptPath);
        
        let finalPath = scriptPath;
        
        // 标准化路径
        if (normalizePath) {
            const fullPath = await path.join(scriptPath);
            finalPath = await path.normalize(fullPath);
            console.log('Normalized script path:', finalPath);
        }

        // 读取脚本内容
        const code = await fileSystem.readFile(finalPath);
        
        // 处理代码
        let processedCode = code;
        if (replaceExportDefault) {
            // 将代码中的 export default 替换为 return，以便直接执行
            processedCode = code.replace(/export default /, 'return ');
        }
        
        // 执行脚本
        const result = new Function(`${processedCode}`)();
        console.log('External script loaded successfully:', result);
        
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Failed to load external script:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
        };
    }
}
