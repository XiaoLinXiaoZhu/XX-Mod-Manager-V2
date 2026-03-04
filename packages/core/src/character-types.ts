/**
 * 角色识别器类型定义
 */

/** 角色定义 */
export interface CharacterDefinition {
  /** 角色 ID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 本地化名称 */
  localizedNames?: Record<string, string>;
  /** 角色特征 hash 列表 */
  hashes: string[];
  /** 角色分类（如：代理人、敌人、NPC） */
  category?: string;
  /** 角色图标路径 */
  icon?: string;
}

/** 游戏配置 */
export interface GameConfig {
  /** 游戏 ID */
  id: string;
  /** 游戏名称 */
  name: string;
  /** 游戏版本 */
  version?: string;
  /** 角色列表 */
  characters: CharacterDefinition[];
}

/** 角色识别结果 */
export interface CharacterMatch {
  /** 角色定义 */
  character: CharacterDefinition;
  /** 匹配的 hash 数量 */
  matchedHashes: string[];
  /** 匹配置信度 (0-1) */
  confidence: number;
}

/** Mod 角色分析结果 */
export interface ModCharacterAnalysis {
  /** Mod 名称 */
  modName: string;
  /** Mod 路径 */
  modPath: string;
  /** 识别到的角色（按置信度排序） */
  characters: CharacterMatch[];
  /** 未识别的 hash */
  unknownHashes: string[];
}
