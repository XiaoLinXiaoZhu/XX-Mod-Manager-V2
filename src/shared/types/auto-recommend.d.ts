export type AutoRecommendType = "matchPrefix" | "matchRegex" | "matchContent";

export type AutoRecommendItem = {
    type: AutoRecommendType;
    match: string; // 匹配的字符串的正则表达式
    content: string; // 推荐的描述文本，比如补全后的内容
    callback?: (autoRecommendItem: AutoRecommendItem) => void; // 点击时的回调函数
}