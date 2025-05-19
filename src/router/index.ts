import { createRouter, createWebHistory } from "vue-router";
import MainPage from "../pages/MainPage.vue";
import SwitchConfigPage from "../pages/SwitchConfigPage.vue";
// 教程页面
import TutorialPage from "../pages/TutorialPage.vue";
import TestRW from "../pages/TestRW.vue";

export default createRouter({
  history: createWebHistory("/"),
  routes: [
    {
      path: "/",
      name: "Main",
      component: MainPage,
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
  ],
});
