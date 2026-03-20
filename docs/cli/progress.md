# CLI 开发进度

## 已完成功能

### 1. INI 解析器 (`@xxmm/ini-parser`)

完整的 3DMigoto INI 文件解析器，支持所有 section 类型：

| Section | 说明 |
|---------|------|
| `[Constants]` | 变量定义 (global/persist) |
| `[Key*]` | 按键绑定 |
| `[Present]` | 每帧执行 |
| `[TextureOverride*]` | 纹理覆盖 |
| `[ShaderOverride*]` | 着色器覆盖 |
| `[ShaderRegex*]` | 着色器正则（含子段） |
| `[Resource*]` | 资源定义 |
| `[CommandList*]` | 命令列表 |
| `[CustomShader*]` | 自定义着色器 |

```bash
bun run packages/cli/src/index.ts parse <mod路径>
```

### 2. 冲突检测 (`@xxmm/core`)

检测多个 mod 之间的 hash 冲突：

```bash
bun run packages/cli/src/index.ts conflict -d <mod目录>
```

### 3. 角色识别 (`@xxmm/core`)

根据 hash 自动识别 mod 对应的角色：

- **准确率**: 99.4% (155/156)
- **配置文件**: `data/game-configs/zzz.json` (26 个角色)
- **数据与代码分离**: 配置为纯 JSON，代码只负责加载

```bash
# 识别角色
bun run packages/cli/src/index.ts recognize -d <mod目录> -c data/game-configs/zzz.json

# 更新配置（游戏版本更新后）
bun run scripts/extract-character-hashes.ts
```

### 4. Chunk 去重存储 (`@xxmm/chunk-store`) ✅ NEW

基于内容寻址的混合压缩策略，**Rust 后端**实现高性能去重存储：

#### 技术栈

| 组件 | 选择 | 原因 |
|------|------|------|
| 并行 | rayon | 零开销抽象，自动负载均衡 |
| 压缩 | zstd | 比 gzip 快 3-5x，压缩率相当 |
| Hash | xxh3 | 比 md5 快 10x，128位输出 |
| 存储 | rusqlite | WAL 模式，批量写入优化 |

#### 性能对比

| 指标 | TypeScript | Rust | 提升 |
|------|------------|------|------|
| **批量归档 (177 mod, 30GB)** | 757s | **359s** | **2.1x** |
| **单个存入 (52MB)** | 1832ms | **310ms** | **5.9x** |
| **单个提取 (52MB)** | 675ms | **330ms** | **2x** |
| **存储大小** | 4571 MB | **3820 MB** | **16% 更小** |
| **去重率** | 85.1% | **86.8%** | +1.7% |

#### 使用方法

**Rust CLI (推荐):**

```bash
# 编译
cd crates/chunk-store-cli && cargo build --release

# 批量归档 (85 MB/s)
./target/release/chunk-store-cli batch <mods_dir> -a <archive>

# 单个归档 (310ms)
./target/release/chunk-store-cli add <mod_path> -a <archive>

# 解压 (330ms)
./target/release/chunk-store-cli extract <mod_id> <output> -a <archive>

# 统计
./target/release/chunk-store-cli stats -a <archive>
```

**TypeScript API (通过 Rust wrapper):**

```typescript
import { ModArchive } from '@xxmm/chunk-store';

const archive = new ModArchive('./mod-archive');

// 归档
await archive.archiveMod('path/to/mod', 'mod-id', 'Mod Name');

// 解压
await archive.extractMod('mod-id', './output');

// 统计
const stats = await archive.getStats();
console.log(`去重率: ${stats.deduplicationRatio * 100}%`);
```

### 5. Mod 启用/禁用 (`@xxmm/core` - ModLinker) ✅ NEW

通过符号链接实现 mod 的启用和禁用，避免传统的文件移动方式：

- **符号链接管理**: 使用 junction 类型避免管理员权限问题
- **状态查询**: 扫描存储目录和 mods 目录，展示启用/禁用状态
- **批量操作**: 支持批量启用/禁用和一键禁用所有
- **安全检查**: 只操作符号链接，不会误删实际文件

```bash
# 启用 mod
bun run packages/cli/src/index.ts link enable <mod名> -m <mods目录> -s <存储目录>

# 禁用 mod
bun run packages/cli/src/index.ts link disable <mod名> -m <mods目录> -s <存储目录>

# 切换状态
bun run packages/cli/src/index.ts link toggle <mod名> -m <mods目录> -s <存储目录>

# 查看状态
bun run packages/cli/src/index.ts link status -m <mods目录> -s <存储目录>

# 禁用所有
bun run packages/cli/src/index.ts link disable-all -m <mods目录> -s <存储目录>
```

### 6. Preset/Pack/Mod 层级管理 (`@xxmm/core` - PresetManager) ✅ NEW

层级关系: preset >= pack > mod

- **mod**: 包含一个或多个文件的模组
- **pack**: 一组 mod 的集合，pack 内 mod 可单独禁用
- **preset**: 预设配置，可引用 mod、pack 和其他 preset
- **preset 单选**: 切换 preset 自动计算需要启用的 mod 集合
- **循环引用安全**: 嵌套引用取并集，自动防止无限循环

```bash
# Mod 管理
bun run packages/cli/src/index.ts preset mod add <id> -n <名称>
bun run packages/cli/src/index.ts preset mod list

# Pack 管理
bun run packages/cli/src/index.ts preset pack create <id> -n <名称> -m <mod1,mod2>
bun run packages/cli/src/index.ts preset pack add-mod <packId> <modId>
bun run packages/cli/src/index.ts preset pack list

# Preset 管理
bun run packages/cli/src/index.ts preset create <id> -n <名称> -m <mods> -p <packs>
bun run packages/cli/src/index.ts preset activate <id>
bun run packages/cli/src/index.ts preset resolve <id>
bun run packages/cli/src/index.ts preset list
```

### 7. 快捷键识别与管理 (`@xxmm/core` - KeyManager) ✅ NEW

自动从 mod 的 INI 文件中识别快捷键绑定，支持冲突检测和用户覆写：

- **自动扫描**: 递归扫描 mod 目录，提取所有 Key section 的快捷键
- **冲突检测**: 检测不同 mod 之间的快捷键冲突
- **按键汇总**: 展示所有按键的使用情况
- **用户覆写**: 支持覆写快捷键配置，适应不同用户习惯
- **持久化**: 扫描结果和覆写配置保存为 JSON 文件

```bash
# 扫描快捷键
bun run packages/cli/src/index.ts keys scan <mod目录>

# 检测冲突
bun run packages/cli/src/index.ts keys conflicts <mod目录>

# 快捷键汇总
bun run packages/cli/src/index.ts keys summary

# 覆写快捷键
bun run packages/cli/src/index.ts keys override <modName> <section> <newKey>

# 查看覆写
bun run packages/cli/src/index.ts keys overrides

# 移除覆写
bun run packages/cli/src/index.ts keys remove-override <modName> <section>
```

## 项目结构

```
packages/
├── ini-parser/     # INI 解析器
├── core/           # 核心功能（冲突检测、角色识别、符号链接管理、层级管理、快捷键管理）
├── chunk-store/    # Chunk 去重存储 (Rust wrapper)
└── cli/            # 命令行工具

crates/
├── chunk-store/        # Rust 核心库
└── chunk-store-cli/    # Rust CLI

data/
└── game-configs/
    └── zzz.json    # ZZZ 角色 hash 配置
```

## 待开发功能

- [ ] 配置文件驱动：统一的用户配置文件，管理游戏路径、存储位置等
- [ ] link + preset 联动：激活 preset 时自动调用 ModLinker 创建/删除符号链接
- [ ] 快捷键覆写应用：将覆写配置实际写入 mod 的 INI 文件
- [ ] GUI 集成：通过 Tauri 提供图形界面
