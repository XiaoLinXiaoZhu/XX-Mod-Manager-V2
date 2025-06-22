import { useConfig } from "@/scripts/core/ConfigLoader";
import { StorageValue } from "@/scripts/lib/Storge";
import { Ref } from "vue";

let currentTheme:StorageValue<'auto' | 'dark' | 'light'> | null = null;


export type Theme = 'auto' | 'dark' | 'light';
export const setTheme = (theme: Theme) => {
    // debug
    console.log(`Setting theme to ${theme}`);
    if (!currentTheme) {
        currentTheme = useConfig('theme', "dark" as Theme,true);
    }
    currentTheme.set(theme);
    
    // document
    document.querySelector('#app-container')?.setAttribute('theme', theme);
};