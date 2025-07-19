import { sharedConfigManager } from '@/core/state/SharedConfigManager';
import { watch } from 'vue';

// let currentTheme:StorageValue<Theme> | null = null;
export const currentTheme = sharedConfigManager.theme;
watch(currentTheme, (newTheme) => {
    document.querySelector('#app-container')?.setAttribute('theme', newTheme);
});

export type Theme = 'auto' | 'dark' | 'light';
export const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
};