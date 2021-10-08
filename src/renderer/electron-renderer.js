import applicationComponent from "./modules/application-component.js";
import wallpaperComponent from "./modules/wallpaper-component.js";
import aboutComponent from "./modules/about-component.js";
import sourcesComponent from "./modules/sources-component.js";
import historyComponent from "./modules/history-component.js";
import debugComponent from "./modules/debug-component.js";
import progressBarComponent from "./modules/progress-bar-component.js";

const routes = [
    { path: "/wallpaper", component: wallpaperComponent, meta: { transition: null } },
    { path: "/about", component: aboutComponent, meta: { transition: null } },
    { path: "/sources", component: sourcesComponent, meta: { transition: null } },
    { path: "/history", component: historyComponent, meta: { transition: null } },
    { path: "/debug", component: debugComponent, meta: { transition: null } }
];

const router = VueRouter.createRouter({
    history: VueRouter.createMemoryHistory(),
    routes,
});

const app = Vue.createApp(applicationComponent);

app.use(router);

app.component("progress-bar", progressBarComponent);

app.mount("#app");