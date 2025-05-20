import fs from "fs";
import path from "path";
import { execSync } from "child_process";

//- ===================
//- 🔗 同步package.json和tauri.conf.json5中的版本号
//- ===================
function getVersion() {
  // 读取package.json中的版本号
  const packageJsonPath = path.resolve(__dirname, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
  return packageJson.version;
}
function syncVersion() {
  try {
    // 读取package.json中的版本
    const version = getVersion();

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

//- ===================
//- 📦 生成 updater/config.json 以支持自动更新
//- ===================
function generateUpdaterConfig() {
  try {
    const signature = "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IDJENTM1QTc0QzVENkREODkKUldTSjNkYkZkRnBUTFlKcURFREtqT3dFVC9NUlluKzlGYlZBWFBLYlgxYjBFVXllanEwazZmeE0K";
    const version = getVersion();
    // 尝试从 git 仓库中获取上一个tag到当前版本的所有提交信息
    // 使用child_process执行git命令获取提交记录

    // 获取当前版本
    const currentVersion = version;
    console.log(`✅ 当前版本: ${currentVersion}`);

    // 获取所有标签，按版本排序
    let allTags = [];
    try {
      allTags = execSync("git tag -l").toString().trim().split("\n")
      .filter(tag => tag) // 过滤空标签
      .sort((a, b) => {
        // 假设标签格式为 v开头的语义化版本号，如 v0.1.3
        const versionA = a.replace(/^v/, '').split('.').map(Number);
        const versionB = b.replace(/^v/, '').split('.').map(Number);
        
        for (let i = 0; i < 3; i++) {
        if (versionA[i] !== versionB[i]) {
          return versionA[i] - versionB[i];
        }
        }
        return 0;
      });
      
      console.log(`✅ 找到所有标签: ${allTags.join(', ')}`);
    } catch (e) {
      console.log("⚠️ 获取标签失败:", e.message);
      allTags = [];
    }

    // 查找当前版本的上一个版本标签
    const currentVersionTag = `v${currentVersion}`;
    let previousVersionTag = "";
    
    const currentTagIndex = allTags.indexOf(currentVersionTag);
    if (currentTagIndex > 0) {
      // 如果找到当前版本标签，取前一个标签
      previousVersionTag = allTags[currentTagIndex - 1];
    } else if (allTags.length > 0) {
      // 如果没找到当前版本标签，但有其他标签，取最新的标签
      previousVersionTag = allTags[allTags.length - 1];
    }

    // 获取从上一个版本到现在的提交信息
    let changelog = "";
    try {
      if (previousVersionTag) {
      console.log(`✅ 使用上一个版本标签: ${previousVersionTag}`);
      // 获取从上一个版本标签到当前HEAD的所有提交
      changelog = execSync(`git log ${previousVersionTag}..HEAD --pretty=format:"- %s"`).toString();
      } else {
      // 如果没有找到前一个版本标签，获取最近的提交历史
      console.log("⚠️ 未找到上一个版本标签，将使用最近的提交历史");
      changelog = execSync(`git log --pretty=format:"- %s" -n 20`).toString();
      }
      
      // 调试输出
      console.log("获取的提交记录:", changelog);
      
      // 如果没有提交记录，添加一个默认消息
      if (!changelog.trim()) {
      changelog = "- 一般性更新与bug修复";
      }
      
      console.log("✅ 已获取更新日志");
    } catch (e) {
      console.error("⚠️ 获取git提交历史失败，使用默认更新日志:", e.message);
      changelog = "- 一般性更新与bug修复";
    }

    // 创建updater配置
    const updaterConfig = {
      version,
      notes: changelog,
      pub_date: new Date().toISOString(),
      platforms: {
        "windows-x86_64": {
          signature,
          url: `https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager-V2/releases/download/v${version}/xx-mod-manager-tauri_${version}_x64-setup.exe`
        }
        // 可以添加更多平台
      }
    };

    // 确保目录存在
    const updaterDir = path.resolve(__dirname, "updater");
    if (!fs.existsSync(updaterDir)) {
      fs.mkdirSync(updaterDir, { recursive: true });
    }

    // 写入配置文件
    const configPath = path.resolve(updaterDir, "config.json");
    fs.writeFileSync(configPath, JSON.stringify(updaterConfig, null, 2), "utf-8");
    console.log(`✅ 已生成更新配置文件: ${configPath}`);
  }
  catch (error) {
    console.error("❌ 生成更新配置失败:", error);
  }
}




const beforeVite = async () => {
    await syncVersion();
    await generateUpdaterConfig();
    // 这里可以添加其他的初始化代码
};

export default beforeVite;
