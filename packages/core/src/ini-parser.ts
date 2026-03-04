/**
 * 3DMigoto INI 文件解析器
 * 用于解析 mod 的 ini 配置文件，提取 hash 值等关键信息
 */

export interface IniSection {
  name: string;
  properties: Record<string, string>;
}

export interface ParsedIni {
  sections: IniSection[];
}

/**
 * 解析 INI 文件内容
 */
export function parseIni(content: string): ParsedIni {
  const sections: IniSection[] = [];
  let currentSection: IniSection | null = null;

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // 跳过空行和注释
    if (!trimmed || trimmed.startsWith(';')) {
      continue;
    }

    // 检测 section 头 [SectionName]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = {
        name: sectionMatch[1],
        properties: {},
      };
      sections.push(currentSection);
      continue;
    }

    // 解析 key = value
    if (currentSection) {
      const kvMatch = trimmed.match(/^([^=]+?)\s*=\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim().toLowerCase();
        const value = kvMatch[2].trim();
        currentSection.properties[key] = value;
      }
    }
  }

  return { sections };
}

/**
 * 从解析后的 INI 中提取所有 hash 值
 * hash 值用于标识 mod 修改的游戏资源
 */
export function extractHashes(ini: ParsedIni): Set<string> {
  const hashes = new Set<string>();

  for (const section of ini.sections) {
    const hash = section.properties['hash'];
    if (hash) {
      hashes.add(hash.toLowerCase());
    }
  }

  return hashes;
}

/**
 * 从 INI 中提取 TextureOverride 段的详细信息
 * 用于更精确的冲突检测
 */
export interface TextureOverrideInfo {
  sectionName: string;
  hash: string;
  matchFirstIndex?: number;
  handling?: string;
}

export function extractTextureOverrides(ini: ParsedIni): TextureOverrideInfo[] {
  const overrides: TextureOverrideInfo[] = [];

  for (const section of ini.sections) {
    // 只处理 TextureOverride 开头的段
    if (!section.name.toLowerCase().startsWith('textureoverride')) {
      continue;
    }

    const hash = section.properties['hash'];
    if (!hash) continue;

    overrides.push({
      sectionName: section.name,
      hash: hash.toLowerCase(),
      matchFirstIndex: section.properties['match_first_index']
        ? parseInt(section.properties['match_first_index'], 10)
        : undefined,
      handling: section.properties['handling'],
    });
  }

  return overrides;
}
