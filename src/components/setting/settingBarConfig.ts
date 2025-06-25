// 定义 settingBar 的配置项 (data)
import { TranslatedText } from "../../scripts/lib/localHelper";
import { Ref } from "vue";
export type SettingBarType = "markdown" | "hidden" | "string" | "number" | "dir" | "file:any" | "file:ini" | "file:exe";
export type SettingBarDataBase = {
    type: SettingBarType;
    name?: string;
    dataRef: Ref<any>; // 用于双向绑定的引用
    displayName?: string;
    description?: string;
    t_displayName?: TranslatedText;
    t_description?: TranslatedText;
    onChange?: (value: any) => boolean | void;
    callback?: (value: any) => void;
}

export type SettingBarDataString = {
    type: "string" | "markdown";
    name?: string;
    dataRef: Ref<string>; // 用于双向绑定的引用
    displayName?: string;
    description?: string;
    t_displayName?: TranslatedText;
    t_description?: TranslatedText;
    onChange?: (value: string) => boolean | void;
    callback?: (value: string) => void;
}

export type SettingBarDataSelect = {
    type: "select";
    name?: string;
    dataRef: Ref<any>; // 用于双向绑定的引用
    options: Array<{
            value: string;
            t_value?: TranslatedText;
        }>;
    displayName?: string;
    description?: string;
    t_displayName?: TranslatedText;
    t_description?: TranslatedText;
    onChange?: (value: any) => boolean | void;
    callback?: (value: any) => void;
}

export type SettingBarDataButton = {
    type: "button" | "iconButton";
    name?: string;
    dataRef: Ref<any>; // 用于双向绑定的引用
    displayName?: string;
    description?: string;
    buttonName?: string;
    icon?: Element | string; // 可以是一个图标元素或图标名称
    t_displayName?: TranslatedText;
    t_description?: TranslatedText;
    t_buttonName?: TranslatedText;
    onChange?: (value: any) => boolean | void;
    callback?: (value: any) => void;
}

// type 不能继承，但可以通过交叉类型 (&) 扩展属性
export type SettingBarDataBoolean = {
    type: "boolean";
    name?: string;
    dataRef: Ref<boolean>; // 用于双向绑定的引用
    displayName?: string;
    description?: string;
    t_displayName?: TranslatedText;
    t_description?: TranslatedText;
    onChange?: (value: boolean) => boolean | void;
    callback?: (value: boolean) => void;
};



export type SettingBarData = SettingBarDataBase | SettingBarDataBoolean | SettingBarDataSelect | SettingBarDataButton;