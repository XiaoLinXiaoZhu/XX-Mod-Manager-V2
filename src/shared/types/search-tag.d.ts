export type TagType = "category" | "tags" | "name" | "description" | "location" | "hotkeys";

export type SearchTag = {
    type: TagType;
    value: string;
    disabled: boolean;
    raw: string; // 原始输入字符串
};