/**
 * 3DMigoto INI 文件类型定义
 * 完整支持所有 3DMigoto section 类型
 */

// ============================================================================
// 基础类型
// ============================================================================

/** 变量作用域 */
export type VariableScope = 'global' | 'local';

/** 按键类型 */
export type KeyType = 'cycle' | 'toggle' | 'hold';

/** Buffer 格式 */
export type BufferFormat = string;

/** 资源类型 */
export type ResourceType = 'Buffer' | 'Texture2D' | 'RWBuffer' | 'StructuredBuffer' | string;

/** Handling 类型 */
export type HandlingType = 'skip' | 'default' | string;

// ============================================================================
// 变量定义
// ============================================================================

export interface VariableDefinition {
  name: string;
  scope: VariableScope;
  persist: boolean;
  defaultValue: string | number;
}

// ============================================================================
// 按键绑定
// ============================================================================

export interface KeyBinding {
  sectionName: string;
  /** 按键（如 'y', 'VK_DOWN', 'ctrl 1', 'no_alt VK_UP'） */
  key: string;
  type: KeyType;
  condition?: string;
  variableChanges: Array<{
    variable: string;
    values: (string | number)[];
  }>;
  commands?: string[];
}

// ============================================================================
// 纹理覆盖
// ============================================================================

export interface TextureOverride {
  sectionName: string;
  hash: string;
  matchFirstIndex?: number;
  handling?: HandlingType;
  ib?: string;
  vertexBuffers: Record<string, string>;
  textureSlots: Record<string, string>;
  run?: string;
  drawCalls: DrawCall[];
  conditionalBlocks: ConditionalBlock[];
  checkTextureOverrides: string[];
}

export interface DrawCall {
  type: 'draw' | 'drawindexed';
  count: number;
  offset: number;
  baseVertex?: number;
}

export interface ConditionalBlock {
  condition: string;
  operations: SectionOperation[];
}

export interface SectionOperation {
  type: 'assignment' | 'draw' | 'run' | 'resource';
  key: string;
  value: string;
}

// ============================================================================
// 着色器覆盖
// ============================================================================

export interface ShaderOverride {
  sectionName: string;
  hash: string;
  allowDuplicateHash?: string;
  filterIndex?: number;
  handling?: string;
  /** 变量赋值 */
  assignments: Record<string, string>;
  run?: string;
}

// ============================================================================
// 着色器正则
// ============================================================================

export interface ShaderRegex {
  sectionName: string;
  shaderModel?: string;
  temps?: string;
  filterIndex?: number;
  preCommands: string[];
  postCommands: string[];
  /** .Pattern 子段内容 */
  pattern?: string;
  /** .InsertDeclarations 子段内容 */
  insertDeclarations?: string;
  /** .Pattern.Replace 子段内容 */
  patternReplace?: string;
}

// ============================================================================
// 资源定义
// ============================================================================

export interface ResourceDefinition {
  sectionName: string;
  type?: ResourceType;
  stride?: number;
  format?: BufferFormat;
  filename?: string;
  data?: string;
  array?: number;
}

// ============================================================================
// 命令列表
// ============================================================================

export interface CommandList {
  sectionName: string;
  preCommands: string[];
  postCommands: string[];
  commands: string[];
  conditionalBlocks: ConditionalBlock[];
}

// ============================================================================
// 自定义着色器
// ============================================================================

export interface CustomShader {
  sectionName: string;
  blend?: string;
  blendFactor?: number[];
  textureSlots: Record<string, string>;
  drawCalls: DrawCall[];
}

// ============================================================================
// Present
// ============================================================================

export interface PresentDefinition {
  preCommands: string[];
  postCommands: string[];
  run?: string[];
  conditionalBlocks: ConditionalBlock[];
}

// ============================================================================
// 原始 Section
// ============================================================================

export interface RawSection {
  name: string;
  properties: Record<string, string>;
  /** 原始行（保留注释和格式） */
  lines: string[];
}

// ============================================================================
// 完整解析结果
// ============================================================================

export interface ParsedIni {
  /** 原始文件路径 */
  filePath: string;

  /** 命名空间 */
  namespace?: string;

  /** 文件头注释 */
  headerComments: string[];

  /** 常量/变量定义 */
  constants: VariableDefinition[];

  /** 按键绑定 */
  keyBindings: KeyBinding[];

  /** Present */
  present?: PresentDefinition;

  /** 纹理覆盖 */
  textureOverrides: TextureOverride[];

  /** 着色器覆盖 */
  shaderOverrides: ShaderOverride[];

  /** 着色器正则 */
  shaderRegexes: ShaderRegex[];

  /** 资源定义 */
  resources: ResourceDefinition[];

  /** 命令列表 */
  commandLists: CommandList[];

  /** 自定义着色器 */
  customShaders: CustomShader[];

  /** 所有 hash 值 */
  hashes: Set<string>;

  /** 未识别的 section */
  unknownSections: RawSection[];
}
