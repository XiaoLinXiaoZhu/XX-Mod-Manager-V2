import { ref, watch } from 'vue';

// let currentTheme:StorageValue<Theme> | null = null;
export const currentTheme = ref<Theme>('auto');
watch(currentTheme, (newTheme) => {
    document.querySelector('#app-container')?.setAttribute('theme', newTheme);
});

export type Theme = 'auto' | 'dark' | 'light';
export const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
    // debug
    console.log(`设置主题为: ${theme}`);
};