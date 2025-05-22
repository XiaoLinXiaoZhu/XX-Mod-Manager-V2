import { getCurrentWindow,LogicalPosition,LogicalSize,currentMonitor } from "@tauri-apps/api/window";

///@ts-ignore
const clamp = function(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export type bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export async function getWindowBounds(): Promise<bounds> {
    const window = await getCurrentWindow();
    const { x, y } = await window.outerPosition();
    const { width, height } = await window.innerSize();
    return { x, y, width, height };
}

const screenOverflowTolerance = 0.7; // 70% of the screen size
export async function setWindowBounds(bounds: bounds): Promise<void> {
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