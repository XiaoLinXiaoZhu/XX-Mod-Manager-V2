<template>
  <div 
    class="animated-element"
    ref="elementRef"
    :style="elementStyle"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onBeforeUnmount, watch } from 'vue';
let Mounted = false;

// 旋转模式类型
export type RotationMode = "none" | "simple" | "simulation";
const props = defineProps<{
  // 目标位置
  targetX: number;
  targetY: number;
  // 初始位置（可选，默认为0, 0）
  initialX?: number;
  initialY?: number;
  // 尺寸
  width?: number | string;
  height?: number | string;
  // 动画配置
  easing?: number;      // 位移缓动系数
  rotationEasing?: number; // 旋转缓动系数
  maxRotation?: number; // 最大旋转角度
  // 稳定延迟时间（毫秒）
  stabilityDelay?: number;
  // 初始状态是否静止
  initiallyStatic?: boolean;
  // 旋转模式，默认为简单旋转
  rotationMode?: RotationMode;
  // 鼠标位置（仿真旋转模式使用）
  mouseX?: number;
  mouseY?: number;
}>();

// 默认值
const DEFAULT_EASING = 0.1;
const DEFAULT_ROTATION_EASING = 0.12;
const DEFAULT_MAX_ROTATION = 15;
const DEFAULT_STABILITY_DELAY = 200;

// 动态状态
const currentX = ref(props.initialX ?? 0);
const currentY = ref(props.initialY ?? 0);
const velocity = reactive({ x: 0, y: 0 });
const currentRotation = ref(0);
const isMoving = ref(!props.initiallyStatic);
const lastUpdateTime = ref(Date.now());
const lastTargetChange = ref(Date.now());
const animationFrameId = ref<number | null>(null);
const elementRef = ref<HTMLElement | null>(null);

// 创建计算属性，用于设置元素样式
const elementStyle = computed(() => {
  return {
    transform: `translate(${currentX.value}px, ${currentY.value}px) rotate(${currentRotation.value}deg)`,
    width: typeof props.width === 'number' ? `${props.width}px` : props.width,
    height: typeof props.height === 'number' ? `${props.height}px` : props.height,
    position: 'absolute' as const,
    transition: isMoving.value ? 'none' : 'all 0.3s ease',
  };
});

// 获取实际使用的参数值
const getEasing = () => props.easing ?? DEFAULT_EASING;
const getRotationEasing = () => props.rotationEasing ?? DEFAULT_ROTATION_EASING;
const getMaxRotation = () => props.maxRotation ?? DEFAULT_MAX_ROTATION;
const getStabilityDelay = () => props.stabilityDelay ?? DEFAULT_STABILITY_DELAY;
const mouseXRelativeToElement = ref(0);
const mouseYRelativeToElement = ref(0);



// 监听目标位置变化
watch(() => [props.targetX, props.targetY], () => {
  // 记录目标变化时间
  lastTargetChange.value = Date.now();
  
  // 如果当前没有在移动，开始动画
  if (!isMoving.value && Mounted) {
    isMoving.value = true;
    startAnimation();
  }
}, { immediate: true });

watch(() => [props.mouseX, props.mouseY], () => {
    const el = elementRef.value;
    if (el) {
        // 计算鼠标位置相对于元素的偏移
        const rect = el.getBoundingClientRect();
        mouseXRelativeToElement.value = props.mouseX !== undefined ? props.mouseX - rect.left : rect.width / 2;
        mouseYRelativeToElement.value = props.mouseY !== undefined ? props.mouseY - rect.top : rect.height / 2;
    }
});

// 开始动画循环
const startAnimation = () => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
  }
  animationFrameId.value = requestAnimationFrame(animateFrame);
};

// 动画帧处理函数
const animateFrame = () => {
  if (!isMoving.value) return;
  
  const now = Date.now();
  const deltaTime = Math.min(32, now - lastUpdateTime.value); // 限制最大时间步长
  const normalizedDeltaTime = deltaTime / 16.67; // 基于 60fps 的标准化时间
  lastUpdateTime.value = now;
  
  // 计算当前位置与目标位置的差距
  const dx = props.targetX - currentX.value;
  const dy = props.targetY - currentY.value;
  
  // 使用缓动系数计算本次移动距离
  const easing = getEasing() * normalizedDeltaTime;
  const moveX = dx * easing;
  const moveY = dy * easing;
  
  // 更新位置
  currentX.value += moveX;
  currentY.value += moveY;
    // 计算速度（用于旋转效果）
  velocity.x = moveX / deltaTime * 1000; // 速度单位：像素/秒
  velocity.y = moveY / deltaTime * 1000;
  
  // 根据旋转模式计算旋转角度
  const rotationMode = props.rotationMode || "simple";
  const rotationEasing = getRotationEasing() * normalizedDeltaTime;
  let targetRotation = 0;

  if (rotationMode === "none") {
    // 不旋转模式，目标角度始终为0
    targetRotation = 0;
  } 
  else if (rotationMode === "simple") {
    // 简单旋转模式，仅考虑水平速度
    const moveDirection = Math.sign(velocity.x);
    const maxSpeed = 500; // 预期的最大速度（像素/秒）
    const speedFactor = Math.min(1, Math.abs(velocity.x) / maxSpeed);
    targetRotation = moveDirection * getMaxRotation() * speedFactor;
  } 
  else if (rotationMode === "simulation") {    // 仿真旋转模式，使用物理公式
    // 计算相对于卡片中心的鼠标位置
    const width = typeof props.width === 'number' ? props.width : parseFloat(props.width || '0');
    const height = typeof props.height === 'number' ? props.height : parseFloat(props.height || '0');
    
    // 卡片中心位置
    const centerX = width / 2;
    const centerY = height / 2;

    
    // 鼠标位置相对于卡片中心的偏移
    const x = (mouseXRelativeToElement.value !== undefined ? mouseXRelativeToElement.value : centerX) - centerX;
    const y = (mouseYRelativeToElement.value !== undefined ? mouseYRelativeToElement.value : centerY) - centerY;

    // 目标位置与当前位置的差值向量 (z, w)
    const z = dx;
    const w = dy;
    
    // 当前旋转角（弧度）
    const thetaRad = currentRotation.value * (Math.PI / 180);
    
    // 物理参数调整 - 根据卡片大小和鼠标位置调整力矩系数
    const massDistribution = 1 || Math.min(width, height) * 0.01; // 质量分布系数
    const momentumFactor = 0.5 + 0.5 * Math.min(2,(Math.abs(z) + Math.abs(w)) / Math.max(50, Math.abs(x) + Math.abs(y)) ); // 动量因子

    // 计算旋转增量 dθ = x(wcosθ−zsinθ)−y(zcosθ+wsinθ) * k
    const dTheta = (
      x * (w * Math.cos(thetaRad) - z * Math.sin(thetaRad)) -
      y * (z * Math.cos(thetaRad) + w * Math.sin(thetaRad))
    ) * getRotationEasing() * 0.0008 * massDistribution * momentumFactor;
    
    // 将旋转增量转换为角度
    const dThetaDeg = dTheta * (180 / Math.PI);
    
    // debug
    console.log(`dTheta: ${dThetaDeg.toFixed(2)}° momentumFactor${momentumFactor}`);
    // 限制最大旋转速度并应用一些阻尼
    const dampingFactor = 0.8 + 0.2 * (1 - Math.min(1, Math.abs(dThetaDeg) / 10));
    targetRotation = momentumFactor * currentRotation.value * dampingFactor + Math.max(-6, Math.min(6, dThetaDeg));
  }
    // 使用缓动平滑应用旋转
  if (rotationMode === "simulation") {
    // 仿真模式使用调整后的目标旋转角，但应用更小的缓动效果以保持物理感
    currentRotation.value += (targetRotation - currentRotation.value) * rotationEasing * 1.5;
  } else {
    // 其他模式使用标准缓动效果
    currentRotation.value += (targetRotation - currentRotation.value) * rotationEasing;
  }
  
  // 限制最大旋转角度（对所有模式都适用）
  const maxRotation = getMaxRotation();
  currentRotation.value = Math.max(-maxRotation, Math.min(maxRotation, currentRotation.value));
  
  // 微调角度，防止微小抖动
  if (Math.abs(currentRotation.value) < 0.05 && Math.abs(targetRotation) < 0.05) {
    currentRotation.value = 0;
  }
  
  // 检查是否接近目标位置且自上次目标更改后已经过了稳定延迟时间
  const threshold = 0.1;
  const isNearTarget = Math.abs(dx) < threshold && Math.abs(dy) < threshold;
  const isStable = now - lastTargetChange.value > getStabilityDelay();
  
  if (isNearTarget && isStable) {
    // 到达目标位置并且稳定，精确设置位置
    currentX.value = props.targetX;
    currentY.value = props.targetY;
    
    // 逐渐归零旋转角度
    currentRotation.value *= 0.8;
    
    // 如果旋转角度很小，直接归零并停止动画
    if (Math.abs(currentRotation.value) < 0.1) {
      currentRotation.value = 0;
      isMoving.value = false;
      if (animationFrameId.value !== null) {
        cancelAnimationFrame(animationFrameId.value);
        animationFrameId.value = null;
      }
      return;
    }
  }
  
  // 继续下一帧动画
  animationFrameId.value = requestAnimationFrame(animateFrame);
};

// 组件挂载时设置初始位置和开始动画（如果需要）
onMounted(() => {
  currentX.value = props.initialX ?? 0;
  currentY.value = props.initialY ?? 0;
  
    Mounted = true;

  if (!props.initiallyStatic) {
    startAnimation();
  }
});

// 组件卸载前清理
onBeforeUnmount(() => {
  if (animationFrameId.value !== null) {
    cancelAnimationFrame(animationFrameId.value);
    animationFrameId.value = null;
  }
});

// 暴露方法供父组件调用
defineExpose({
  // 设置当前位置（无动画）
  setPosition: (x: number, y: number) => {
    currentX.value = x;
    currentY.value = y;
  },
  // 判断是否在移动中
  isInMotion: () => isMoving.value,
  // 获取当前位置
  getCurrentPosition: () => ({ x: currentX.value, y: currentY.value }),
});
</script>

<style scoped>
.animated-element {
  will-change: transform;
  transform-style: preserve-3d;
  perspective: 1000px;
}
</style>
