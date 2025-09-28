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
                    <s-button class="OO-button-box" @click="globalServiceContainer.fs.openUrlWithDefaultBrowser('https://github.com/soliddanii')">
                        soliddanii
                    </s-button>
                </div>
                <s-divider></s-divider>
                <div class="OO-setting-bar">
                    <h3> {{ $t('github') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="globalServiceContainer.fs.openUrlWithDefaultBrowser('https://github.com/XiaoLinXiaoZhu/XX-Mod-Manager')">
                        <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                            </svg></s-icon>
                    </s-icon-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('gamebanana') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="globalServiceContainer.fs.openUrlWithDefaultBrowser('https://gamebanana.com/tools/17889')">
                        <s-icon><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -960 960 960">
                                <path d="m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z"></path>
                            </svg></s-icon>
                    </s-icon-button>
                </div>
                <div class="OO-setting-bar">
                    <h3> {{ $t('caimogu') }} </h3>
                    <s-icon-button type="filled" slot="start" class="OO-icon-button"
                        style="border: 5px solid  var(--s-color-surface-container-high);transform: scale(1);left: 15px;"
                        @click="globalServiceContainer.fs.openUrlWithDefaultBrowser('https://www.caimogu.cc/post/1408504.html')">>
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
import LeftIndex from '@/shared/components/leftIndex.vue';
import { settingBar } from '@/compat/legacy-bridge';
import { computed, ComputedRef, onMounted, Ref, ref, watch } from 'vue';
import { globalServiceContainer } from '@/shared/services/ServiceContainer';
import getSettingSectionData from './globalSettingSectionData';
import { IPluginLoader, type IPlugin, type IPluginData } from '@/compat/legacy-bridge';
import { EventSystem, EventType } from '@/compat/legacy-bridge';
import { getTranslatedText, $t, currentLanguageRef, $rt } from '@/compat/legacy-bridge';

let configData = getSettingSectionData();

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
        "Mod Target Folder": {},
        "Mod Source Folders": {},
        "Preset Folder": {},
        "Traditional Apply": {}
    },
    "Tools": {
        "Create Short Cut": {}
    },
    "About": {},
    "Plugins": {}
};

const t_IndexStructure = computed(() => {
    // 创建与原始结构相匹配的翻译结构
    const result: Record<string, ComputedRef<string>> = {
        // 顶级菜单翻译
        "General": $rt('setting-tab.general'),
        "Advanced": $rt('setting-tab.advanced'),
        "Tools": $rt('setting-tab.tools'),
        "About": $rt('setting-tab.about'),
        "Plugins": $rt('setting-tab.plugin'),

        // 二级菜单翻译
        "General/Language": $rt('setting-tab.language'),
        "General/Theme": $rt('setting-tab.theme'),
        "General/Startup": $rt('setting-tab.startup'),

        "Advanced/Mod Target Folder": $rt('setting-tab.modTargetFolder'),
        "Advanced/Mod Source Folders": $rt('setting-tab.modSourceFolders'),
        "Advanced/Preset Folder": $rt('setting-tab.presetFolder'),
        "Advanced/Traditional Apply": $rt('setting-tab.traditionalApply'),

        "Tools/Create Short Cut": $rt('setting-tab.createShortCut')
    };
    
    // 添加插件的翻译
    Object.keys(IPluginLoader.plugins).forEach(pluginName => {
        result[`Plugins/${pluginName}`] = plugins.value[pluginName]?.t_displayName ? 
            getTranslatedText(plugins.value[pluginName].t_displayName) :
            computed(() => pluginName);
    });
    
    console.log("t_IndexStructure:", result);
    return result;
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