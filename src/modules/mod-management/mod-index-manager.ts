/**
 * Mod 索引管理模块
 * 提供 Mod 分类和标签的索引计算等纯函数
 */

import type { ModMetadata } from './types';

// 索引结构
export interface IndexStructure {
  [key: string]: {
    count: number;
    children?: IndexStructure;
  };
}

// 分类索引
export interface CategoryIndex {
  [category: string]: {
    count: number;
    mods: string[]; // mod IDs
    subcategories?: { [subcategory: string]: { count: number; mods: string[] } };
  };
}

// 标签索引
export interface TagIndex {
  [tag: string]: {
    count: number;
    mods: string[]; // mod IDs
  };
}

// 索引统计信息
export interface IndexStatistics {
  totalCategories: number;
  totalTags: number;
  mostUsedCategory: string;
  mostUsedTag: string;
  averageModsPerCategory: number;
  averageTagsPerMod: number;
}

/**
 * 计算分类索引结构
 */
export function calculateCategoryIndex(
  mods: ModMetadata[]
): CategoryIndex {
  const index: CategoryIndex = {};

  for (const mod of mods) {
    if (!mod.category) continue;

    const category = mod.category.trim();
    if (!category) continue;

    if (!index[category]) {
      index[category] = {
        count: 0,
        mods: []
      };
    }

    index[category].count++;
    index[category].mods.push(mod.id);
  }

  return index;
}

/**
 * 计算标签索引结构
 */
export function calculateTagIndex(
  mods: ModMetadata[]
): TagIndex {
  const index: TagIndex = {};

  for (const mod of mods) {
    if (!mod.tags || mod.tags.length === 0) continue;

    for (const tag of mod.tags) {
      const trimmedTag = tag.trim();
      if (!trimmedTag) continue;

      if (!index[trimmedTag]) {
        index[trimmedTag] = {
          count: 0,
          mods: []
        };
      }

      index[trimmedTag].count++;
      index[trimmedTag].mods.push(mod.id);
    }
  }

  return index;
}

/**
 * 计算层级索引结构（支持子分类）
 */
export function calculateHierarchicalIndex(
  mods: ModMetadata[],
  separator: string = '/'
): IndexStructure {
  const index: IndexStructure = {};

  for (const mod of mods) {
    if (!mod.category) continue;

    const categoryPath = mod.category.trim();
    if (!categoryPath) continue;

    const parts = categoryPath.split(separator).map(part => part.trim()).filter(part => part);
    if (parts.length === 0) continue;

    let currentLevel = index;
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!part) continue;
      
      currentPath = currentPath ? `${currentPath}${separator}${part}` : part;

      if (!currentLevel[part]) {
        currentLevel[part] = {
          count: 0,
          children: {}
        };
      }

      currentLevel[part].count++;

      if (i < parts.length - 1) {
        if (!currentLevel[part].children) {
          currentLevel[part].children = {};
        }
        currentLevel = currentLevel[part].children!;
      }
    }
  }

  return index;
}

/**
 * 获取分类列表（按使用频率排序）
 */
export function getCategoriesByFrequency(
  categoryIndex: CategoryIndex,
  limit?: number
): Array<{ category: string; count: number; mods: string[] }> {
  const categories = Object.entries(categoryIndex)
    .map(([category, data]) => ({
      category,
      count: data.count,
      mods: data.mods
    }))
    .sort((a, b) => b.count - a.count);

  return limit ? categories.slice(0, limit) : categories;
}

/**
 * 获取标签列表（按使用频率排序）
 */
export function getTagsByFrequency(
  tagIndex: TagIndex,
  limit?: number
): Array<{ tag: string; count: number; mods: string[] }> {
  const tags = Object.entries(tagIndex)
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      mods: data.mods
    }))
    .sort((a, b) => b.count - a.count);

  return limit ? tags.slice(0, limit) : tags;
}

/**
 * 搜索分类
 */
export function searchCategories(
  categoryIndex: CategoryIndex,
  query: string
): Array<{ category: string; count: number; mods: string[] }> {
  const lowerQuery = query.toLowerCase();
  
  return Object.entries(categoryIndex)
    .filter(([category]) => category.toLowerCase().includes(lowerQuery))
    .map(([category, data]) => ({
      category,
      count: data.count,
      mods: data.mods
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 搜索标签
 */
export function searchTags(
  tagIndex: TagIndex,
  query: string
): Array<{ tag: string; count: number; mods: string[] }> {
  const lowerQuery = query.toLowerCase();
  
  return Object.entries(tagIndex)
    .filter(([tag]) => tag.toLowerCase().includes(lowerQuery))
    .map(([tag, data]) => ({
      tag,
      count: data.count,
      mods: data.mods
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 获取分类下的Mod列表
 */
export function getModsByCategory(
  category: string,
  categoryIndex: CategoryIndex,
  mods: ModMetadata[]
): ModMetadata[] {
  const categoryData = categoryIndex[category];
  if (!categoryData) return [];

  return mods.filter(mod => categoryData.mods.includes(mod.id));
}

/**
 * 获取标签下的Mod列表
 */
export function getModsByTag(
  tag: string,
  tagIndex: TagIndex,
  mods: ModMetadata[]
): ModMetadata[] {
  const tagData = tagIndex[tag];
  if (!tagData) return [];

  return mods.filter(mod => tagData.mods.includes(mod.id));
}

/**
 * 获取多个标签的交集Mod列表
 */
export function getModsByTagsIntersection(
  tags: string[],
  tagIndex: TagIndex,
  mods: ModMetadata[]
): ModMetadata[] {
  if (tags.length === 0) return mods;

  const tagModSets = tags
    .map(tag => new Set(tagIndex[tag]?.mods || []))
    .filter(set => set.size > 0);

  if (tagModSets.length === 0) return [];

  // 计算交集
  const intersection = tagModSets.reduce((acc, set) => {
    return new Set([...acc].filter(modId => set.has(modId)));
  });

  return mods.filter(mod => intersection.has(mod.id));
}

/**
 * 获取多个标签的并集Mod列表
 */
export function getModsByTagsUnion(
  tags: string[],
  tagIndex: TagIndex,
  mods: ModMetadata[]
): ModMetadata[] {
  if (tags.length === 0) return mods;

  const allModIds = new Set<string>();
  
  for (const tag of tags) {
    const tagData = tagIndex[tag];
    if (tagData) {
      tagData.mods.forEach(modId => allModIds.add(modId));
    }
  }

  return mods.filter(mod => allModIds.has(mod.id));
}

/**
 * 计算索引统计信息
 */
export function calculateIndexStatistics(
  categoryIndex: CategoryIndex,
  tagIndex: TagIndex,
  totalMods: number
): IndexStatistics {
  const categories = Object.keys(categoryIndex);
  const tags = Object.keys(tagIndex);

  const mostUsedCategory = categories.length > 0 
    ? categories.reduce((a, b) => categoryIndex[a].count > categoryIndex[b].count ? a : b)
    : '';

  const mostUsedTag = tags.length > 0
    ? tags.reduce((a, b) => tagIndex[a].count > tagIndex[b].count ? a : b)
    : '';

  const totalModsWithCategories = Object.values(categoryIndex).reduce((sum, data) => sum + data.count, 0);
  const averageModsPerCategory = categories.length > 0 ? totalModsWithCategories / categories.length : 0;

  const totalModsWithTags = Object.values(tagIndex).reduce((sum, data) => sum + data.count, 0);
  const averageTagsPerMod = totalMods > 0 ? totalModsWithTags / totalMods : 0;

  return {
    totalCategories: categories.length,
    totalTags: tags.length,
    mostUsedCategory,
    mostUsedTag,
    averageModsPerCategory: Math.round(averageModsPerCategory * 100) / 100,
    averageTagsPerMod: Math.round(averageTagsPerMod * 100) / 100
  };
}

/**
 * 更新索引（增量更新）
 */
export function updateIndex(
  oldCategoryIndex: CategoryIndex,
  oldTagIndex: TagIndex,
  addedMods: ModMetadata[],
  removedMods: ModMetadata[]
): {
  categoryIndex: CategoryIndex;
  tagIndex: TagIndex;
} {
  // 创建副本
  const newCategoryIndex = { ...oldCategoryIndex };
  const newTagIndex = { ...oldTagIndex };

  // 移除已删除的Mod
  for (const mod of removedMods) {
    // 从分类索引中移除
    if (mod.category && newCategoryIndex[mod.category]) {
      newCategoryIndex[mod.category].count--;
      newCategoryIndex[mod.category].mods = newCategoryIndex[mod.category].mods.filter(id => id !== mod.id);
      
      if (newCategoryIndex[mod.category].count === 0) {
        delete newCategoryIndex[mod.category];
      }
    }

    // 从标签索引中移除
    if (mod.tags && mod.tags.length > 0) {
      for (const tag of mod.tags) {
        if (newTagIndex[tag]) {
          newTagIndex[tag].count--;
          newTagIndex[tag].mods = newTagIndex[tag].mods.filter(id => id !== mod.id);
          
          if (newTagIndex[tag].count === 0) {
            delete newTagIndex[tag];
          }
        }
      }
    }
  }

  // 添加新的Mod
  for (const mod of addedMods) {
    // 添加到分类索引
    if (mod.category) {
      if (!newCategoryIndex[mod.category]) {
        newCategoryIndex[mod.category] = { count: 0, mods: [] };
      }
      newCategoryIndex[mod.category].count++;
      newCategoryIndex[mod.category].mods.push(mod.id);
    }

    // 添加到标签索引
    if (mod.tags && mod.tags.length > 0) {
      for (const tag of mod.tags) {
        if (!newTagIndex[tag]) {
          newTagIndex[tag] = { count: 0, mods: [] };
        }
        newTagIndex[tag].count++;
        newTagIndex[tag].mods.push(mod.id);
      }
    }
  }

  return {
    categoryIndex: newCategoryIndex,
    tagIndex: newTagIndex
  };
}
