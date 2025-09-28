/**
 * Mod 管理模块类型定义
 * 定义 Mod 相关的业务类型和接口
 */

// Mod 元数据接口
export interface ModMetadata {
  readonly id: string;
  readonly name: string;
  readonly location: string;
  readonly url?: string;
  readonly addDate: string;
  readonly jsonVersion: number;
  readonly category?: string;
  readonly tags: string[];
  readonly preview?: string;
  readonly description?: string;
  readonly hotkeys: Array<{ key: string; description: string }>;
}

// Mod 配置接口
export interface ModConfig {
  keepModNameAsModFolderName: boolean;
  traditionalApply: boolean;
}

// Mod 状态枚举
export enum ModStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  CONFLICTED = 'conflicted',
  ERROR = 'error'
}

// Mod 信息接口
export interface ModInfo extends ModMetadata {
  status: ModStatus;
  conflicts: string[];
  lastApplied?: string;
  size?: number;
}

// Mod 操作结果
export interface ModOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  modId?: string;
}

// Mod 加载选项
export interface ModLoadOptions {
  validateMetadata?: boolean;
  checkConflicts?: boolean;
  loadPreview?: boolean;
}

// Mod 应用选项
export interface ModApplyOptions {
  backup?: boolean;
  force?: boolean;
  dryRun?: boolean;
}

// Mod 搜索选项
export interface ModSearchOptions {
  query?: string;
  category?: string;
  tags?: string[];
  status?: ModStatus[];
  limit?: number;
  offset?: number;
}

// Mod 搜索结果
export interface ModSearchResult {
  mods: ModInfo[];
  total: number;
  hasMore: boolean;
}

// Mod 冲突信息
export interface ModConflict {
  modId: string;
  conflictingMods: string[];
  conflictType: 'file' | 'dependency' | 'version';
  description: string;
}

// Mod 依赖信息
export interface ModDependency {
  modId: string;
  version?: string;
  required: boolean;
  description?: string;
}

// 自动推荐相关类型
export type AutoRecommendType = "matchPrefix" | "matchRegex" | "matchContent";

export type AutoRecommendItem = {
    type: AutoRecommendType;
    match: string; // 匹配的字符串的正则表达式
    content: string; // 推荐的描述文本，比如补全后的内容
    callback?: (autoRecommendItem: AutoRecommendItem) => void; // 点击时的回调函数
};

// 搜索标签相关类型
export type TagType = "category" | "tags" | "name" | "description" | "location" | "hotkeys";

export type SearchTag = {
    type: TagType;
    value: string;
    disabled: boolean;
    raw: string; // 原始输入字符串
};
