import { createRouter, createWebHistory } from "vue-router";
import MainPage from "../pages/MainPage.vue";
import SwitchConfigPage from "../pages/SwitchConfigPage.vue";
// 教程页面
import TutorialPage from "../pages/TutorialPage.vue";
import ModListPage from "../pages/ModListPage.vue";

// 测试界面
import TestRW from "@/pages/test/TestRW.vue";
import TestDialogPage from "@/pages/test/TestDialogPage.vue";
import TestSelectFile from "@/pages/test/TestSelectFile.vue";
import TestSettingBar from "@/pages/test/TestSettingBar.vue";
import TestGround from "@/pages/test/TestGround.vue";
import { EventSystem, EventType } from "@/core/event/EventSystem";

export const routes = [
  {
    path: "/",
    name: "Main",
    component: MainPage,
  },
  {
    path: "/mod-list",
    name: "ModList",
    component: ModListPage,
    props: true
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
    path: "/test-ground",
    name: "TestGround",
    component: TestGround,
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
  {

    path: "/test-select-file",
    name: "TestSelectFile",
    component: TestSelectFile,
  },
  {
    path: "/test-setting-bar",
    name: "TestSettingBar",
    component: TestSettingBar,
  }
];

const router = createRouter({
  history: createWebHistory("/"),
  routes: routes,
});


// 添加导航守卫
router.afterEach((to, from) => {
  // debug
  console.log("Route changed from", from.name, "to", to.name);
  // EventSystem.trigger(EventType.routeChanged, { to: to.name, from: from.name })
  setTimeout(() => {
    EventSystem.trigger(EventType.routeChanged, { to: to.name, from: from.name  });
    // debug
  },200);
})

export default router;