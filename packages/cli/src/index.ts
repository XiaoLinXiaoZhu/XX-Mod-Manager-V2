#!/usr/bin/env bun
/**
 * XX Mod Manager CLI
 * 模组管理器命令行工具
 */

import { Command } from 'commander';
import { conflictCommand } from './commands/conflict';
import { parseCommand } from './commands/parse';

const program = new Command();

program
  .name('xxmm')
  .description('XX Mod Manager - 游戏模组管理器')
  .version('0.1.0');

// 注册子命令
program.addCommand(conflictCommand);
program.addCommand(parseCommand);

program.parse();
