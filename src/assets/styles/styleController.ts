// // 设置 s-page 元素的 --color-gradienting 属性,从而实现均匀过渡
// // 获取 s-page 的 --color-gradient-from 和 --color-gradient-to 属性,并且通过一个loop 不断渐变它的颜色
// type Color = {
//     r: number;
//     g: number;
//     b: number;
// };

// const duration = 1000; // 渐变时间 ms
// const step = 1; // 渐变步长 ms
// let gradientColorIntervalInstance: ReturnType<typeof setInterval> | null = null;

// function setGradientColor() {
//     const sPage = document.querySelector('s-page');
//     if (!sPage) {
//         console.error('s-page element not found');
//         return;
//     }
//     const colorFromStr = getComputedStyle(sPage).getPropertyValue('--color-gradient-from').trim();
//     const colorToStr = getComputedStyle(sPage).getPropertyValue('--color-gradient-to').trim();
//     const colorFrom = parseColor(colorFromStr);
//     const colorTo = parseColor(colorToStr);
//     let currentStep = 0;

//     // debug
//     console.log('Setting gradient color from:', colorFrom, 'to:', colorTo);

//     const interval = setInterval(() => {
//         currentStep += step;
//         const progress = Math.min(currentStep / duration, 1);
//         const newColor = interpolateColor(colorFrom, colorTo, Math.abs(progress - 0.5) * 2); // 使用正弦函数使渐变更平滑
//         if (progress >= 1) {
//             currentStep = 0; // 重置步数
//         }
//         // debug
//         console.log(`Gradient step ${currentStep}:`, newColor);
//         sPage.style.setProperty('--color-gradienting', newColor);
//     }, step);
//     return interval;
// }

// // 将RGB颜色值转换为十六进制格式
// function rgbToHex(r: number, g: number, b: number): string {
//     const toHex = (n: number) => {
//         const hex = Math.max(0, Math.min(255, Math.round(n))).toString(16);
//         return hex.length === 1 ? '0' + hex : hex;
//     };
//     return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
// }

// function interpolateColor(colorFrom: Color, colorTo: Color, progress: number): string {
//     const r = Math.round(colorFrom.r + (colorTo.r - colorFrom.r) * progress);
//     const g = Math.round(colorFrom.g + (colorTo.g - colorFrom.g) * progress);
//     const b = Math.round(colorFrom.b + (colorTo.b - colorFrom.b) * progress);
//     return rgbToHex(r, g, b);
// }

// function parseColor(color: string): Color {
//     // 检查是否是十六进制颜色格式
//     if (color.startsWith('#')) {
//         const hex = color.substring(1);
//         // 处理#RGB和#RRGGBB两种格式
//         const r = hex.length === 3 ? parseInt(hex[0] + hex[0], 16) : parseInt(hex.substring(0, 2), 16);
//         const g = hex.length === 3 ? parseInt(hex[1] + hex[1], 16) : parseInt(hex.substring(2, 4), 16);
//         const b = hex.length === 3 ? parseInt(hex[2] + hex[2], 16) : parseInt(hex.substring(4, 6), 16);
//         return { r, g, b };
//     }
//     // 处理rgb(r, g, b)格式
//     const rgb = color.match(/\d+/g);
//     if (!rgb || rgb.length < 3) {
//         throw new Error('Invalid color format. Expected rgb(r, g, b) or #RRGGBB');
//     }
//     return {
//         r: parseInt(rgb[0], 10),
//         g: parseInt(rgb[1], 10),
//         b: parseInt(rgb[2], 10)
//     };
// }

// gradientColorIntervalInstance = setGradientColor() || null;

// import { EventSystem,EventType } from "@/scripts/core/EventSystem";
// EventSystem.on(EventType.themeChange, () => {
//     if (gradientColorIntervalInstance) {
//         clearInterval(gradientColorIntervalInstance);
//     }
//     gradientColorIntervalInstance = setGradientColor() || null;
// });