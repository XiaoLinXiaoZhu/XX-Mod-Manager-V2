/**
 * 3DMigoto Mod 类型定义
 * 完整描述 mod 的结构和元数据
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 变量作用域 */
export type VariableScope = 'global' | 'local';

/** 变量持久化类型 */
export type VariablePersistence = 'persist' | 'transient';

/** 按键类型 */
export type KeyType = 'cycle' | 'toggle' | 'hold';

/** Buffer 格式 */
export type BufferFormat =
  | 'DXGI_FORMAT_R32_UINT'
  | 'DXGI_FORMAT_R16_UINT'
  | 'DXGI_FORMAT_R8_UINT'
  | 'R32_FLOAT'
  | string;

/** 资源类型 */
export type ResourceType = 'Buffer' | 'Texture2D' | 'StructuredBuffer' | string;

/** Handling 类型 */
export type HandlingType = 'skip' | 'default' | string;

// ============================================================================
// 变量定义
// ============================================================================

/** 变量定义 */
export interface VariableDefinition {
  /** 变量名（不含 $ 前缀） */
  name: string;
  /** 作用域 */
  scope: VariableScope;
  /** 是否持久化 */
  persist: boolean;
  /** 默认值 */
  defaultValue: string | number;
}

// ============================================================================
// 按键绑定
// ============================================================================

/** 按键绑定定义 */
export interface KeyBinding {
  /** section 名称 */
  sectionName: string;
  /** 绑定的按键（如 'y', 'VK_DOWN', '9'） */
  key: string;
  /** 按键类型 */
  type: KeyType;
  /** 触发条件 */
  condition?: string;
  /** 按键触发时修改的变量 */
  variableChanges: Array<{
    variable: string;
    values: (string | number)[];
  }>;
  /** 按键触发时执行的命令 */
  commands?: string[];
}

// ============================================================================
// 纹理覆盖
// ============================================================================

/** 纹理覆盖定义 */
export interface TextureOverride {
  /** section 名称 */
  sectionName: string;
  /** 目标 hash */
  hash: string;
  /** 匹配的第一个索引 */
  matchFirstIndex?: number;
  /** 处理方式 */
  handling?: HandlingType;
  /** 使用的 Index Buffer */
  ib?: string;
  /** 使用的 Vertex Buffer 绑定 */
  vertexBuffers: Record<string, string>;
  /** 纹理槽位绑定 (ps-t0, ps-t1, ...) */
  textureSlots: Record<string, string>;
  /** 执行的命令列表 */
  run?: string;
  /** 绘制调用 */
  drawCalls: DrawCall[];
  /** 条件分支 */
  conditionalBlocks: ConditionalBlock[];
  /** checktextureoverride 列表 */
  checkTextureOverrides: string[];
}

/** 绘制调用 */
export interface DrawCall {
  type: 'draw' | 'drawindexed';
  /** 顶点/索引数量 */
  count: number;
  /** 起始偏移 */
  offset: number;
  /** 基础顶点（仅 drawindexed） */
  baseVertex?: number;
}

/** 条件分支块 */
export interface ConditionalBlock {
  condition: string;
  /** 条件为真时的操作 */
  operations: SectionOperation[];
}

/** Section 内的操作 */
export interface SectionOperation {
  type: 'assignment' | 'draw' | 'run' | 'resource';
  key: string;
  value: string;
}

// ============================================================================
// 资源定义
// ============================================================================

/** 资源定义 */
export interface ResourceDefinition {
  /** section 名称 */
  sectionName: string;
  /** 资源类型 */
  type?: ResourceType;
  /** Buffer stride */
  stride?: number;
  /** Buffer format */
  format?: BufferFormat;
  /** 文件名 */
  filename?: string;
  /** 内联数据 */
  data?: string;
  /** 数组大小 */
  array?: number;
}

// ============================================================================
// 命令列表
// ============================================================================

/** 命令列表定义 */
export interface CommandList {
  /** section 名称 */
  sectionName: string;
  /** 前置命令 */
  preCommands: string[];
  /** 后置命令 */
  postCommands: string[];
  /** 普通命令 */
  commands: string[];
  /** 条件分支 */
  conditionalBlocks: ConditionalBlock[];
}

// ============================================================================
// 自定义着色器
// ============================================================================

/** 自定义着色器定义 */
export interface CustomShader {
  /** section 名称 */
  sectionName: string;
  /** 混合模式 */
  blend?: string;
  /** 混合因子 */
  blendFactor?: number[];
  /** 纹理槽位绑定 */
  textureSlots: Record<string, string>;
  /** 绘制调用 */
  drawCalls: DrawCall[];
}

// ============================================================================
// Present 定义
// ============================================================================

/** Present 定义（每帧执行） */
export interface PresentDefinition {
  /** 前置命令 */
  preCommands: string[];
  /** 后置命令 */
  postCommands: string[];
  /** 执行的命令列表 */
  run?: string[];
}

// ============================================================================
// 完整的 Mod INI 结构
// ============================================================================

/** 解析后的 Mod INI 完整结构 */
export interface ParsedModIni {
  /** 原始文件路径 */
  filePath: string;

  /** 文件头注释（通常包含作者信息） */
  headerComments: string[];

  /** 常量/变量定义 */
  constants: VariableDefinition[];

  /** 按键绑定 */
  keyBindings: KeyBinding[];

  /** Present 定义 */
  present?: PresentDefinition;

  /** 纹理覆盖 */
  textureOverrides: TextureOverride[];

  /** 资源定义 */
  resources: ResourceDefinition[];

  /** 命令列表 */
  commandLists: CommandList[];

  /** 自定义着色器 */
  customShaders: CustomShader[];

  /** 所有使用的 hash 值 */
  hashes: Set<string>;

  /** 原始 sections（用于未识别的 section） */
  rawSections: RawSection[];
}

/** 原始 section（未解析的） */
export interface RawSection {
  name: string;
  properties: Record<string, string>;
  lines: string[];
}

// ============================================================================
// Mod 元数据
// ============================================================================

/** Mod 元数据（从 ini 和文件夹结构推断） */
export interface ModMetadata {
  /** mod 名称 */
  name: string;
  /** mod 路径 */
  path: string;
  /** 作者（从注释中提取） */
  author?: string;
  /** 描述 */
  description?: string;
  /** 目标角色/对象（从 hash 推断） */
  targets: string[];
  /** 支持的按键切换 */
  toggleKeys: KeyBinding[];
  /** 预览图路径 */
  previewImages: string[];
  /** 所有 ini 文件 */
  iniFiles: string[];
  /** 所有资源文件 */
  resourceFiles: string[];
}

// ============================================================================
// 冲突信息
// ============================================================================

/** 详细的冲突信息 */
export interface DetailedConflictInfo {
  /** 冲突的 hash */
  hash: string;
  /** 冲突类型 */
  conflictType: 'texture' | 'model' | 'shader' | 'unknown';
  /** 涉及的 mod */
  mods: Array<{
    name: string;
    path: string;
    /** 冲突的 section */
    sections: string[];
    /** 该 mod 对此 hash 的操作 */
    operations: string[];
  }>;
  /** 冲突严重程度 */
  severity: 'critical' | 'warning' | 'info';
  /** 建议的解决方案 */
  suggestions: string[];
}
