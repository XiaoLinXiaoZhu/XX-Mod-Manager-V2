import { RebindableRef } from "@/deprecation/RebindableRef";
import { watch } from 'vue';

// let currentTheme:StorageValue<Theme> | null = null;
export const currentTheme = new RebindableRef<Theme>('dark' as Theme); // 默认主题为 dark
watch(currentTheme, (newTheme) => {
    document.querySelector('#app-container')?.setAttribute('theme', newTheme.value);
});

export type Theme = 'auto' | 'dark' | 'light';
export const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
};