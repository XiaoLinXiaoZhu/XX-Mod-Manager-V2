import { createRouter, createWebHistory } from "vue-router";
import MainPage from "../pages/MainPage.vue";
import SwitchConfigPage from "../pages/SwitchConfigPage.vue";
// 教程页面
import TutorialPage from "../pages/TutorialPage.vue";
import ModListPage from "../pages/ModListPage.vue";

// 测试界面
import TestRW from "@/pages/test/TestRW.vue";
import TestDialogPage from "@/pages/test/TestDialogPage.vue";

export default createRouter({
  history: createWebHistory("/"),
  routes: [
    {
      path: "/",
      name: "Main",
      component: MainPage,
    },
    {
      path: "/mod-list",
      name: "ModList",
      component: ModListPage,
    },
    {
      path: "/switch-config",
      name: "SwitchConfig",
      component: SwitchConfigPage,
    },
    {
      path: "/tutorial",
      name: "Tutorial",
      component: TutorialPage,
    },
    {
      path: "/test-rw",
      name: "TestRW",
      component: TestRW,
    },
    {
      path: "/test-dialog",
      name: "TestDialog",
      component: TestDialogPage,
    },
  ],
});
