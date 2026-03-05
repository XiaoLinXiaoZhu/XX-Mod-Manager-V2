/**
 * Rust CLI Wrapper
 * 
 * 通过子进程调用 Rust CLI，保持 TypeScript 接口不变
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Rust CLI 路径 (从 packages/chunk-store/src 到 crates/chunk-store-cli)
const CLI_PATH = join(__dirname, '../../../crates/chunk-store-cli/target/release/chunk-store-cli.exe');

// 检查 CLI 是否存在
function ensureCliExists(): void {
  if (!existsSync(CLI_PATH)) {
    throw new Error(
      `Rust CLI not found at ${CLI_PATH}. ` +
      `Run 'cargo build --release' in crates/chunk-store-cli first.`
    );
  }
}

/** 执行 CLI 命令 */
async function execCli(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  ensureCliExists();
  
  return new Promise((resolve, reject) => {
    const proc = spawn(CLI_PATH, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    
    proc.on('close', (code) => {
      resolve({ stdout, stderr, code: code ?? 0 });
    });
    
    proc.on('error', reject);
  });
}

/** 存储统计 */
export interface StoreStats {
  modCount: number;
  uniqueChunks: number;
  totalStoredSize: number;
  totalOriginalSize: number;
  deduplicationRatio: number;
}

/** Mod 信息 */
export interface ModInfo {
  id: string;
  name: string;
  createdAt: number;
}

/** 归档结果 */
export interface ArchiveResult {
  id: string;
  name: string;
  originalSize: number;
  fileCount: number;
  preservedCount: number;
  time: number;
}

/**
 * ModArchive - Rust 后端的 TypeScript 包装
 */
export class ModArchive {
  private archivePath: string;
  
  constructor(archivePath: string) {
    this.archivePath = archivePath;
  }
  
  /**
   * 归档 mod
   */
  async archiveMod(
    modPath: string,
    modId?: string,
    modName?: string
  ): Promise<ArchiveResult> {
    const args = ['add', modPath, '-a', this.archivePath];
    if (modId) args.push('-i', modId);
    if (modName) args.push('-n', modName);
    
    const { stdout, code } = await execCli(args);
    
    if (code !== 0) {
      throw new Error(`Archive failed: ${stdout}`);
    }
    
    // 解析输出
    const idMatch = stdout.match(/ID: (.+)/);
    const nameMatch = stdout.match(/Name: (.+)/);
    const sizeMatch = stdout.match(/Original size: ([\d.]+) MB/);
    const filesMatch = stdout.match(/Files: (\d+) resource files, (\d+) preserved/);
    const timeMatch = stdout.match(/Time: ([\d.]+)s/);
    
    return {
      id: idMatch?.[1] ?? modId ?? '',
      name: nameMatch?.[1] ?? modName ?? '',
      originalSize: parseFloat(sizeMatch?.[1] ?? '0') * 1024 * 1024,
      fileCount: parseInt(filesMatch?.[1] ?? '0'),
      preservedCount: parseInt(filesMatch?.[2] ?? '0'),
      time: parseFloat(timeMatch?.[1] ?? '0'),
    };
  }
  
  /**
   * 解压 mod
   */
  async extractMod(modId: string, outputPath: string): Promise<void> {
    const { code, stdout } = await execCli([
      'extract', modId, outputPath, '-a', this.archivePath
    ]);
    
    if (code !== 0) {
      throw new Error(`Extract failed: ${stdout}`);
    }
  }
  
  /**
   * 删除 mod
   */
  async removeMod(modId: string): Promise<boolean> {
    const { stdout } = await execCli(['remove', modId, '-a', this.archivePath]);
    return stdout.includes('Removed');
  }
  
  /**
   * 列出所有 mod
   */
  async listMods(): Promise<ModInfo[]> {
    const { stdout } = await execCli(['list', '-a', this.archivePath]);
    
    const mods: ModInfo[] = [];
    const lines = stdout.split('\n');
    
    let currentId = '';
    for (const line of lines) {
      const idMatch = line.match(/^\s{2}(\S.*)$/);
      const nameMatch = line.match(/Name: (.+)/);
      
      if (idMatch) {
        currentId = idMatch[1];
      } else if (nameMatch && currentId) {
        mods.push({
          id: currentId,
          name: nameMatch[1],
          createdAt: Date.now(), // CLI 不返回时间，用当前时间
        });
        currentId = '';
      }
    }
    
    return mods;
  }
  
  /**
   * 垃圾回收
   */
  async gc(): Promise<{ deletedChunks: number; freedSize: number }> {
    const { stdout } = await execCli(['gc', '-a', this.archivePath]);
    
    const chunksMatch = stdout.match(/Deleted chunks: (\d+)/);
    const freedMatch = stdout.match(/Freed space: ([\d.]+) MB/);
    
    return {
      deletedChunks: parseInt(chunksMatch?.[1] ?? '0'),
      freedSize: parseFloat(freedMatch?.[1] ?? '0') * 1024 * 1024,
    };
  }
  
  /**
   * 获取统计信息
   */
  async getStats(): Promise<StoreStats> {
    const { stdout } = await execCli(['stats', '-a', this.archivePath]);
    
    const modMatch = stdout.match(/Mod count: (\d+)/);
    const chunksMatch = stdout.match(/Unique chunks: (\d+)/);
    const storedMatch = stdout.match(/Stored size: ([\d.]+) MB/);
    const originalMatch = stdout.match(/Original size: ([\d.]+) MB/);
    const ratioMatch = stdout.match(/Dedup ratio: ([\d.]+)%/);
    
    return {
      modCount: parseInt(modMatch?.[1] ?? '0'),
      uniqueChunks: parseInt(chunksMatch?.[1] ?? '0'),
      totalStoredSize: parseFloat(storedMatch?.[1] ?? '0') * 1024 * 1024,
      totalOriginalSize: parseFloat(originalMatch?.[1] ?? '0') * 1024 * 1024,
      deduplicationRatio: parseFloat(ratioMatch?.[1] ?? '0') / 100,
    };
  }
  
  /**
   * 批量归档
   */
  async batchArchive(
    modsDir: string,
    onProgress?: (name: string, success: boolean) => void
  ): Promise<{ success: number; failed: number }> {
    const { stdout } = await execCli(['batch', modsDir, '-a', this.archivePath]);
    
    // 解析进度
    if (onProgress) {
      const lines = stdout.split('\n');
      for (const line of lines) {
        const match = line.match(/Archiving: (.+)\.\.\. (✅|❌)/);
        if (match) {
          onProgress(match[1], match[2] === '✅');
        }
      }
    }
    
    const resultMatch = stdout.match(/Complete: (\d+) success, (\d+) failed/);
    return {
      success: parseInt(resultMatch?.[1] ?? '0'),
      failed: parseInt(resultMatch?.[2] ?? '0'),
    };
  }
  
  // 兼容旧接口
  close(): void {
    // Rust CLI 是无状态的，不需要关闭
  }
}

// 导出 CLI 路径，方便调试
export const CLI_BINARY_PATH = CLI_PATH;
