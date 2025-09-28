# 架构迁移指南

## 概述

本文档描述了如何从旧架构迁移到新的四层架构（Kernel ← Module ← Service ← Main）。

## 架构对比

### 旧架构问题
- 架构层次混乱：`src/core`、`src/features`、`src/shared` 职责不清晰
- 状态管理分散：Vue ref、全局变量、服务容器混合使用
- 依赖关系复杂：存在循环依赖和跨层依赖
- 代码组织不规范：缺乏统一的模块化标准

### 新架构优势
- 清晰的分层结构：每层职责明确，依赖单向
- 统一的状态管理：Service 层集中管理状态
- 类型安全：严格的 TypeScript 类型定义
- AI 友好：纯函数优先，显式依赖

## 迁移步骤

### 第一阶段：建立新架构骨架 ✅

1. **创建 Kernel 层** (`src/kernels/`)
   - 文件系统操作 (`file-system/`)
   - 事件系统 (`event-system/`)
   - 状态管理 (`state-manager/`)
   - 配置存储 (`config-storage/`)

2. **创建 Module 层** (`src/modules/`)
   - Mod 管理逻辑 (`mod-management/`)
   - 配置管理逻辑 (`config-management/`)

3. **创建 Service 层** (`src/services/`)
   - Mod 服务 (`mod-service/`)
   - 应用服务 (`app-service/`)

4. **重构 Main 层** (`src/main-new.ts`)
   - 应用启动和组装逻辑
   - 依赖注入和初始化

### 第二阶段：逐步迁移现有代码

## 详细迁移计划

### 迁移优先级和策略

基于代码分析，我们采用"元替代"策略，按以下优先级逐步迁移：

#### 高优先级（核心基础设施）
1. **插件系统迁移** - 从 `core/plugin/` 到 `kernels/plugin/`
2. **事件系统统一** - 合并 `core/event/` 和 `kernels/event-system/`
3. **配置系统迁移** - 从 `core/config/` 到 `modules/config-management/`

#### 中优先级（业务功能）
4. **Mod管理迁移** - 从 `features/mod-manager/` 到 `modules/mod-management/`
5. **国际化迁移** - 从 `features/i18n/` 到 `modules/i18n/`
6. **路由迁移** - 从 `features/router/` 到 `modules/router/`
7. **仓库管理迁移** - 从 `features/repository/` 到 `modules/repository/`

#### 低优先级（UI和工具）
8. **UI组件整理** - 重新组织 `ui/` 和 `shared/components/`
9. **工具函数迁移** - 从 `shared/utils/` 到相应层级
10. **类型定义整理** - 统一类型定义位置

### 迁移执行步骤

#### 步骤1：插件系统迁移
**目标**：将 `src/core/plugin/` 迁移到 `src/kernels/plugin/`

**迁移内容**：
- `PluginLoader.ts` → `kernels/plugin/plugin-loader.ts`
- `PluginTypes.ts` → `kernels/plugin/types.ts`
- `ToolsCanUsedInPlugin.ts` → `kernels/plugin/plugin-tools.ts`

**迁移策略**：
1. 将类转换为纯函数
2. 移除全局状态，改为依赖注入
3. 统一错误处理机制
4. 更新类型定义

#### 步骤2：事件系统统一
**目标**：合并 `core/event/` 和 `kernels/event-system/`

**迁移内容**：
- 保留 `kernels/event-system/` 作为标准实现
- 迁移 `core/event/EventSystem.ts` 中的业务逻辑到 `modules/`
- 删除 `core/event/` 目录

#### 步骤3：配置系统迁移
**目标**：将 `core/config/` 迁移到 `modules/config-management/`

**迁移内容**：
- `ConfigLoader.ts` → `modules/config-management/config-loader.ts`
- `GlobalConfigLoader.ts` → `modules/config-management/global-config.ts`
- 更新 `services/config-service/` 使用新的配置模块

#### 步骤4：Mod管理迁移
**目标**：将 `features/mod-manager/` 迁移到 `modules/mod-management/`

**迁移内容**：
- `ModInfo.ts` → `modules/mod-management/mod-info.ts`
- `ModLoader.ts` → `modules/mod-management/mod-loader.ts`
- `ModMetadata.ts` → `modules/mod-management/mod-metadata.ts`
- `ModFileOperator.ts` → `modules/mod-management/mod-file-operator.ts`
- `ModHotkeyManager.ts` → `modules/mod-management/mod-hotkey.ts`
- `ModPreviewManager.ts` → `modules/mod-management/mod-preview.ts`

#### 步骤5：其他功能迁移
**目标**：迁移剩余的功能模块

**迁移内容**：
- `features/i18n/` → `modules/i18n/`
- `features/router/` → `modules/router/`
- `features/repository/` → `modules/repository/`
- `features/mod-apply/` → `modules/mod-management/mod-apply.ts`
- `features/mod-preset/` → `modules/mod-management/mod-preset.ts`
- `features/settings/` → `modules/settings/`
- `features/updater/` → `modules/updater/`

#### 步骤6：UI层整理
**目标**：重新组织UI组件结构

**整理内容**：
- 保持 `ui/pages/` 作为页面组件
- 将 `ui/section/` 中的业务组件迁移到 `shared/components/`
- 整理 `shared/components/` 的组件分类
- 更新组件的导入路径

#### 步骤7：清理旧代码
**目标**：删除已迁移的老旧代码

**清理内容**：
- 删除 `src/core/` 目录（保留必要的配置文件）
- 删除 `src/features/` 目录
- 清理 `src/shared/` 中已迁移的服务
- 更新所有导入路径

### 迁移检查点

每个迁移步骤完成后，需要验证：
1. **功能完整性**：确保迁移后功能正常
2. **类型安全**：确保所有类型定义正确
3. **依赖关系**：确保依赖方向正确（Kernel ← Module ← Service ← Main）
4. **测试通过**：确保相关测试通过
5. **无循环依赖**：确保没有循环依赖

### 回滚策略

如果迁移过程中出现问题：
1. **功能回滚**：恢复到迁移前的状态
2. **部分回滚**：只回滚有问题的部分
3. **增量修复**：在现有基础上修复问题

#### 1. 迁移文件系统操作

**旧代码** (`src/shared/services/RustFileSystem.ts`):
```typescript
export class RustFileSystem implements IFileSystem {
  async readFile(path: string): Promise<string> {
    return await invoke('read_file', { path });
  }
}
```

**新代码** (`src/kernels/file-system/tauri-file-system.ts`):
```typescript
export class TauriFileSystem implements ExtendedFileSystem {
  async readFile(path: string, options: FileOptions = {}): Promise<string> {
    try {
      const result = await invoke<string>('read_file', { path });
      return result;
    } catch (error) {
      throw new KernelError(
        `Failed to read file: ${path}`,
        'FILE_READ_ERROR',
        { path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }
}
```

#### 2. 迁移 Mod 管理

**旧代码** (`src/features/mod-manager/ModMetadata.ts`):
```typescript
export class ModMetadata extends Storage {
  public readonly id = this.useStorage("id", "");
  public readonly name = this.useStorage("modName", "");
}
```

**新代码** (`src/modules/mod-management/mod-metadata.ts`):
```typescript
export function createModMetadata(
  location: string,
  config: ModConfig,
  overrides: Partial<ModMetadata> = {}
): ModMetadata {
  return {
    id: generateModId(location),
    name: overrides.name || extractModName(location),
    // ... 其他字段
  };
}
```

#### 3. 迁移状态管理

**旧代码** (`src/core/XXMMState.ts`):
```typescript
export const currentPage = ref<"gamePage" | "modListPage">("gamePage");
```

**新代码** (`src/services/app-service/index.ts`):
```typescript
export class AppService {
  private stateStore: ReactiveStore<AppState>;
  
  getState(): AppState {
    return this.stateStore.getState();
  }
  
  setCurrentPage(page: string): void {
    this.updateState({ currentPage: page });
  }
}
```

### 第三阶段：更新组件使用新架构

#### 1. 在 Vue 组件中使用服务

**旧方式**:
```typescript
import { globalServiceContainer } from '@/shared/services/ServiceContainer';
import { currentPage } from '@/core/XXMMState';

export default {
  setup() {
    const fs = globalServiceContainer.fs;
    const page = currentPage.value;
  }
}
```

**新方式**:
```typescript
import { defaultModService, defaultAppService } from '@/services';

export default {
  setup() {
    const modService = defaultModService;
    const appService = defaultAppService;
    
    const mods = modService.getState().mods;
    const currentPage = appService.getState().currentPage;
    
    // 订阅状态变化
    const unsubscribe = modService.subscribe((state) => {
      console.log('Mods updated:', state.mods);
    });
    
    onUnmounted(() => {
      unsubscribe();
    });
  }
}
```

#### 2. 使用 Module 层的纯函数

**旧方式**:
```typescript
import { ModMetadata } from '@/features/mod-manager/ModMetadata';

const mod = new ModMetadata(config);
mod.initialize(location);
```

**新方式**:
```typescript
import { createModMetadata, validateModMetadata } from '@/modules/mod-management';

const mod = createModMetadata(location, config);
const validation = validateModMetadata(mod);
if (validation.success) {
  // 使用验证后的 mod
}
```

### 第四阶段：清理旧代码

1. **删除旧文件**:
   - `src/core/` (保留必要的配置文件)
   - `src/features/` (迁移到 modules)
   - `src/shared/services/` (迁移到 kernels)

2. **更新导入路径**:
   - 将所有 `@/core/` 导入更新为 `@/kernels/` 或 `@/modules/`
   - 将所有 `@/features/` 导入更新为 `@/modules/`
   - 将所有 `@/shared/services/` 导入更新为 `@/kernels/`

3. **更新配置文件**:
   - 更新 `tsconfig.json` 中的路径别名
   - 更新 `vite.config.ts` 中的别名配置

## 迁移检查清单

### Kernel 层
- [ ] 文件系统操作已迁移
- [ ] 事件系统已迁移
- [ ] 状态管理已迁移
- [ ] 配置存储已迁移
- [ ] 所有类型定义完整
- [ ] 错误处理统一

### Module 层
- [ ] Mod 管理逻辑已迁移
- [ ] 配置管理逻辑已迁移
- [ ] 所有函数都是纯函数
- [ ] 无状态管理
- [ ] 类型安全

### Service 层
- [ ] Mod 服务已实现
- [ ] 应用服务已实现
- [ ] 状态管理集中
- [ ] 副作用隔离
- [ ] 事件系统集成

### Main 层
- [ ] 应用启动逻辑清晰
- [ ] 依赖注入正确
- [ ] 错误处理完善
- [ ] 生命周期管理

## 测试策略

### 单元测试
- Kernel 层：100% 覆盖率
- Module 层：>95% 覆盖率，无 Mock
- Service 层：集成测试，Mock 外部依赖

### 集成测试
- 测试各层之间的交互
- 测试完整的工作流程
- 测试错误处理

### 端到端测试
- 测试完整的用户场景
- 测试应用启动和关闭
- 测试 Mod 管理流程

## 性能优化

### 代码分割
- 按层分割代码
- 懒加载非关键模块
- 优化包大小

### 状态管理优化
- 使用计算属性减少重复计算
- 实现状态订阅的细粒度控制
- 避免不必要的状态更新

### 内存管理
- 正确清理事件监听器
- 避免内存泄漏
- 优化大对象的使用

## 常见问题

### Q: 如何处理现有的全局状态？
A: 将全局状态迁移到 Service 层，使用 ReactiveStore 管理。

### Q: 如何处理循环依赖？
A: 通过重新设计模块结构，确保依赖方向为 Kernel ← Module ← Service ← Main。

### Q: 如何处理现有的 Vue 组件？
A: 逐步更新组件使用新的服务，保持向后兼容。

### Q: 如何处理现有的配置系统？
A: 将配置系统迁移到 Module 层，使用纯函数处理配置逻辑。

## 总结

新架构提供了更清晰的分层结构、更好的类型安全性和更强的可维护性。通过逐步迁移，可以确保应用的稳定性和功能的完整性。

迁移过程需要仔细规划，确保每一步都经过充分测试，避免破坏现有功能。
