/**
 * 数据结构工具函数
 * 提供与业务解耦的数据结构操作功能
 */

/**
 * 计算索引结构
 * 将路径数组转换为嵌套对象结构
 * @param paths 路径数组
 * @returns 包含索引和路径的对象
 * @example
 *   const paths = ['A/B/C', 'A/B/D', 'A/E/F'];
 *   const result = calculateIndexStructure(paths);
 *   console.log(result);
 *   // { A: { B: { C: { }, D: { } }, E: { F: { } } } }
 */
export function calculateIndexStructure(paths: string[]): Record<string, any> {
    const index: Record<string, any> = {};

    paths.forEach(path => {
        const parts = path.split('/');
        let current = index;

        parts.forEach(part => {
            if (!current[part]) {
                current[part] = {};
            }
            current = current[part];
        });
    });

    return index;
}

/**
 * 单例装饰器
 * 确保类只有一个实例
 * @param target 目标类
 * @returns 单例类
 */
export function SingletonDecorator<T extends { new(...args: any[]): {} }>(target: T): T {
  let instance: any;

  return class extends target {
    constructor(...args: any[]) {
      if (instance) {
        return instance;
      }
      super(...args);
      instance = this;
    }
  };
}
