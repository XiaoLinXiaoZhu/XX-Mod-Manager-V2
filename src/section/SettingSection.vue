<template>
    <div class="setting-container">
        <leftMenu :tabs="tabs" :translatedTabs="translatedTabs" @tabChange="handleTabChange">
        </leftMenu>
        <LeftIndex class="left-bar OO-box" :structure="IndexStructure" v-model:selected-path="selectedPath" />

        <div class="setting-content OO-box OO-scorll-box">
            <!-- -=========== 常规设置 =========== -->
            <div v-if="isPathActive('General')">
                <settingBar :data="languageData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="themeData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="ifStartWithLastPresetData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="ifKeepModNameAsModFolderName"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="openFirstLoadButton"></settingBar>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -高级设置 -->
            <!-- -在这里可以设定 modRootDir，modSourceDir，modLoaderDir，gameDir -->
            <div v-if="isPathActive('Advanced')">

                <settingBar :data="modTargetPathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="modSourcePathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="presetPathData"></settingBar>
                <settingBar :data="ifUseTraditionalApply"></settingBar>

                <s-divider></s-divider>
                <s-button class="OO-color-gradient" @click="console.log(iManager.config)">
                    {{ $t('setting.showDetail') }} </s-button>
                <s-divider></s-divider>
                <settingBar :data="initAllDataButton"></settingBar>

                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -切换配置 -->
            <!-- -在这里你可以选择开启在开始的时候选择配置文件的功能，并且设置配置文件保存位置 -->
            <div v-if="isPathActive('Tools')">
                <Markdown :content="$t('firstLoad.switchConfigInfo2')"></Markdown>
                <settingBar :data="changeConfig"></settingBar>
                <settingBar :data="createShortOfCurrentConfig"></settingBar>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>



            <!-- -about page -->
            <div v-if="isPathActive('About')">
                <div class="OO-setting-bar">
                    <h3> {{ $t('firstLoad.aboutProgram') }} </h3>
                </div>

                <div class="OO-box OO-shade-box">
                    <p> {{ $t('firstLoad.aboutProgramInfo') }} </p>
                </div>
                <div class="OO-setting-bar">
                    <p> {{ $t('firstLoad.aboutProgramInfo-1') }} </p>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('author') }} </h3>
                    <p> XLXZ </p>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('firstLoad.thanks') }} </h3>
                    <s-button class="OO-button-box" @click="openUrlWithDefaultBrowser('https://github.com/soliddanii')">
                        soliddanii
                    </s-button>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3> {{ $t('github') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="openUrlWithDefaultBrowser('https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager')">
                        <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                            </svg></s-icon>
                    </s-icon-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('gamebanana') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="openUrlWithDefaultBrowser('https://gamebanana.com/tools/17889')">
                        <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                            </svg></s-icon>
                    </s-icon-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('caimogu') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="openUrlWithDefaultBrowser('https://www.caimogu.cc/post/1408504.html')">
                        <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                            </svg></s-icon>
                    </s-icon-button>
                </div>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>

            <!-- -插件管理面板，控制插件的开关 -->
            <div v-if="isPathActive('Plugin')">
                <div class="OO-setting-bar">
                    <h3> {{ $t('setting.managePlugin') }} </h3>
                </div>
                <settingBar :data="refreshDuleToPlugin" v-if="toggledPlugin"></settingBar>
                <div class="OO-box OO-shade-box" style="margin: 10px 0;">
                    <h3> {{ $t('setting.pluginList') }} </h3>
                    <p> {{ $t('setting.pluginListInfo') }} </p>
                </div>
                <div class="OO-setting-bar" v-for="(pluginData, pluginName) in plugins" :key="pluginName">
                    <h3 v-if="pluginData.t_displayName">{{ pluginData.t_displayName[locale] }}</h3>
                    <h3 v-else>{{ pluginName }}</h3>
                    <!-- -如果iManager.disabledPluginNames 中包含 pluginName，则显示为 false，否则显示为 true -->
                    <s-switch class="OO-color-gradient-word"
                        :checked="!IPluginLoader.disabledPluginNames.includes(pluginName)"
                        @change="handePluginToggle(pluginName)">
                    </s-switch>
                </div>


            </div>
            <!-- -这里后面提供 各个插件的设置 -->
            <div v-for="(pluginData, pluginName) in pluginConfig" :key="pluginName">
                <div v-if="currentTab === pluginName">

                    <s-fold folded="true">
                        <s-button class="OO-color-gradient" slot="trigger">{{ $t('setting.showDetail') }}</s-button>
                        <div>
                            {{ pluginName }}
                        </div>
                        <s-divider></s-divider>
                        <div class="OO-box OO-shade-box">
                            <div v-for="data in pluginData" :key="data.name">
                                <div class="OO-setting-bar">
                                    <h3 v-if="data.t_displayName">{{ data.t_displayName[locale] }}</h3>
                                    <h3 v-else>{{ data.displayName }}</h3>
                                    <div>
                                        {{ data.data }}
                                    </div>
                                </div>
                                {{ data }}
                            </div>
                        </div>
                    </s-fold>

                    <s-divider></s-divider>
                    <div v-for="data in pluginData" :key="data.name">
                        <settingBar :data="data"></settingBar>
                    </div>
                </div>


            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// import leftMenu from '../components/leftMenu.vue';
import LeftIndex from '@/components/leftIndex.vue';
import settingBar from '@/components/setting/settingBar.vue';
import { computed, onMounted, ref, watch } from 'vue';
import { openUrlWithDefaultBrowser } from '@/scripts/lib/FileHelper.ts';

import getData from './settingSectionData';
const {
    languageData,
    themeData,
    ifStartWithLastPresetData,
    modTargetPathData,
    modSourcePathData,
    presetPathData,
    initAllDataButton,
    openFirstLoadButton
} = getData();

import { useI18n } from 'vue-i18n'
import markdown from '@/components/base/markdown.vue';
const { t, locale } = useI18n()

import IPluginLoader from '@/scripts/core/PluginLoader.ts';
import { EventSystem, EventType } from '@/scripts/core/EventSystem.ts';
import { t_snack } from '@/scripts/lib/SnackHelper.ts';

const tabs = ref(['normal', 'advanced', 'switch-config', 'about', 'plugin']);
const translatedTabs = computed(() => {
    const tTab = tabs.value.map((tab) => {
        // 如果 是 插件的 tab ，则尝试获取 plugin.t_displayName
        if (IPluginLoader.plugins[tab]) {
            return IPluginLoader.plugins[tab].t_displayName[locale.value] || tab;
        }
        return t(`setting-tab.${tab}`)
    });
    //debug
    // console.log('translatedTabs', tTab);
    return tTab;
});

let IndexStructure = {
    "General": {
        "Language": {},
        "Theme": {},
        "Startup": {}
    },
    "Advanced": {
        "Mod Target Path": {},
        "Mod Source Path": {},
        "Preset Path": {},
        "Traditional Apply": {}
    },
    "Tools": {
        "Create Short Cut": {}
    },
    "About": {},
    "Plugins": {
        "Installed Plugins": {},
        "Available Plugins": {}
    }
};
const selectedPath = ref<string>('');

const isPathActive = (path: string) => {
    // 如果 selectedPath.value start with path，则返回 true
    if (!selectedPath.value) return false;
    if (selectedPath.value.startsWith(path)) {
        return true;
    }
    return false;
};

const handleTabChange = (tab) => {
    currentTab.value = tab;
    //debug
    console.log('handleTabChange', tab);
};


const plugins = ref({});
const pluginConfig = ref({});
const toggledPlugin = ref(false);
watch(pluginConfig, (newVal) => {
    //debug
    console.log('===pluginConfig changed:', newVal);
    iManager.pluginConfig = newVal;
    iManager.saveConfig();
});

const handePluginToggle = (pluginName) => {
    console.log('handePluginToggle:', pluginName);
    IPluginLoader.togglePlugin(pluginName);
    toggledPlugin.value = true;
}

const refreshDuleToPlugin = {
    name: 'refreshDuleToPlugin',
    data: false,
    type: 'iconbutton',
    displayName: 'Refresh to apply plugin',
    description: 'Application needs to be refreshed to apply plugin changes',
    buttonName: 'Refresh',
    t_displayName: {
        zh_cn: '刷新以应用更改',
        en: 'Refresh to apply plugin'
    },
    t_description: {
        zh_cn: '应用更改需要刷新',
        en: 'Application needs to be refreshed to apply plugin changes'
    },
    t_buttonName: {
        zh_cn: '刷新',
        en: 'Refresh'
    },
    icon: `                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                            <path
                                d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z">
                            </path>
                        </svg>`,
    onChange: (value) => {
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('refresh-main-window');
    }
}

const newConfigName = {
    name: 'newConfigName',
    data: '',
    type: 'string',
    displayName: 'New Config Name',
    t_displayName: {
        zh_cn: '新配置名称',
        en: 'New Config Name'
    },
    onChange: (value) => {
        console.log('newConfigName changed:', value);
        newConfigName.data = value;
    }
}

const addConfig = {
    name: 'addConfig',
    data: null,
    type: 'iconbutton',
    displayName: 'Add Config',
    buttonName: 'Add',
    t_displayName: {
        zh_cn: '添加配置',
        en: 'Add Config'
    },
    t_buttonName: {
        zh_cn: '添加',
        en: 'Add'
    },
    onChange: (value) => {
        console.log('addConfig changed:', value);
        TapeConfig.createConfig(newConfigName.data).then(() => {
            console.log('addConfig success');
            // 打开配置页面
            iManager.changeUrl('/switchConfig');
        }).catch((err) => {
            console.log('addConfig failed:', err);
        });
    }
}

const openConfigFolder = {
    name: 'openConfigFolder',
    data: null,
    type: 'iconbutton',
    displayName: 'Open Config Folder',
    buttonName: 'Open',
    t_displayName: {
        zh_cn: '打开配置文件夹',
        en: 'Open Config Folder'
    },
    t_buttonName: {
        zh_cn: '打开',
        en: 'Open'
    },
    onChange: (value) => {
        console.log('openConfigFolder changed:', value);
        TapeConfig.getConfigRootPath().then((path) => {
            fsProxy.openDir(path);
        }).catch((err) => {
            console.log('openConfigFolder failed:', err);
        });
    }
}

const openSwitchConfigPage = {
    name: 'openSwitchConfigPage',
    data: null,
    type: 'iconbutton',
    displayName: 'Open Switch Config Page',
    buttonName: 'Open',
    t_displayName: {
        zh_cn: '打开配置切换页面',
        en: 'Open Switch Config Page'
    },
    t_buttonName: {
        zh_cn: '打开',
        en: 'Open'
    },
    onChange: (value) => {
        console.log('openSwitchConfigPage,herf:', window.location.href, '/switchConfig');
        iManager.changeUrl('/switchConfig');
    }
}

const changeConfig = {
    name: 'changeConfig',
    data: null,
    type: 'dir',
    displayName: 'Change Config',
    t_displayName: {
        zh_cn: '配置另存为',
        en: 'Save Config To'
    },
    onChange: (value) => {
        console.log('changeConfig changed:', value);
        changeConfig.data = value;
    }
}

const createShortOfCurrentConfig = {
    name: 'createShortOfCurrentConfig',
    data: null,
    type: 'iconbutton',
    displayName: 'Create Short Of Custom Config',
    description: 'Create Short Of Custom Config',
    buttonName: 'Create',
    t_displayName: {
        zh_cn: '创建使用本地配置的快捷方式',
        en: 'Create Short Of Current Config'
    },
    t_description: {
        zh_cn: '创建使用本地配置的快捷方式',
        en: 'Create Short Of Current Config'
    },
    t_buttonName: {
        zh_cn: '创建快捷方式',
        en: 'Create Short Cut'
    },
    onChange: (value) => {
        console.log('createShortOfCurrentConfig changed:', changeConfig.data);


        iManager.createAppShortCut(changeConfig.data).then(() => {
            console.log('createShortOfCurrentConfig success');
        }).catch((err) => {
            console.log('createShortOfCurrentConfig failed:', err);
        });
    }
}

const ifKeepModNameAsModFolderName = {
    name: 'ifKeepModNameAsModFolderName',
    data: iManager.config.ifKeepModNameAsModFolderName,
    type: 'boolean',
    displayName: 'Keep Mod Name As Mod Folder Name',
    t_displayName: {
        zh_cn: '保持mod名称与mod文件夹名称一致',
        en: 'Keep Mod Name As Mod Folder Name'
    },
    onChange: (value) => {
        console.log('ifKeepModNameAsModFolderName changed:', value);
        ifKeepModNameAsModFolderName.data = value;

        iManager.config.ifKeepModNameAsModFolderName = value;
    }
}

const ifUseTraditionalApply = {
    name: 'ifUseTraditionalApply',
    data: iManager.config.ifUseTraditionalApply,
    type: 'boolean',
    displayName: 'Use Traditional Apply',
    t_displayName: {
        zh_cn: '使用传统应用方式',
        en: 'Use Traditional Apply'
    },
    description: 'If true, the mod will be applied in a traditional way',
    t_description: {
        zh_cn: '开启后，mod将以传统方式应用，使用传统模式时，将会通过更改文件夹名称来变更mod应用状态',
        en: 'If true, the mod will be applied in a traditional way, using the traditional mode, the mod application status will be changed by changing the folder name'
    },
    onChange: (value) => {
        // 检查：
        // 1. modTarget和 modSource 需要是同一个文件夹
        // 2. ifKeepModNameAsModFolderName 需要是 false

        if (value) {
            if (iManager.config.modTargetPath !== iManager.config.modSourcePath) {
                iManager.config.ifUseTraditionalApply = false;
                iManager.config.ifKeepModNameAsModFolderName = false;
                console.log('ifUseTraditionalApply changed:', value, 'modTarget and modSource need to be the same folder');
                t_snack({
                    zh_cn: '在传统模式下，mod目标和源文件夹需要是同一个文件夹',
                    en: 'modTarget and modSource need to be the same folder'
                }, SnackType.error)
                return false;
            }
            if (iManager.config.ifKeepModNameAsModFolderName) {
                iManager.config.ifUseTraditionalApply = false;
                console.log('ifUseTraditionalApply changed:', value, 'ifKeepModNameAsModFolderName need to be false');
                t_snack({
                    zh_cn: '使用该功能需要 关闭 保持mod名称与mod文件夹名称一致，请在 设置/常规设置 中关闭',
                    en: 'ifKeepModNameAsModFolderName need to be false, please turn it off in the setting/normal setting'
                }, SnackType.error)
                return false;
            }
            // debug
            console.log('ifUseTraditionalApply changed:', value);
            ifUseTraditionalApply.data = true;
            iManager.config.ifUseTraditionalApply = true;
            // return true;
        }
        else {
            // debug
            console.log('ifUseTraditionalApply changed:', value);
            ifUseTraditionalApply.data = false;
            iManager.config.ifUseTraditionalApply = false;
            // return false;
        }

        
        

        
    }
}


onMounted(async () => {
    //初始化tab
    currentTab.value = tabs.value[0];

    // 挂载插件的额外设置
    EventSystem.on(EventType.pluginLoaded, () => {
        plugins.value = IPluginLoader.plugins;
        pluginConfig.value = IPluginLoader.pluginConfig;

        tabs.value.push(...Object.keys(pluginConfig.value));
    });

    // console.log('pluginConfig', pluginConfig);


    // pluginConfig 是 一组 plungeName:pluginData 的键值对
    // 每个 pluginData 是一个 数组，数组中的每个元素是一个data对象，data对象包含了插件的设置
    // 每个 data 对象包含了以下属性
    // data 的格式为
    // {
    //     name: 'ifAblePlugin',
    //     data: true,
    //     type: 'boolean',
    //     displayName: 'If Able Plugin',
    //     description: 'If true, the plugin will be enabled',
    //     t_displayName:{
    //         zh_cn:'是否启用插件',
    //         en:'Enable Plugin'
    //     },
    //     t_description:{
    //         zh_cn:'如果为真，插件将被启用',
    //         en:'If true, the plugin will be enabled'
    //     },
    //     onChange: (value) => {
    //         console.log('ifAblePlugin changed:', value);
    //     }
    // }
    // 通过这个数据，我们可以动态生成插件的设置界面

    // 为 plugin 添加 tab
    // tabs.value.push(...Object.keys(pluginConfig.value));
});
</script>


<style scoped lang="scss">
    .left-bar {
        width: 20vw;
        min-width: 150px;
        max-width: 200px;
        height: 100%;
        padding: 10px;
        margin: 0px 10px;


        display: flex;
        flex-direction: column;
        box-sizing: border-box;


    }

.setting-container {
    display: flex;
    height: calc(100% - 60px);
    width: 100%;
    flex-direction: row;
    align-items: stretch;
    justify-content: flex-start;
    flex-wrap: nowrap;
}

.setting-content {
    position: relative;
    display: flex;
    flex-direction: column;
    width: calc(100% - 200px);
    height: calc(100% - 20px);
    flex: 1;
    margin: 0 10px;
}

.setting-content>div {
    overflow-y: auto;
}
</style>