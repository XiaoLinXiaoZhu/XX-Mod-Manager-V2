/**
 * 窗口管理工具函数
 * 提供窗口位置和大小管理功能
 */

import { getCurrentWindow, LogicalPosition, LogicalSize, currentMonitor } from "@tauri-apps/api/window";
import { Bounds } from './types';

///@ts-ignore
const clamp = function(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export async function getWindowBounds(): Promise<Bounds> {
    const window = await getCurrentWindow();
    const { x, y } = await window.outerPosition();
    const { width, height } = await window.innerSize();
    return { x, y, width, height };
}

const screenOverflowTolerance = 0.7; // 70% of the screen size

export async function setWindowBounds(bounds: Bounds): Promise<void> {
    const window = await getCurrentWindow();
    let { x, y, width, height } = bounds;
    // 调整 x, y, width, height 的值，确保它们在合理范围内
    const screen = await currentMonitor();
    if (!screen) return;
    const screenWidth = screen.size.width;
    const screenHeight = screen.size.height;
    x = clamp(x, -screenOverflowTolerance * width, screenWidth - width + screenOverflowTolerance * width);
    y = clamp(y, -screenOverflowTolerance * height, screenHeight - height + screenOverflowTolerance * height);
    const logicalPosition = new LogicalPosition(x, y);
    const logicalSize = new LogicalSize(width, height);
    await window.setPosition(logicalPosition);
    await window.setSize(logicalSize);
}
