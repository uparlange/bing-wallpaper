import applicationComponent from "./modules/application-component.js";
import wallpaperComponent from "./modules/wallpaper-component.js";
import aboutComponent from "./modules/about-component.js";

const routes = [
    { path: "/", redirect: "/wallpaper" },
    { path: "/wallpaper", component: wallpaperComponent },
    { path: "/about", component: aboutComponent }
];

const router = VueRouter.createRouter({
    history: VueRouter.createMemoryHistory(),
    routes,
});

const app = Vue.createApp(applicationComponent);

app.use(router);

app.mount("#app");