// 计算索引
// @ input {string[]} paths - 路径数组
// @ return {object} - 包含索引和路径的对象
// @ example
//   const paths = ['A/B/C', 'A/B/D', 'A/E/F'];
//   const result = calculateIndex(paths);
//   console.log(result);
// { A: { B: { C: { }, D: { } }, E: { F: { } } } }

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