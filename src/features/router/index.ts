import { createRouter, createWebHistory } from "vue-router";
import MainPage from "@/ui/pages/MainPage.vue";
import SwitchConfigPage from "@/ui/pages/SwitchConfigPage.vue";
// 教程页面
import TutorialPage from "@/ui/pages/TutorialPage.vue";
import ModListPage from "@/ui/pages/ModListPage.vue";

// 测试界面
import TestRW from "@/ui/pages/test/TestRW.vue";
import TestDialogPage from "@/ui/pages/test/TestDialogPage.vue";
import TestSelectFile from "@/ui/pages/test/TestSelectFile.vue";
import TestSettingBar from "@/ui/pages/test/TestSettingBar.vue";
import TestGround from "@/ui/pages/test/TestGround.vue";
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
    console.log('EventSystem: routeChanged triggered', { to: to.name, from: from.name });
  },200);
})

export default router;