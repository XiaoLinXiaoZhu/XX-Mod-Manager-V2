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

## 项目结构

```
packages/
├── ini-parser/     # INI 解析器
├── core/           # 核心功能（冲突检测、角色识别）
└── cli/            # 命令行工具

data/
└── game-configs/
    └── zzz.json    # ZZZ 角色 hash 配置

scripts/
├── extract-character-hashes.ts  # 从 mod 提取角色配置
└── verify-recognition.ts        # 验证识别准确性
```

## 待开发功能

- [ ] mod 启用/禁用（符号链接管理）
- [ ] chunk 去重存储
- [ ] preset/pack/mod 层级管理
- [ ] 快捷键识别与管理
