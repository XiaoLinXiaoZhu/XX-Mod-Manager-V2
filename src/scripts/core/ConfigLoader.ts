import { ref } from "vue";

export const g_config_vue = {
    firstLoad: ref(true),
    language: ref('zh_cn'),
    theme: ref('dark'),
    modSourcePath: ref(null),
    modTargetPath: ref(null),
    presetPath: ref(null),
    ifStartWithLastPreset: ref(true),
    lastUsedPreset: ref(null),
    bounds: ref({
        width: 800,
        height: 600,
        x: -1,
        y: -1,
    }),
    ifKeepModNameAsModFolderName: ref(false),
    ifUseTraditionalApply: ref(false),
}

export const g_temp_vue = {
    lastClickedMod: ref(null),
    currentMod: ref(null),
    currentCharacter: ref(null),
    currentTab: ref('mod'),
    currentPreset: ref('default'),
    wakeUped: ref(false),
    ifDontSaveOnClose: ref(false),
}

export const g_data_vue = {
    modList: ref([]),
    presetList: ref([]),
    characterList: ref([]),
};

export const setConfig = (key: keyof typeof g_config_vue, value: any) => {
    if (key in g_config_vue) {
        g_config_vue[key].value = value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid config key`);
    }
}

export const getConfig = (key: keyof typeof g_config_vue) => {
    if (key in g_config_vue) {
        return g_config_vue[key].value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid config key`);
        return null;
    }
}

export const setTemp = (key: keyof typeof g_temp_vue, value: any) => {
    if (key in g_temp_vue) {
        g_temp_vue[key].value = value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid temp key`);
    }
}

export const getTemp = (key: keyof typeof g_temp_vue) => {
    if (key in g_temp_vue) {
        return g_temp_vue[key].value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid temp key`);
        return null;
    }
}

export const setData = (key: keyof typeof g_data_vue, value: any) => {
    if (key in g_data_vue) {
        g_data_vue[key].value = value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid data key`);
    }
}

export const getData = (key: keyof typeof g_data_vue) => {
    if (key in g_data_vue) {
        return g_data_vue[key].value;
    } else {
        console.error(`ConfigLoader: ${key} is not a valid data key`);
        return null;
    }
}