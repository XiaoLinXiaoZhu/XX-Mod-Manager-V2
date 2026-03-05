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

## 项目结构

```
packages/
├── ini-parser/     # INI 解析器
├── core/           # 核心功能（冲突检测、角色识别）
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

- [ ] mod 启用/禁用（符号链接管理）
- [ ] preset/pack/mod 层级管理
- [ ] 快捷键识别与管理
