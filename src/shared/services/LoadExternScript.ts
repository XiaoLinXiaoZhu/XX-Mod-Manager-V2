import { defaultModService } from "@/services";
import { path } from '@tauri-apps/api';

// async function loadPlugins(folder: string, files: string[]) {
//   for (const file of files) {
//     if (file.endsWith('.js') || file.endsWith('.ts')) {
//       try {
//         const fullPath = await path.join(folder, file);
//         const normalizedPath = await path.normalize(fullPath); // 转换 UNC 路径
//         console.log('Loading plugin from:', normalizedPath);

//         const code = await readFile(normalizedPath);
//         const plugin = new Function(`return ${code}`)();
//         await IPluginLoader.RegisterPlugin(plugin, environment);
//       } catch (e) {
//         const tt = $t('plugin.error.loadFailed', { file });
//         console.error(tt, e);
//         snack(tt, "error");
//       }
//     }
//   }
// }

export async function loadExternScript(scriptPath: string): Promise<Object> {
    // debug
    console.log('Loading external script from:', scriptPath);
  try {
    const fullPath = await path.join(scriptPath);
    const normalizedPath = await path.normalize(fullPath); // 转换 UNC 路径
    console.log('Loading external script from:', normalizedPath);

    const code = await defaultModService.getFileSystem().readFile(normalizedPath);
    // 将代码中的 export default 替换为 return，以便直接执行
    // 这假设脚本是一个模块，且导出了一个默认函数
    const modifiedCode = code.replace(/export default /, 'return ');
    const result = new Function(`${modifiedCode}`)();
    console.log('External script loaded successfully:', result);
    return result;
  } catch (e) {
    console.error('Failed to load external script:', e);
    throw e;
  }
}