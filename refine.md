# XX-Mod-Manager-Tauri 项目重构优化清单

## 🎯 重构目标
- 提升代码可维护性和可读性
- 建立清晰的项目架构
- 减少技术债务
- 提高代码质量和性能

---

## 🏗️ 项目结构重构

### 1. 目录结构重新组织
```
src/
├── core/                    # 核心系统
│   ├── config/             # 配置管理
│   ├── plugin/             # 插件系统
│   ├── event/              # 事件系统
│   └── storage/            # 存储管理
├── features/               # 功能模块
│   ├── mod-manager/        # Mod管理
│   ├── repository/         # 仓库管理
│   ├── settings/          # 设置管理
│   └── updater/           # 更新管理
├── shared/                 # 共享模块
│   ├── components/         # 通用组件
│   ├── composables/        # 组合式函数
│   ├── utils/             # 工具函数
│   ├── types/             # 类型定义
│   └── constants/         # 常量定义
├── ui/                     # UI层
│   ├── layouts/           # 布局组件
│   ├── pages/             # 页面组件
│   └── dialogs/           # 对话框组件
└── assets/                 # 静态资源
```

### 2. 文件清理
- [ ] 删除所有 `.bak`, `.new`, `.vue.bak` 等备份文件
- [ ] 删除 `test/` 目录下的测试页面（移至独立测试环境）
- [ ] 清理未使用的导入和注释代码
- [ ] 统一文件命名规范（使用 kebab-case）

---

## 📁 核心系统重构

### 3. 配置管理系统
#### 当前问题分析
- **双重配置管理**：`ConfigLoader` 和 `GlobalConfigLoader` 职责重叠
  ```typescript
  // 当前问题：两个配置加载器逻辑相似但分离
  ConfigLoader.useConfig('language', 'zh-CN', true);  // 需要额外参数判断是否使用全局
  useGlobalConfig('disabledPlugins', []);             // 独立的全局配置方法
  ```

- **基础存储类设计缺陷**：`Storage` 类职责混乱，包含太多业务逻辑
- **配置验证缺失**：没有类型验证和数据迁移机制
- **错误处理不当**：配置加载失败时缺乏恢复机制

#### 重构方案
- [ ] **统一配置管理**
  ```typescript
  // 新的配置管理架构
  class ConfigManager {
    private systemConfig: SystemConfig;      // 系统默认配置
    private globalConfig: GlobalConfig;      // 用户全局配置
    private localConfig: LocalConfig;        // 项目本地配置
    
    // 分层配置获取：local -> global -> system
    get<T>(key: string): T {
      return this.localConfig.get(key) ?? 
             this.globalConfig.get(key) ?? 
             this.systemConfig.get(key);
    }
  }
  ```

- [ ] **类型安全的配置Schema**
  ```typescript
  // 完整的配置类型定义
  interface AppConfig {
    ui: {
      language: I18nLocale;
      theme: Theme;
      startWithLastPreset: boolean;
    };
    mod: {
      sourceFolders: string[];
      targetFolder: string;
      presetFolder: string;
      useTraditionalApply: boolean;
      keepModNameAsFolder: boolean;
    };
    system: {
      firstLoad: boolean;
      checkUpdatesOnStart: boolean;
      enabledPlugins: string[];
    };
  }
  ```

- [ ] **配置持久化优化**
  - 实现原子性写入，防止配置文件损坏
  - 添加配置文件版本管理和自动迁移
  - 建立配置备份和恢复机制

### 4. 插件系统重构
#### 当前问题分析
- **IPluginLoader 类过于庞大**：524行代码，职责不清晰
  ```typescript
  // 当前问题：单个类承担过多职责
  export class IPluginLoader {
    // 插件注册、加载、配置、生命周期管理全在一个类里
    static plugins: { [key: string]: IPlugin } = {};
    static pluginConfig: { [key: string]: IPluginData[] } = {};
    // ... 各种静态方法混杂
  }
  ```

- **插件加载逻辑复杂**：同步加载导致性能问题
- **插件环境隔离不足**：直接访问全局对象，缺乏沙箱机制
- **依赖管理缺失**：插件间依赖关系处理简陋

#### 重构方案
- [ ] **拆分插件系统架构**
  ```typescript
  // 插件注册中心
  class PluginRegistry {
    private plugins = new Map<string, IPlugin>();
    register(plugin: IPlugin): void;
    unregister(name: string): void;
    get(name: string): IPlugin | undefined;
  }
  
  // 插件加载器
  class PluginLoader {
    async loadPlugin(path: string): Promise<IPlugin>;
    async loadPluginsFromDirectory(dir: string): Promise<IPlugin[]>;
  }
  
  // 插件生命周期管理
  class PluginLifecycleManager {
    async initialize(plugin: IPlugin): Promise<void>;
    async activate(plugin: IPlugin): Promise<void>;
    async deactivate(plugin: IPlugin): Promise<void>;
    async dispose(plugin: IPlugin): Promise<void>;
  }
  
  // 插件依赖解析器
  class PluginDependencyResolver {
    resolveDependencies(plugins: IPlugin[]): IPlugin[];
    validateDependencies(plugin: IPlugin): boolean;
  }
  ```

- [ ] **简化插件接口**
  ```typescript
  // 新的简化插件接口
  interface IPlugin {
    readonly name: string;
    readonly version: string;
    readonly dependencies?: string[];
    readonly scope: 'global' | 'local';
    
    // 简化生命周期
    activate?(context: PluginContext): Promise<void>;
    deactivate?(): Promise<void>;
    
    // 配置定义
    configSchema?: ConfigSchema;
  }
  
  // 插件上下文（沙箱环境）
  interface PluginContext {
    readonly api: PluginAPI;
    readonly storage: PluginStorage;
    readonly logger: PluginLogger;
  }
  ```

- [ ] **插件安全沙箱**
  - 限制插件对系统API的访问
  - 提供受控的插件API接口
  - 实现插件资源隔离和清理

### 5. 事件系统优化
#### 当前问题分析
- **事件类型定义分散**：所有事件类型硬编码在一个enum中
  ```typescript
  // 当前问题：事件类型管理混乱
  enum EventType {
    wakeUp = 'wakeUp',
    initDone = 'initDone',
    themeChange = 'themeChange',
    // ... 40多个事件混在一起
  }
  ```

- **事件处理器管理缺失**：没有自动清理机制，可能导致内存泄漏
- **类型安全性不足**：事件参数没有类型约束
- **性能问题**：同步事件处理可能阻塞主线程

#### 重构方案
- [ ] **强类型事件系统**
  ```typescript
  // 事件类型映射
  interface EventMap {
    // 生命周期事件
    'app:init': { timestamp: number };
    'app:ready': { version: string };
    
    // 配置事件
    'config:changed': { key: string; oldValue: any; newValue: any };
    'config:loaded': { source: 'local' | 'global' | 'system' };
    
    // 插件事件
    'plugin:loaded': { plugin: IPlugin };
    'plugin:activated': { name: string };
    'plugin:error': { name: string; error: Error };
    
    // Mod事件
    'mod:installed': { mod: ModInfo };
    'mod:enabled': { id: string };
    'mod:conflict': { mods: ModInfo[] };
  }
  
  // 类型安全的事件系统
  class TypedEventSystem {
    on<K extends keyof EventMap>(
      event: K, 
      handler: (data: EventMap[K]) => void,
      options?: { once?: boolean; priority?: number }
    ): void;
    
    emit<K extends keyof EventMap>(
      event: K, 
      data: EventMap[K]
    ): Promise<void>;
    
    off<K extends keyof EventMap>(
      event: K, 
      handler: (data: EventMap[K]) => void
    ): void;
  }
  ```

- [ ] **事件处理优化**
  - 实现事件优先级和异步处理
  - 添加事件监听器生命周期管理
  - 建立事件调试和监控机制
  
- [ ] **模块化事件管理**
  ```typescript
  // 按模块组织事件
  const AppEvents = createEventBus<{
    'init': AppInitEvent;
    'shutdown': AppShutdownEvent;
  }>();
  
  const PluginEvents = createEventBus<{
    'loaded': PluginLoadedEvent;
    'error': PluginErrorEvent;
  }>();
  ```

### 6. 存储系统重构
#### 当前问题分析
- **Storage类职责过重**：既管理数据又处理文件IO
- **并发安全问题**：多个配置同时保存可能导致数据损坏
- **缺乏事务支持**：配置更新不是原子操作

#### 重构方案
- [ ] **分离关注点**
  ```typescript
  // 数据层
  interface DataStore<T> {
    get(key: string): T | undefined;
    set(key: string, value: T): void;
    delete(key: string): boolean;
    keys(): string[];
  }
  
  // 持久化层
  interface PersistenceAdapter {
    load(path: string): Promise<Record<string, any>>;
    save(path: string, data: Record<string, any>): Promise<void>;
    backup(path: string): Promise<string>;
  }
  
  // 配置管理器
  class ConfigStore<T extends Record<string, any>> {
    constructor(
      private store: DataStore<any>,
      private persistence: PersistenceAdapter,
      private schema: ConfigSchema<T>
    ) {}
  }
  ```

- [ ] **事务性更新**
  - 实现配置更新的原子性
  - 添加回滚机制
  - 支持批量更新操作

---

## 🧩 功能模块重构

### 6. Mod管理模块
- [ ] **ModInfo 类重构**
  - 简化 `ModInfo` 类的职责
  - 实现 mod 状态管理
  - 添加 mod 冲突检测

- [ ] **ModLoader 优化**
  - 实现异步加载机制
  - 添加加载进度反馈
  - 优化大量 mod 的加载性能

### 7. 仓库管理模块
- [ ] **Repo 类型优化**
  ```typescript
  interface Repository {
    id: string;
    name: string;
    path: string;
    metadata: RepositoryMetadata;
    mods: ModReference[];
  }
  ```

- [ ] **仓库操作抽象**
  - 实现仓库 CRUD 操作类
  - 添加仓库导入/导出功能
  - 优化仓库切换性能

### 8. 文件操作优化
- [ ] **FileHelper 重构**
  - 实现统一的文件操作接口
  - 添加文件操作错误处理
  - 优化大文件操作性能

- [ ] **图片管理优化**
  - 实现图片缓存机制
  - 添加图片压缩和优化
  - 统一图片加载状态管理

---

## 🎨 UI层重构

### 9. 组件架构优化
- [ ] **组件层次重新设计**
  ```
  layouts/          # 页面布局
  ├── AppLayout.vue
  └── DialogLayout.vue
  
  pages/            # 页面组件
  ├── HomePage.vue
  ├── ModListPage.vue
  └── SettingsPage.vue
  
  features/         # 功能组件
  ├── ModCard.vue
  ├── RepoSelector.vue
  └── SettingPanel.vue
  ```

- [ ] **组件解耦**
  - 减少组件间直接依赖
  - 实现 props/emit 标准化
  - 使用 provide/inject 管理跨层级通信

### 10. 样式系统优化
- [ ] **样式架构重构**
  ```scss
  styles/
  ├── base/           # 基础样式
  ├── components/     # 组件样式
  ├── layouts/        # 布局样式
  ├── themes/         # 主题样式
  └── utilities/      # 工具样式
  ```

- [ ] **CSS变量管理**
  - 统一颜色系统
  - 实现响应式设计标准
  - 优化主题切换机制

### 11. 路由系统优化
- [ ] **路由结构清理**
  - 移除测试路由
  - 实现路由懒加载
  - 添加路由守卫和权限管理

---

## 🔧 代码质量提升

### 12. TypeScript优化
- [ ] **类型定义完善**
  ```typescript
  // 统一类型定义文件
  types/
  ├── api.ts          # API相关类型
  ├── config.ts       # 配置相关类型
  ├── mod.ts          # Mod相关类型
  └── ui.ts           # UI相关类型
  ```

- [ ] **严格类型检查**
  - 启用 `strict` 模式
  - 消除 `any` 类型使用
  - 添加运行时类型验证

### 13. 错误处理标准化
- [ ] **统一错误处理机制**
  ```typescript
  // 错误处理标准
  class AppError extends Error {
    code: ErrorCode;
    context?: Record<string, any>;
  }
  ```

- [ ] **用户友好的错误提示**
  - 实现错误分类和本地化
  - 添加错误恢复建议
  - 优化错误日志记录

### 14. 性能优化
- [ ] **组件性能优化**
  - 实现组件懒加载
  - 优化大列表渲染
  - 添加虚拟滚动

- [ ] **内存管理**
  - 修复内存泄漏问题
  - 优化事件监听器管理
  - 实现组件卸载清理

---

## 🛠️ 开发体验优化

### 15. 开发工具配置
- [ ] **代码规范工具**
  ```json
  // 添加到 package.json
  {
    "scripts": {
      "lint": "eslint src --ext .ts,.vue",
      "format": "prettier --write src",
      "type-check": "vue-tsc --noEmit"
    }
  }
  ```

- [ ] **Git 工作流优化**
  - 配置 `.gitignore` 忽略临时文件
  - 设置 pre-commit hooks
  - 建立分支管理策略

### 16. 文档完善
- [ ] **代码注释标准化**
  - 统一 JSDoc 注释格式
  - 为关键函数添加详细文档
  - 实现 API 文档自动生成

- [ ] **开发文档**
  - 编写组件使用指南
  - 创建插件开发文档
  - 建立贡献指南

---

## 🧪 测试体系建立

### 17. 测试框架搭建
- [ ] **单元测试**
  ```typescript
  // 测试示例
  describe('ConfigLoader', () => {
    it('should load config correctly', () => {
      // 测试配置加载逻辑
    });
  });
  ```

- [ ] **集成测试**
  - 测试组件交互
  - 测试文件操作
  - 测试插件系统

### 18. 自动化测试
- [ ] **CI/CD 集成**
  - 配置 GitHub Actions
  - 自动运行测试套件
  - 自动化构建和部署

---

## 🚀 迁移计划

### 阶段一：基础重构（第1-2周）
1. 清理项目文件和目录结构
2. 重构配置管理系统
3. 优化类型定义

### 阶段二：核心系统重构（第3-4周）
1. 重构插件系统
2. 优化事件系统
3. 重构文件操作模块

### 阶段三：UI层重构（第5-6周）
1. 重构组件架构
2. 优化样式系统
3. 改进用户交互

### 阶段四：质量提升（第7-8周）
1. 完善错误处理
2. 性能优化
3. 建立测试体系

---

## 📊 预期收益

### 代码质量提升
- [ ] 减少 50% 的代码重复
- [ ] 提高 80% 的类型安全性
- [ ] 减少 70% 的潜在 bug

### 开发效率提升
- [ ] 新功能开发速度提升 40%
- [ ] 代码调试时间减少 60%
- [ ] 新人上手时间减少 50%

### 维护成本降低
- [ ] 代码维护成本降低 50%
- [ ] 新需求响应时间减少 30%
- [ ] 系统稳定性提升 80%

---

## ⚠️ 风险提示

1. **功能回归风险**：重构过程中可能影响现有功能
2. **数据迁移风险**：配置文件格式变更可能导致数据丢失
3. **插件兼容性风险**：插件API变更可能影响现有插件

### 风险缓解措施
- [ ] 建立完整的测试套件
- [ ] 实现数据备份和恢复机制
- [ ] 提供插件迁移指南和工具
- [ ] 分阶段发布，逐步验证

---

## 📝 后续维护

### 代码质量保障
- [ ] 建立代码审查流程
- [ ] 定期重构和清理
- [ ] 持续性能监控

### 架构演进
- [ ] 定期架构评审
- [ ] 技术栈升级计划
- [ ] 新技术调研和应用

---

*本重构计划旨在将当前的"史山"代码转化为清晰、可维护、高质量的现代化应用。建议按阶段执行，确保每个阶段的质量和稳定性。*
