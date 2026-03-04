/**
 * 3DMigoto INI 文件解析器
 * 完整解析 mod 的 ini 配置文件
 */

import type {
  ParsedModIni,
  RawSection,
  VariableDefinition,
  KeyBinding,
  TextureOverride,
  ResourceDefinition,
  CommandList,
  CustomShader,
  PresentDefinition,
  DrawCall,
  ConditionalBlock,
  SectionOperation,
  KeyType,
} from './types';

// ============================================================================
// 基础 INI 解析
// ============================================================================

interface ParsedRawIni {
  headerComments: string[];
  sections: RawSection[];
}

/**
 * 第一阶段：解析原始 INI 结构
 */
function parseRawIni(content: string): ParsedRawIni {
  const headerComments: string[] = [];
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;
  let inHeader = true;

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // 收集文件头注释
    if (inHeader && (trimmed.startsWith(';') || trimmed === '')) {
      if (trimmed.startsWith(';')) {
        headerComments.push(trimmed.slice(1).trim());
      }
      continue;
    }
    inHeader = false;

    // 检测 section 头 [SectionName]
    const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
    if (sectionMatch) {
      currentSection = {
        name: sectionMatch[1],
        properties: {},
        lines: [],
      };
      sections.push(currentSection);
      continue;
    }

    // 跳过空行和注释（section 内）
    if (!trimmed || trimmed.startsWith(';')) {
      if (currentSection && trimmed.startsWith(';')) {
        currentSection.lines.push(trimmed);
      }
      continue;
    }

    // 解析 key = value
    if (currentSection) {
      currentSection.lines.push(trimmed);
      const kvMatch = trimmed.match(/^([^=]+?)\s*=\s*(.*)$/);
      if (kvMatch) {
        const key = kvMatch[1].trim();
        const value = kvMatch[2].trim();
        // 保留原始大小写的 key，但也存一份小写版本用于查找
        currentSection.properties[key] = value;
        currentSection.properties[key.toLowerCase()] = value;
      }
    }
  }

  return { headerComments, sections };
}

// ============================================================================
// Constants 解析
// ============================================================================

function parseConstants(section: RawSection): VariableDefinition[] {
  const variables: VariableDefinition[] = [];

  for (const line of section.lines) {
    // 匹配: global $var = value 或 global persist $var = value
    const match = line.match(
      /^(global\s+)?(persist\s+)?(global\s+)?\$(\w+)\s*=\s*(.+)$/i
    );
    if (match) {
      const isGlobal = !!(match[1] || match[3]);
      const isPersist = !!match[2];
      const name = match[4];
      const rawValue = match[5].trim();

      // 解析值
      let defaultValue: string | number = rawValue;
      const numValue = parseFloat(rawValue);
      if (!isNaN(numValue)) {
        defaultValue = numValue;
      }

      variables.push({
        name,
        scope: isGlobal ? 'global' : 'local',
        persist: isPersist,
        defaultValue,
      });
    }
  }

  return variables;
}

// ============================================================================
// KeyBinding 解析
// ============================================================================

function parseKeyBinding(section: RawSection): KeyBinding | null {
  const props = section.properties;
  const key = props['key'];
  if (!key) return null;

  const binding: KeyBinding = {
    sectionName: section.name,
    key,
    type: (props['type'] as KeyType) || 'toggle',
    condition: props['condition'],
    variableChanges: [],
    commands: [],
  };

  // 解析变量修改
  for (const line of section.lines) {
    // 匹配: $var = value1, value2, ...
    const varMatch = line.match(/^\$(\w+)\s*=\s*(.+)$/);
    if (varMatch) {
      const variable = varMatch[1];
      const valuesStr = varMatch[2];
      const values = valuesStr.split(',').map((v) => {
        const trimmed = v.trim();
        const num = parseFloat(trimmed);
        return isNaN(num) ? trimmed : num;
      });
      binding.variableChanges.push({ variable, values });
    }

    // 匹配: run = CommandList
    const runMatch = line.match(/^run\s*=\s*(.+)$/i);
    if (runMatch) {
      binding.commands = binding.commands || [];
      binding.commands.push(runMatch[1].trim());
    }
  }

  return binding;
}

// ============================================================================
// TextureOverride 解析
// ============================================================================

function parseTextureOverride(section: RawSection): TextureOverride | null {
  const props = section.properties;
  const hash = props['hash'];
  if (!hash) return null;

  const override: TextureOverride = {
    sectionName: section.name,
    hash: hash.toLowerCase(),
    matchFirstIndex: props['match_first_index']
      ? parseInt(props['match_first_index'], 10)
      : undefined,
    handling: props['handling'],
    ib: props['ib'],
    vertexBuffers: {},
    textureSlots: {},
    run: props['run'],
    drawCalls: [],
    conditionalBlocks: [],
    checkTextureOverrides: [],
  };

  // 解析 vertex buffer 绑定 (vb0, vb1, vb2, ...)
  for (const [key, value] of Object.entries(props)) {
    if (/^vb\d+$/i.test(key)) {
      override.vertexBuffers[key.toLowerCase()] = value;
    }
    // 解析纹理槽位 (ps-t0, ps-t1, ...)
    if (/^ps-t\d+$/i.test(key)) {
      override.textureSlots[key.toLowerCase()] = value;
    }
    // checktextureoverride
    if (key.toLowerCase() === 'checktextureoverride') {
      override.checkTextureOverrides.push(value);
    }
  }

  // 解析 draw 调用和条件块
  let currentCondition: ConditionalBlock | null = null;

  for (const line of section.lines) {
    // 条件开始
    const ifMatch = line.match(/^(if|elif)\s+(.+)$/i);
    if (ifMatch) {
      currentCondition = {
        condition: ifMatch[2],
        operations: [],
      };
      override.conditionalBlocks.push(currentCondition);
      continue;
    }

    // 条件结束
    if (/^endif$/i.test(line)) {
      currentCondition = null;
      continue;
    }

    // draw 调用
    const drawMatch = line.match(/^(draw|drawindexed)\s*=\s*(.+)$/i);
    if (drawMatch) {
      const drawCall = parseDrawCall(drawMatch[1], drawMatch[2]);
      if (drawCall) {
        if (currentCondition) {
          currentCondition.operations.push({
            type: 'draw',
            key: drawMatch[1],
            value: drawMatch[2],
          });
        } else {
          override.drawCalls.push(drawCall);
        }
      }
    }
  }

  return override;
}

function parseDrawCall(type: string, value: string): DrawCall | null {
  if (value.toLowerCase() === 'auto') {
    return { type: type.toLowerCase() as 'draw' | 'drawindexed', count: -1, offset: 0 };
  }

  const parts = value.split(',').map((p) => parseInt(p.trim(), 10));
  if (parts.length >= 2) {
    return {
      type: type.toLowerCase() as 'draw' | 'drawindexed',
      count: parts[0],
      offset: parts[1],
      baseVertex: parts[2],
    };
  }
  return null;
}

// ============================================================================
// Resource 解析
// ============================================================================

function parseResource(section: RawSection): ResourceDefinition {
  const props = section.properties;

  return {
    sectionName: section.name,
    type: props['type'],
    stride: props['stride'] ? parseInt(props['stride'], 10) : undefined,
    format: props['format'],
    filename: props['filename'],
    data: props['data'],
    array: props['array'] ? parseInt(props['array'], 10) : undefined,
  };
}

// ============================================================================
// CommandList 解析
// ============================================================================

function parseCommandList(section: RawSection): CommandList {
  const commandList: CommandList = {
    sectionName: section.name,
    preCommands: [],
    postCommands: [],
    commands: [],
    conditionalBlocks: [],
  };

  let currentCondition: ConditionalBlock | null = null;

  for (const line of section.lines) {
    // pre 命令
    if (line.toLowerCase().startsWith('pre ')) {
      commandList.preCommands.push(line.slice(4).trim());
      continue;
    }
    // post 命令
    if (line.toLowerCase().startsWith('post ')) {
      commandList.postCommands.push(line.slice(5).trim());
      continue;
    }

    // 条件块
    const ifMatch = line.match(/^(if|elif)\s+(.+)$/i);
    if (ifMatch) {
      currentCondition = { condition: ifMatch[2], operations: [] };
      commandList.conditionalBlocks.push(currentCondition);
      continue;
    }
    if (/^endif$/i.test(line)) {
      currentCondition = null;
      continue;
    }

    // 普通命令
    if (!line.startsWith(';')) {
      if (currentCondition) {
        const kvMatch = line.match(/^([^=]+?)\s*=\s*(.*)$/);
        if (kvMatch) {
          currentCondition.operations.push({
            type: 'assignment',
            key: kvMatch[1].trim(),
            value: kvMatch[2].trim(),
          });
        }
      } else {
        commandList.commands.push(line);
      }
    }
  }

  return commandList;
}

// ============================================================================
// CustomShader 解析
// ============================================================================

function parseCustomShader(section: RawSection): CustomShader {
  const props = section.properties;
  const shader: CustomShader = {
    sectionName: section.name,
    blend: props['blend'],
    textureSlots: {},
    drawCalls: [],
  };

  // 解析 blend_factor
  const blendFactors: number[] = [];
  for (let i = 0; i < 4; i++) {
    const factor = props[`blend_factor[${i}]`];
    if (factor) {
      blendFactors.push(parseFloat(factor));
    }
  }
  if (blendFactors.length > 0) {
    shader.blendFactor = blendFactors;
  }

  // 解析纹理槽位
  for (const [key, value] of Object.entries(props)) {
    if (/^ps-t\d+$/i.test(key)) {
      shader.textureSlots[key.toLowerCase()] = value;
    }
  }

  // 解析 draw 调用
  for (const line of section.lines) {
    const drawMatch = line.match(/^(draw|drawindexed)\s*=\s*(.+)$/i);
    if (drawMatch) {
      const drawCall = parseDrawCall(drawMatch[1], drawMatch[2]);
      if (drawCall) {
        shader.drawCalls.push(drawCall);
      }
    }
  }

  return shader;
}

// ============================================================================
// Present 解析
// ============================================================================

function parsePresent(section: RawSection): PresentDefinition {
  const present: PresentDefinition = {
    preCommands: [],
    postCommands: [],
    run: [],
  };

  for (const line of section.lines) {
    if (line.toLowerCase().startsWith('pre ')) {
      present.preCommands.push(line.slice(4).trim());
    } else if (line.toLowerCase().startsWith('post ')) {
      present.postCommands.push(line.slice(5).trim());
    } else {
      const runMatch = line.match(/^run\s*=\s*(.+)$/i);
      if (runMatch) {
        present.run!.push(runMatch[1].trim());
      }
    }
  }

  return present;
}

// ============================================================================
// 主解析函数
// ============================================================================

/**
 * 完整解析 3DMigoto INI 文件
 */
export function parseModIni(content: string, filePath: string = ''): ParsedModIni {
  const raw = parseRawIni(content);

  const result: ParsedModIni = {
    filePath,
    headerComments: raw.headerComments,
    constants: [],
    keyBindings: [],
    present: undefined,
    textureOverrides: [],
    resources: [],
    commandLists: [],
    customShaders: [],
    hashes: new Set(),
    rawSections: [],
  };

  for (const section of raw.sections) {
    const nameLower = section.name.toLowerCase();

    // Constants
    if (nameLower === 'constants') {
      result.constants.push(...parseConstants(section));
      continue;
    }

    // Present
    if (nameLower === 'present') {
      result.present = parsePresent(section);
      continue;
    }

    // KeySwap / Key*
    if (nameLower.startsWith('key')) {
      const binding = parseKeyBinding(section);
      if (binding) {
        result.keyBindings.push(binding);
        continue;
      }
    }

    // TextureOverride*
    if (nameLower.startsWith('textureoverride')) {
      const override = parseTextureOverride(section);
      if (override) {
        result.textureOverrides.push(override);
        result.hashes.add(override.hash);
        continue;
      }
    }

    // Resource*
    if (nameLower.startsWith('resource')) {
      result.resources.push(parseResource(section));
      continue;
    }

    // CommandList*
    if (nameLower.startsWith('commandlist')) {
      result.commandLists.push(parseCommandList(section));
      continue;
    }

    // CustomShader*
    if (nameLower.startsWith('customshader')) {
      result.customShaders.push(parseCustomShader(section));
      continue;
    }

    // 未识别的 section 保留原始数据
    result.rawSections.push(section);
  }

  return result;
}

// ============================================================================
// 辅助函数（保持向后兼容）
// ============================================================================

export interface IniSection {
  name: string;
  properties: Record<string, string>;
}

export interface ParsedIni {
  sections: IniSection[];
}

/**
 * 简单解析 INI 文件（向后兼容）
 */
export function parseIni(content: string): ParsedIni {
  const raw = parseRawIni(content);
  return {
    sections: raw.sections.map((s) => ({
      name: s.name,
      properties: s.properties,
    })),
  };
}

/**
 * 从解析后的 INI 中提取所有 hash 值
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
