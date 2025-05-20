import fs from "fs";
import path from "path";

// 同步package.json和tauri.conf.json5中的版本号
function syncVersion() {
  try {
    // 读取package.json中的版本
    const packageJsonPath = path.resolve(__dirname, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    const version = packageJson.version;

    // 读取tauri.conf.json5文件
    const tauriConfPath = path.resolve(__dirname, "src-tauri", "tauri.conf.json5");
    let tauriConfContent = fs.readFileSync(tauriConfPath, "utf-8");
    
    // 使用正则表达式替换版本号
    const versionRegex = /(["']version["']\s*:\s*["'])([^"']*)(["'])/;
    const updatedContent = tauriConfContent.replace(versionRegex, `$1${version}$3`);
    
    // 写回文件
    fs.writeFileSync(tauriConfPath, updatedContent, "utf-8");
    console.log(`✅ 已将tauri.conf.json5中的版本号更新为${version}`);
  } catch (error) {
    console.error("❌ 同步版本号失败:", error);
  }
}

const beforeVite = async () => {
    await syncVersion();
    // 这里可以添加其他的初始化代码
};

export default beforeVite;
