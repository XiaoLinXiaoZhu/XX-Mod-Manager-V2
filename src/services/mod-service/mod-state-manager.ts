/**
 * Mod 状态管理器
 * 提供 Mod 服务的响应式状态管理功能
 */

import { ModServiceEvent } from './types';
import type { ModServiceState } from './types';
import { ModMetadata } from '@/modules/mod-management';
import type { ModInfo } from '@/modules/mod-management';
import { 
  calculateCategoryIndex, 
  calculateTagIndex, 
  updateIndex,
  getModsByCategory,
  getModsByTag,
  getModsByTagsIntersection,
  getModsByTagsUnion
} from '@/modules/mod-management';
import { ReactiveStore } from '@/kernels';

import { EventEmitter } from '@/kernels';

/**
 * Mod 状态管理器类
 * 负责管理 Mod 服务的响应式状态
 */
export class ModStateManager {
  private stateStore: ReactiveStore<ModServiceState>;
  private eventEmitter: EventEmitter;

  constructor(
    stateStore: ReactiveStore<ModServiceState>,
    eventEmitter: EventEmitter
  ) {
    this.stateStore = stateStore;
    this.eventEmitter = eventEmitter;
  }

  /**
   * 获取当前状态
   */
  getState(): ModServiceState {
    return this.stateStore.getState();
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: ModServiceState) => void): () => void {
    return this.stateStore.subscribe(listener);
  }

  /**
   * 更新Mod列表
   */
  updateMods(mods: ModInfo[]): void {
    const currentState = this.stateStore.getState();
    
    // 计算新的索引
    const categoryIndex = calculateCategoryIndex(mods);
    const tagIndex = calculateTagIndex(mods);

    this.stateStore.updateState((currentState) => ({
        ...currentState,
        mods,
        categoryIndex,
        tagIndex,
        loading: false,
        error: null
      }));

    this.eventEmitter.emit(ModServiceEvent.MODS_LOADED, { mods });
  }

  /**
   * 添加Mod
   */
  addMod(mod: ModInfo): void {
    const currentState = this.stateStore.getState();
    const newMods = [...currentState.mods, mod];
    
    // 更新索引
    const { categoryIndex, tagIndex } = updateIndex(
      currentState.categoryIndex,
      currentState.tagIndex,
      [mod],
      []
    );

    this.stateStore.updateState((currentState) => ({
        ...currentState,
        mods: newMods,
        categoryIndex,
        tagIndex
      }));

    this.eventEmitter.emit(ModServiceEvent.MOD_ADDED, { mod });
  }

  /**
   * 移除Mod
   */
  removeMod(modId: string): void {
    const currentState = this.stateStore.getState();
    const modToRemove = currentState.mods.find(mod => mod.id === modId);
    
    if (!modToRemove) return;

    const newMods = currentState.mods.filter(mod => mod.id !== modId);
    
    // 更新索引
    const { categoryIndex, tagIndex } = updateIndex(
      currentState.categoryIndex,
      currentState.tagIndex,
      [],
      [modToRemove]
    );

    this.stateStore.updateState((currentState) => ({
        ...currentState,
        mods: newMods,
        categoryIndex,
        tagIndex,
        selectedMods: currentState.selectedMods.filter(id => id !== modId)
      }));

    this.eventEmitter.emit(ModServiceEvent.MOD_REMOVED, { modId });
  }

  /**
   * 更新Mod状态
   */
  updateModStatus(modId: string, status: string): void {
    const currentState = this.stateStore.getState();
    const modIndex = currentState.mods.findIndex(mod => mod.id === modId);
    
    if (modIndex === -1) return;

    const updatedMods = [...currentState.mods];
    updatedMods[modIndex] = { ...updatedMods[modIndex], status: status as any };

    this.stateStore.updateState((currentState) => ({
        ...currentState,
        mods: updatedMods
      }));

    this.eventEmitter.emit(ModServiceEvent.MOD_STATUS_CHANGED, { modId, status });
  }

  /**
   * 设置加载状态
   */
  setLoading(loading: boolean): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        loading
      }));
  }

  /**
   * 设置错误状态
   */
  setError(error: string | null): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        error
      }));
  }

  /**
   * 设置源文件夹
   */
  updateSourceFolders(sourceFolders: string[]): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        sourceFolders
      }));
  }

  /**
   * 设置选中的Mods
   */
  setSelectedMods(selectedMods: string[]): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        selectedMods
      }));
  }

  /**
   * 添加选中的Mod
   */
  addSelectedMod(modId: string): void {
    const currentState = this.stateStore.getState();
    if (!currentState.selectedMods.includes(modId)) {
      this.stateStore.updateState((currentState) => ({
        ...currentState,
        selectedMods: [...currentState.selectedMods,
        modId]
      }));
    }
  }

  /**
   * 移除选中的Mod
   */
  removeSelectedMod(modId: string): void {
    const currentState = this.stateStore.getState();
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        selectedMods: currentState.selectedMods.filter(id => id !== modId)
      }));
  }

  /**
   * 设置搜索查询
   */
  setSearchQuery(query: string): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        searchQuery: query
      }));
  }

  /**
   * 设置分类过滤器
   */
  setFilterCategory(category: string | null): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        filterCategory: category
      }));
  }

  /**
   * 设置标签过滤器
   */
  setFilterTags(tags: string[]): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        filterTags: tags
      }));
  }

  /**
   * 获取过滤后的Mod列表
   */
  getFilteredMods(): ModInfo[] {
    const state = this.stateStore.getState();
    let filteredMods = state.mods;

    // 按搜索查询过滤
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filteredMods = filteredMods.filter(mod => 
        mod.name.toLowerCase().includes(query) ||
        mod.description?.toLowerCase().includes(query) ||
        mod.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 按分类过滤
    if (state.filterCategory) {
      filteredMods = getModsByCategory(state.filterCategory, state.categoryIndex, filteredMods);
    }

    // 按标签过滤
    if (state.filterTags.length > 0) {
      filteredMods = getModsByTagsIntersection(state.filterTags, state.tagIndex, filteredMods);
    }

    return filteredMods;
  }

  /**
   * 获取分类列表
   */
  getCategories(): Array<{ category: string; count: number; mods: string[] }> {
    const state = this.stateStore.getState();
    return Object.entries(state.categoryIndex)
      .map(([category, data]) => ({
        category,
        count: data.count,
        mods: data.mods
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取标签列表
   */
  getTags(): Array<{ tag: string; count: number; mods: string[] }> {
    const state = this.stateStore.getState();
    return Object.entries(state.tagIndex)
      .map(([tag, data]) => ({
        tag,
        count: data.count,
        mods: data.mods
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 获取统计信息
   */
  getStatistics(): {
    totalMods: number;
    selectedMods: number;
    totalCategories: number;
    totalTags: number;
    filteredMods: number;
  } {
    const state = this.stateStore.getState();
    const filteredMods = this.getFilteredMods();

    return {
      totalMods: state.mods.length,
      selectedMods: state.selectedMods.length,
      totalCategories: Object.keys(state.categoryIndex).length,
      totalTags: Object.keys(state.tagIndex).length,
      filteredMods: filteredMods.length
    };
  }

  /**
   * 清空所有过滤器
   */
  clearFilters(): void {
    this.stateStore.updateState((currentState) => ({
        ...currentState,
        searchQuery: '',
        filterCategory: null,
        filterTags: []
      }));
  }

  /**
   * 重置状态
   */
  reset(): void {
    this.stateStore.updateState({
      mods: [],
      loading: false,
      error: null,
      lastOperation: null,
      sourceFolders: [],
      categoryIndex: {},
      tagIndex: {},
      selectedMods: [],
      searchQuery: '',
      filterCategory: null,
      filterTags: []
    });
  }
}
