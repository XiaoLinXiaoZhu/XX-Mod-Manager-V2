/**
 * 角色识别器
 * 根据 hash 值识别 mod 对应的角色
 */

import type {
  GameConfig,
  CharacterDefinition,
  CharacterMatch,
  ModCharacterAnalysis,
} from './character-types';
import { scanModHashes } from './conflict-detector';

/**
 * 角色识别器
 */
export class CharacterRecognizer {
  private hashToCharacter: Map<string, CharacterDefinition> = new Map();
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.buildIndex();
  }

  /**
   * 构建 hash -> 角色 索引
   */
  private buildIndex(): void {
    this.hashToCharacter.clear();
    for (const char of this.config.characters) {
      for (const hash of char.hashes) {
        this.hashToCharacter.set(hash.toLowerCase(), char);
      }
    }
  }

  /**
   * 更新配置
   */
  updateConfig(config: GameConfig): void {
    this.config = config;
    this.buildIndex();
  }

  /**
   * 根据 hash 集合识别角色
   */
  recognizeFromHashes(hashes: Set<string> | string[]): CharacterMatch[] {
    const hashSet = hashes instanceof Set ? hashes : new Set(hashes);
    const characterScores = new Map<string, { char: CharacterDefinition; matched: string[] }>();

    for (const hash of hashSet) {
      const char = this.hashToCharacter.get(hash.toLowerCase());
      if (char) {
        const existing = characterScores.get(char.id) || { char, matched: [] };
        existing.matched.push(hash);
        characterScores.set(char.id, existing);
      }
    }

    // 计算置信度并排序
    const results: CharacterMatch[] = [];
    for (const { char, matched } of characterScores.values()) {
      const confidence = matched.length / char.hashes.length;
      results.push({
        character: char,
        matchedHashes: matched,
        confidence: Math.min(confidence, 1),
      });
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 分析 mod 目录，识别角色
   */
  async analyzeMod(modPath: string): Promise<ModCharacterAnalysis> {
    const modInfo = await scanModHashes(modPath);
    const matches = this.recognizeFromHashes(modInfo.hashes);

    // 找出未识别的 hash
    const matchedHashes = new Set<string>();
    for (const match of matches) {
      for (const hash of match.matchedHashes) {
        matchedHashes.add(hash);
      }
    }

    const unknownHashes = Array.from(modInfo.hashes).filter(
      (h) => !matchedHashes.has(h)
    );

    return {
      modName: modInfo.name,
      modPath: modInfo.path,
      characters: matches,
      unknownHashes,
    };
  }

  /**
   * 批量分析多个 mod
   */
  async analyzeMods(modPaths: string[]): Promise<ModCharacterAnalysis[]> {
    const results: ModCharacterAnalysis[] = [];
    for (const path of modPaths) {
      results.push(await this.analyzeMod(path));
    }
    return results;
  }

  /**
   * 获取所有已配置的角色
   */
  getCharacters(): CharacterDefinition[] {
    return this.config.characters;
  }

  /**
   * 根据 ID 获取角色
   */
  getCharacterById(id: string): CharacterDefinition | undefined {
    return this.config.characters.find((c) => c.id === id);
  }

  /**
   * 根据 hash 获取角色
   */
  getCharacterByHash(hash: string): CharacterDefinition | undefined {
    return this.hashToCharacter.get(hash.toLowerCase());
  }
}

/**
 * 从 JSON 文件加载游戏配置
 */
export async function loadGameConfig(configPath: string): Promise<GameConfig> {
  const content = await Bun.file(configPath).text();
  return JSON.parse(content) as GameConfig;
}

/**
 * 保存游戏配置到 JSON 文件
 */
export async function saveGameConfig(
  config: GameConfig,
  configPath: string
): Promise<void> {
  await Bun.write(configPath, JSON.stringify(config, null, 2));
}
