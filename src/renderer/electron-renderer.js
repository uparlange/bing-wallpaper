import applicationComponent from "./modules/application-component.js";
import wallpaperComponent from "./modules/wallpaper-component.js";
import aboutComponent from "./modules/about-component.js";
import sourcesComponent from "./modules/sources-component.js";

const routes = [
    { path: "/", redirect: "/wallpaper" },
    { path: "/wallpaper", component: wallpaperComponent, meta: { transition: null } },
    { path: "/about", component: aboutComponent, meta: { transition: null } },
    { path: "/sources", component: sourcesComponent, meta: { transition: null } }
];

const router = VueRouter.createRouter({
    history: VueRouter.createMemoryHistory(),
    routes,
});

const app = Vue.createApp(applicationComponent);

app.use(router);

app.mount("#app");