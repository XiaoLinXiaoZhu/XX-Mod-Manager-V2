import { createI18n } from "vue-i18n";
import { SingletonDecorator } from "../utils/Singleton";

import { resolveResource } from '@tauri-apps/api/path'

import en_us from "../../../src-tauri/resources/locals/en-US.json";
import zh_cn from "../../../src-tauri/resources/locals/zh-CN.json";
import { readFile } from "../services/FileHelper";




@SingletonDecorator
export class LocleHelper{
    constructor() {
        console.log('LocleHelper initialized');   
    }

    i18nInstance = createI18n({
        locale: "en-US", // set locale
        fallbackLocale: "en-US", // set fallback locale
        legacy: false, // you must set `false`, to use Composition API
        messages: {
            "en-US": en_us,
            "zh-CN": zh_cn,
        },
    });

    public async switchToLocalFile(){
        const en_usPath = await resolveResource("locals/en-US.json");
        const zh_cnPath = await resolveResource("locals/zh-CN.json");

        // read the files
        const en_usContent = await readFile(en_usPath, false);
        const zh_cnContent = await readFile(zh_cnPath, false);

        // set the messages
        this.i18nInstance.global.setLocaleMessage("en-US", JSON.parse(en_usContent));
        this.i18nInstance.global.setLocaleMessage("zh-CN", JSON.parse(zh_cnContent));
    }


}