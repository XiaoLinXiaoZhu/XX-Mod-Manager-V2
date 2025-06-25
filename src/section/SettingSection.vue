<template>
    <div class="setting-container">
        <LeftIndex class="OO-left-container OO-box" :structure="IndexStructure" :displayStructure="t_IndexStructure"
            v-model:selected-path="selectedPath" />

        <div class="OO-right-container setting-content OO-box OO-scroll-box">
            <!-- -=========== 常规设置 =========== -->
            <div v-if="isPathActive('General')">
                <settingBar :data="configData.languageData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="configData.themeData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="configData.ifStartWithLastPresetData"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="configData.ifKeepModNameAsModFolderName"></settingBar>
                <s-divider></s-divider>
                <settingBar :data="configData.openFirstLoadButton"></settingBar>
                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -高级设置 -->
            <!-- -在这里可以设定 modRootDir，modSourceDir，modLoaderDir，gameDir -->
            <div v-if="isPathActive('Advanced')">

                <settingBar :data="configData.modTargetPathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="configData.modSourcePathData"></settingBar>

                <s-divider></s-divider>
                <settingBar :data="configData.presetPathData"></settingBar>
                <settingBar :data="configData.ifUseTraditionalApply"></settingBar>

                <s-divider></s-divider>
                <s-button class="OO-color-gradient" @click="ConfigLoader.print()">
                    {{ $t('setting.showDetail') }} </s-button>
                <s-divider></s-divider>
                <settingBar :data="configData.initAllDataButton"></settingBar>

                <div class="placeholder" style="flex: 1;min-height: 150px;"></div>
            </div>
            <!-- -切换配置 -->
            <!-- -在这里你可以选择开启在开始的时候选择配置文件的功能，并且设置配置文件保存位置 -->
            <div v-if="isPathActive('Tools')">
                <Markdown :content="$t('firstLoad.switchConfigInfo2')"></Markdown>
                <settingBar :data="configData.createShortOfCurrentConfig"></settingBar>
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
            <div v-if="isPathActive('Plugin') && selectedPath === 'Plugins'">
                <div class="OO-setting-bar">
                    <h3> {{ $t('setting.managePlugin') }} </h3>
                </div>
                <settingBar :data="configData.refreshDuleToPlugin" v-if="toggledPlugin"></settingBar>
                <div class="OO-box OO-shade-box" style="margin: 10px 0;">
                    <h3> {{ $t('setting.pluginList') }} </h3>
                    <p> {{ $t('setting.pluginListInfo') }} </p>
                </div>
                <div class="OO-setting-bar" v-for="(pluginData, pluginName) in plugins" :key="pluginName">
                    <h3 v-if="pluginData.t_displayName">{{ getTranslatedText(pluginData.t_displayName) }}</h3>
                    <h3 v-else>{{ pluginName }}</h3>
                    <!-- -如果iManager.disabledPluginNames 中包含 pluginName，则显示为 false，否则显示为 true -->
                    <s-switch class="OO-color-gradient-word"
                        :checked="IPluginLoader.CheckIfPluginCanBeEnabled(pluginData)"
                        @change="handlePluginToggle(pluginName as string)">
                    </s-switch>
                </div>
            </div>
            <!-- -这里后面提供 各个插件的设置 -->
            <div v-for="(pluginData, pluginName) in pluginConfig" :key="pluginName">
                <div v-if="isPathActive('Plugins\\' + pluginName)" class="OO-setting-bar">

                    <s-fold :folded="true">
                        <s-button class="OO-color-gradient" slot="trigger">{{ $t('setting.showDetail') }}</s-button>
                        <div>
                            {{ pluginName }}
                        </div>
                        <s-divider></s-divider>
                        <div class="OO-box OO-shade-box">
                            <div v-for="data in pluginData" :key="data.name">
                                <div class="OO-setting-bar">
                                    <h3 v-if="data.t_displayName">{{ getTranslatedText(data.t_displayName) }}</h3>
                                    <h3 v-else>{{ data.displayName }}</h3>
                                    <div>
                                        {{ data.dataRef }}
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
import configData from './settingSectionData';
import { IPluginLoader, type IPlugin, type IPluginData } from '@/scripts/core/PluginLoader.ts';
import { EventSystem, EventType } from '@/scripts/core/EventSystem.ts';
import { ConfigLoader } from '@/scripts/core/ConfigLoader';
import { getTranslatedText, $t, currentLanguage, currentLanguageRef } from '../scripts/lib/localHelper.ts';

let IndexStructure: {
    General: Record<string, unknown>,
    Advanced: Record<string, unknown>,
    Tools: Record<string, unknown>,
    About: Record<string, unknown>,
    Plugins: Record<string, unknown>
} = {
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
    "Plugins": {}
};


let t_IndexStructure = ref<Record<string, Record<string, unknown>>>({});

const computeTranslatedIndexStructure = () => {
    // 创建与原始结构相匹配的翻译结构
    const result: Record<string, any> = {
        // 顶级菜单翻译
        "General": $t('setting-tab.general'),
        "Advanced": $t('setting-tab.advanced'),
        "Tools": $t('setting-tab.tools'),
        "About": $t('setting-tab.about'),
        "Plugins": $t('setting-tab.plugin'),
        
        // 二级菜单翻译
        "General/Language": $t('setting-tab.language'),
        "General/Theme": $t('setting-tab.theme'),
        "General/Startup": $t('setting-tab.startup'),
        
        "Advanced/Mod Target Path": $t('setting-tab.modTargetPath'),
        "Advanced/Mod Source Path": $t('setting-tab.modSourcePath'),
        "Advanced/Preset Path": $t('setting-tab.presetPath'),
        "Advanced/Traditional Apply": $t('setting-tab.traditionalApply'),
        
        "Tools/Create Short Cut": $t('setting-tab.createShortCut')
    };
    
    // 添加插件的翻译
    Object.keys(IPluginLoader.plugins).forEach(pluginName => {
        result[`Plugins/${pluginName}`] = plugins.value[pluginName]?.t_displayName ? 
            getTranslatedText(plugins.value[pluginName].t_displayName).value :
            pluginName;
    });
    
    console.log("t_IndexStructure:", result);
    return result;
}

watch(currentLanguageRef, () => {
    t_IndexStructure.value = computeTranslatedIndexStructure();
    console.log("当前语言变更，更新左侧菜单结构:", t_IndexStructure.value);
});

const selectedPath = ref<string>('');

const isPathActive = (path: string) => {
    // 如果 selectedPath.value start with path，则返回 true
    if (!selectedPath.value) return false;
    if (selectedPath.value.startsWith(path)) {
        return true;
    }
    return false;
};


const plugins = ref<{ [key: string]: IPlugin }>({});
const pluginConfig = ref<{ [key: string]: IPluginData[] }>({});
const toggledPlugin = ref(false);

const handlePluginToggle = (pluginName: string) => {
    console.log('handlePluginToggle:', pluginName);
    IPluginLoader.togglePlugin(pluginName);
    toggledPlugin.value = true;
};



onMounted(async () => {
    //初始化tab
    selectedPath.value = 'General';
});

EventSystem.on(EventType.pluginLoaded, () => {
    plugins.value = IPluginLoader.plugins;
    pluginConfig.value = IPluginLoader.pluginConfig;

    // debug
    console.log("插件加载完成，插件列表:", plugins.value);
    console.log("插件配置加载完成，插件配置列表:", pluginConfig.value);

    // 更新左侧菜单结构
    IndexStructure.Plugins = {};
    Object.keys(plugins.value).forEach(pluginName => {
        // debug
        console.log("1111111111 插件名称:", pluginName, "插件数据:", plugins.value[pluginName]);
        IndexStructure.Plugins[pluginName] = {};
    });

    // 更新翻译
    t_IndexStructure.value = computeTranslatedIndexStructure();

    //debug
    console.log("插件加载完成，更新左侧菜单结构:",  IndexStructure, t_IndexStructure.value);
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
    // width: calc(100% - 200px);
    // height: calc(100% - 20px);
    flex: 1;
}

.setting-content>div {
    overflow-y: auto;
}
</style>