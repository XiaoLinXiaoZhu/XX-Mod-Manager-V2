import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { LocalHelper } from "./LocalHelperClass";
import { nextTick } from "vue";

describe("LocalHelper", () => {
    let localHelper: LocalHelper;

    beforeEach(() => {
        localHelper = new LocalHelper();
    });

    afterEach(() => {
        // 清理
        localHelper.setI18nLocale("en-US");
    });

    describe("$t 函数测试", () => {
        test("应该能获取英文翻译", () => {
            localHelper.setI18nLocale("en-US");
            const result = localHelper.$t("message.hello");
            expect(result).toBe("Hello, World");
        });

        test("应该能获取中文翻译", () => {
            localHelper.setI18nLocale("zh-CN");
            const result = localHelper.$t("message.hello");
            expect(result).toBe("欢迎使用 XX-ModsManager（XXMM）");
        });

        test("应该能处理带参数的翻译", () => {
            localHelper.setI18nLocale("en-US");
            const result = localHelper.$t("plugin.error.initializationFailed", {
                pluginName: "test-plugin",
                errorMessage: "test error"
            });
            expect(result).toContain("test-plugin");
            expect(result).toContain("test error");
        });

        test("应该返回key当翻译不存在时", () => {
            localHelper.setI18nLocale("en-US");
            const result = localHelper.$t("non.existent.key");
            expect(result).toBe("non.existent.key");
        });
    });

    describe("$rt 函数响应式测试", () => {
        test("应该响应语言切换进行更新", async () => {
            localHelper.setI18nLocale("en-US");
            const reactiveTranslation = localHelper.$rt("message.hello");
            
            // 初始值应该是英文
            expect(reactiveTranslation.value).toBe("Hello, World");

            // 切换到中文
            localHelper.setI18nLocale("zh-CN");
            await nextTick();
            
            // 应该更新为中文
            expect(reactiveTranslation.value).toBe("欢迎使用 XX-ModsManager（XXMM）");
        });

        test("应该响应带参数翻译的语言切换", async () => {
            localHelper.setI18nLocale("en-US");
            const reactiveTranslation = localHelper.$rt("plugin.error.initializationFailed", {
                pluginName: "test-plugin",
                errorMessage: "test error"
            });
            
            const enResult = reactiveTranslation.value;
            expect(enResult).toContain("test-plugin");
            expect(enResult).toContain("test error");

            // 切换到中文
            localHelper.setI18nLocale("zh-CN");
            await nextTick();
            
            const zhResult = reactiveTranslation.value;
            expect(zhResult).toContain("test-plugin");
            expect(zhResult).toContain("test error");
            // 中文的格式应该不同
            expect(zhResult).not.toBe(enResult);
        });

        test("应该跟踪currentLanguageRef的变化", async () => {
            const initialLocale = localHelper.currentLanguageRef.value;
            const reactiveTranslation = localHelper.$rt("message.hello");
            
            // 验证初始状态
            expect(initialLocale).toBe("en-US");
            expect(reactiveTranslation.value).toBe("Hello, World");

            // 使用setI18nLocale来确保i18n实例也更新
            localHelper.setI18nLocale("zh-CN");
            await nextTick();
            
            // 应该触发响应式更新
            expect(reactiveTranslation.value).toBe("欢迎使用 XX-ModsManager（XXMM）");
        });
    });

    describe("语言切换功能测试", () => {
        test("setI18nLocale应该正确更新当前语言", () => {
            expect(localHelper.currentLanguageRef.value).toBe("en-US");
            
            localHelper.setI18nLocale("zh-CN");
            expect(localHelper.currentLanguageRef.value).toBe("zh-CN");
            
            localHelper.setI18nLocale("en-US");
            expect(localHelper.currentLanguageRef.value).toBe("en-US");
        });

        test("语言切换应该影响所有响应式翻译", async () => {
            localHelper.setI18nLocale("en-US");
            
            const helloTranslation = localHelper.$rt("message.hello");
            const settingTranslation = localHelper.$rt("setting.title");
            
            expect(helloTranslation.value).toBe("Hello, World");
            expect(settingTranslation.value).toBe("Settings");

            // 切换到中文
            localHelper.setI18nLocale("zh-CN");
            await nextTick();
            
            expect(helloTranslation.value).toBe("欢迎使用 XX-ModsManager（XXMM）");
            expect(settingTranslation.value).toBe("设置");
        });
    });

    describe("getTranslatedText 测试", () => {
        test("应该响应式返回翻译文本", async () => {
            const testText = {
                "en-US": "English Text",
                "zh-CN": "中文文本"
            };

            localHelper.setI18nLocale("en-US");
            const reactiveText = localHelper.getTranslatedText(testText);
            
            expect(reactiveText.value).toBe("English Text");

            // 切换语言
            localHelper.setI18nLocale("zh-CN");
            await nextTick();
            
            expect(reactiveText.value).toBe("中文文本");
        });

        test("应该回退到英文当当前语言不存在时", () => {
            const testText = {
                "en-US": "English Text",
                "zh-CN": "English Text"  // 使用英文作为回退
            };

            localHelper.setI18nLocale("zh-CN");
            const reactiveText = localHelper.getTranslatedText(testText);
            
            expect(reactiveText.value).toBe("English Text");
        });

        test("应该处理空字符串翻译", () => {
            const emptyText = {
                "en-US": "",
                "zh-CN": ""
            };
            
            const reactiveText = localHelper.getTranslatedText(emptyText);
            expect(reactiveText.value).toBe("");
        });
    });

    describe("集成测试", () => {
        test("完整的语言切换流程", async () => {
            // 初始状态
            localHelper.setI18nLocale("en-US");
            const helloT = localHelper.$t("message.hello");
            const helloRT = localHelper.$rt("message.hello");
            
            expect(helloT).toBe("Hello, World");
            expect(helloRT.value).toBe("Hello, World");

            // 切换语言
            localHelper.setI18nLocale("zh-CN");
            await nextTick();

            // 验证两种方式的翻译
            expect(localHelper.$t("message.hello")).toBe("欢迎使用 XX-ModsManager（XXMM）");
            expect(helloRT.value).toBe("欢迎使用 XX-ModsManager（XXMM）");

            // 再切换回英文
            localHelper.setI18nLocale("en-US");
            await nextTick();

            expect(localHelper.$t("message.hello")).toBe("Hello, World");
            expect(helloRT.value).toBe("Hello, World");
        });
    });
});