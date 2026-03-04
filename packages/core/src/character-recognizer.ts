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

/**
 * 创建默认的 ZZZ 游戏配置
 */
export function createDefaultZZZConfig(): GameConfig {
  return {
    id: 'zzz',
    name: 'Zenless Zone Zero',
    version: '1.5',
    characters: [
      {
        id: 'anby',
        name: 'Anby',
        localizedNames: { 'zh-CN': '安比' },
        category: 'agent',
        hashes: ['4816de84', '1c9533eb', 'a33e8b5e', '45b2509c'],
      },
      {
        id: 'belle',
        name: 'Belle',
        localizedNames: { 'zh-CN': '贝尔' },
        category: 'protagonist',
        hashes: ['a9673001', 'd2844c01', '11e38ebb', '801edbf4', '142ddbbc'],
      },
      {
        id: 'ellen',
        name: 'Ellen',
        localizedNames: { 'zh-CN': '艾莲' },
        category: 'agent',
        hashes: ['ba0fe600', 'a27a8e1a', '77ac5f85', 'b78f3616', '5ac6d5ee'],
      },
      {
        id: 'jane',
        name: 'Jane Doe',
        localizedNames: { 'zh-CN': '简' },
        category: 'agent',
        hashes: ['e7a3b7dc', 'acec29f8', '2d06e785', '10050266', '949549de'],
      },
      {
        id: 'nicole',
        name: 'Nicole',
        localizedNames: { 'zh-CN': '妮可' },
        category: 'agent',
        hashes: ['06e4fd79', 'f6344432', '91c1b779', '8cc1262b', '077c3500'],
      },
      {
        id: 'lucy',
        name: 'Lucy',
        localizedNames: { 'zh-CN': '露西' },
        category: 'agent',
        hashes: ['246b93e2', 'f60dbb9e', 'da79199a', '637e5139', '0d4e37c6'],
      },
      {
        id: 'vivian',
        name: 'Vivian',
        localizedNames: { 'zh-CN': '薇薇安' },
        category: 'npc',
        hashes: ['55dae493', '5c34690a', '406beb54', '2e01f7f7', '45c0ac67'],
      },
      {
        id: 'evelyn',
        name: 'Evelyn',
        localizedNames: { 'zh-CN': '伊芙琳' },
        category: 'agent',
        hashes: ['5ea06832', '26f9ba95', '02b04234', 'b43809d2', '066f6115'],
      },
      {
        id: 'corin',
        name: 'Corin',
        localizedNames: { 'zh-CN': '可琳' },
        category: 'agent',
        hashes: ['5a839fb2', '7e7eee0d', 'abc95b03', '5fa50113', 'd345e472'],
      },
    ],
  };
}
