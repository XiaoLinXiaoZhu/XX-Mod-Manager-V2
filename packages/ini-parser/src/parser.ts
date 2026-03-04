/**
 * 3DMigoto INI 文件解析器
 * 完整支持所有 section 类型
 */

import type {
  ParsedIni,
  RawSection,
  VariableDefinition,
  KeyBinding,
  TextureOverride,
  ShaderOverride,
  ShaderRegex,
  ResourceDefinition,
  CommandList,
  CustomShader,
  PresentDefinition,
  DrawCall,
  ConditionalBlock,
  KeyType,
} from './types';

// ============================================================================
// 原始 INI 解析
// ============================================================================

interface RawIniResult {
  namespace?: string;
  headerComments: string[];
  sections: RawSection[];
}

function parseRawIni(content: string): RawIniResult {
  const headerComments: string[] = [];
  const sections: RawSection[] = [];
  let currentSection: RawSection | null = null;
  let inHeader = true;
  let namespace: string | undefined;

  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // 检测 namespace（文件级别）
    if (trimmed.toLowerCase().startsWith('namespace')) {
      const match = trimmed.match(/^namespace\s*=\s*(.+)$/i);
      if (match) {
        namespace = match[1].trim();
        continue;
      }
    }

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

    // 跳过空行，保留注释
    if (!trimmed) continue;
    if (trimmed.startsWith(';')) {
      if (currentSection) {
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
        currentSection.properties[key] = value;
        currentSection.properties[key.toLowerCase()] = value;
      }
    }
  }

  return { namespace, headerComments, sections };
}

// ============================================================================
// Section 解析器
// ============================================================================

function parseConstants(section: RawSection): VariableDefinition[] {
  const variables: VariableDefinition[] = [];

  for (const line of section.lines) {
    const match = line.match(
      /^(global\s+)?(persist\s+)?(global\s+)?\$(\w+)\s*=\s*(.+)$/i
    );
    if (match) {
      const isGlobal = !!(match[1] || match[3]);
      const isPersist = !!match[2];
      const name = match[4];
      const rawValue = match[5].trim();
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

  for (const line of section.lines) {
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

    const runMatch = line.match(/^run\s*=\s*(.+)$/i);
    if (runMatch) {
      binding.commands!.push(runMatch[1].trim());
    }
  }

  return binding;
}

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

  for (const [key, value] of Object.entries(props)) {
    if (/^vb\d+$/i.test(key)) {
      override.vertexBuffers[key.toLowerCase()] = value;
    }
    if (/^ps-t\d+$/i.test(key)) {
      override.textureSlots[key.toLowerCase()] = value;
    }
    if (key.toLowerCase() === 'checktextureoverride') {
      override.checkTextureOverrides.push(value);
    }
  }

  let currentCondition: ConditionalBlock | null = null;

  for (const line of section.lines) {
    const ifMatch = line.match(/^(if|elif)\s+(.+)$/i);
    if (ifMatch) {
      currentCondition = { condition: ifMatch[2], operations: [] };
      override.conditionalBlocks.push(currentCondition);
      continue;
    }

    if (/^endif$/i.test(line)) {
      currentCondition = null;
      continue;
    }

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

function parseShaderOverride(section: RawSection): ShaderOverride | null {
  const props = section.properties;
  const hash = props['hash'];
  if (!hash) return null;

  const override: ShaderOverride = {
    sectionName: section.name,
    hash: hash.toLowerCase(),
    allowDuplicateHash: props['allow_duplicate_hash'],
    filterIndex: props['filter_index'] ? parseFloat(props['filter_index']) : undefined,
    handling: props['handling'],
    assignments: {},
    run: props['run'],
  };

  // 收集变量赋值
  for (const line of section.lines) {
    const assignMatch = line.match(/^\$(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
      override.assignments[`$${assignMatch[1]}`] = assignMatch[2].trim();
    }
  }

  return override;
}

function parseShaderRegex(
  section: RawSection,
  allSections: RawSection[]
): ShaderRegex {
  const props = section.properties;
  const baseName = section.name;

  const regex: ShaderRegex = {
    sectionName: baseName,
    shaderModel: props['shader_model'],
    temps: props['temps'],
    filterIndex: props['filter_index'] ? parseFloat(props['filter_index']) : undefined,
    preCommands: [],
    postCommands: [],
  };

  // 解析 pre/post 命令
  for (const line of section.lines) {
    if (line.toLowerCase().startsWith('pre ')) {
      regex.preCommands.push(line.slice(4).trim());
    } else if (line.toLowerCase().startsWith('post ')) {
      regex.postCommands.push(line.slice(5).trim());
    }
  }

  // 查找子段
  for (const s of allSections) {
    if (s.name === `${baseName}.Pattern`) {
      regex.pattern = s.lines.join('\n');
    } else if (s.name === `${baseName}.InsertDeclarations`) {
      regex.insertDeclarations = s.lines.join('\n');
    } else if (s.name === `${baseName}.Pattern.Replace`) {
      regex.patternReplace = s.lines.join('\n');
    }
  }

  return regex;
}

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
    if (line.toLowerCase().startsWith('pre ')) {
      commandList.preCommands.push(line.slice(4).trim());
      continue;
    }
    if (line.toLowerCase().startsWith('post ')) {
      commandList.postCommands.push(line.slice(5).trim());
      continue;
    }

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

function parseCustomShader(section: RawSection): CustomShader {
  const props = section.properties;
  const shader: CustomShader = {
    sectionName: section.name,
    blend: props['blend'],
    textureSlots: {},
    drawCalls: [],
  };

  const blendFactors: number[] = [];
  for (let i = 0; i < 4; i++) {
    const factor = props[`blend_factor[${i}]`];
    if (factor) blendFactors.push(parseFloat(factor));
  }
  if (blendFactors.length > 0) shader.blendFactor = blendFactors;

  for (const [key, value] of Object.entries(props)) {
    if (/^ps-t\d+$/i.test(key)) {
      shader.textureSlots[key.toLowerCase()] = value;
    }
  }

  for (const line of section.lines) {
    const drawMatch = line.match(/^(draw|drawindexed)\s*=\s*(.+)$/i);
    if (drawMatch) {
      const drawCall = parseDrawCall(drawMatch[1], drawMatch[2]);
      if (drawCall) shader.drawCalls.push(drawCall);
    }
  }

  return shader;
}

function parsePresent(section: RawSection): PresentDefinition {
  const present: PresentDefinition = {
    preCommands: [],
    postCommands: [],
    run: [],
    conditionalBlocks: [],
  };

  let currentCondition: ConditionalBlock | null = null;

  for (const line of section.lines) {
    if (line.toLowerCase().startsWith('pre ')) {
      present.preCommands.push(line.slice(4).trim());
      continue;
    }
    if (line.toLowerCase().startsWith('post ')) {
      present.postCommands.push(line.slice(5).trim());
      continue;
    }

    const ifMatch = line.match(/^(if|elif)\s+(.+)$/i);
    if (ifMatch) {
      currentCondition = { condition: ifMatch[2], operations: [] };
      present.conditionalBlocks.push(currentCondition);
      continue;
    }
    if (/^endif$/i.test(line)) {
      currentCondition = null;
      continue;
    }

    const runMatch = line.match(/^run\s*=\s*(.+)$/i);
    if (runMatch) {
      present.run!.push(runMatch[1].trim());
    }
  }

  return present;
}

// ============================================================================
// 主解析函数
// ============================================================================

/**
 * 解析 3DMigoto INI 文件
 */
export function parseIni(content: string, filePath: string = ''): ParsedIni {
  const raw = parseRawIni(content);

  const result: ParsedIni = {
    filePath,
    namespace: raw.namespace,
    headerComments: raw.headerComments,
    constants: [],
    keyBindings: [],
    present: undefined,
    textureOverrides: [],
    shaderOverrides: [],
    shaderRegexes: [],
    resources: [],
    commandLists: [],
    customShaders: [],
    hashes: new Set(),
    unknownSections: [],
  };

  // 记录已处理的 ShaderRegex 子段
  const processedSubSections = new Set<string>();

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

    // Key*
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

    // ShaderOverride*
    if (nameLower.startsWith('shaderoverride')) {
      const override = parseShaderOverride(section);
      if (override) {
        result.shaderOverrides.push(override);
        result.hashes.add(override.hash);
        continue;
      }
    }

    // ShaderRegex* (跳过子段)
    if (nameLower.startsWith('shaderregex')) {
      // 检查是否是子段
      if (section.name.includes('.')) {
        processedSubSections.add(section.name);
        continue;
      }
      const regex = parseShaderRegex(section, raw.sections);
      result.shaderRegexes.push(regex);
      continue;
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

    // 未识别的 section
    result.unknownSections.push(section);
  }

  return result;
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 从 INI 中提取所有 hash 值
 */
export function extractHashes(content: string): Set<string> {
  const parsed = parseIni(content);
  return parsed.hashes;
}

/**
 * 从 INI 中提取按键绑定
 */
export function extractKeyBindings(content: string): KeyBinding[] {
  const parsed = parseIni(content);
  return parsed.keyBindings;
}

/**
 * 从 INI 中提取变量定义
 */
export function extractVariables(content: string): VariableDefinition[] {
  const parsed = parseIni(content);
  return parsed.constants;
}
