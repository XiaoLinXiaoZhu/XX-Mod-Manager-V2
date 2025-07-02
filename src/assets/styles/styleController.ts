import { RebindableRef } from "@/shared/composables/RebindableRef";

// let currentTheme:StorageValue<Theme> | null = null;
export const currentTheme = new RebindableRef<Theme>('dark' as Theme); // 默认主题为 dark
currentTheme.watch((newTheme) => {
    document.querySelector('#app-container')?.setAttribute('theme', newTheme);
});

export type Theme = 'auto' | 'dark' | 'light';
export const setTheme = (theme: Theme) => {
    currentTheme.value = theme;
};