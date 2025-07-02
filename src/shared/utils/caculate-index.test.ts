// 计算索引
// @ input {string[]} paths - 路径数组
// @ return {object} - 包含索引和路径的对象
// @ example
//   const paths = ['A/B/C', 'A/B/D', 'A/E/F'];
//   const result = calculateIndex(paths);
//   console.log(result);
// { A: { B: { C: { }, D: { } }, E: { F: { } } } }

import {calculateIndexStructure} from './caculate-index';
import { expect, test } from "bun:test";

test('calculateIndexStructure', () => {
    const paths = ['A/B/C', 'A/B/D', 'A/E/F'];
    const result = calculateIndexStructure(paths);
    
    expect(result).toEqual({
        A: {
            B: {
                C: {},
                D: {}
            },
            E: {
                F: {}
            }
        }
    });
});

test('calculateIndexStructure with empty paths', () => {
    const paths: string[] = [];
    const result = calculateIndexStructure(paths);
    
    expect(result).toEqual({});
});