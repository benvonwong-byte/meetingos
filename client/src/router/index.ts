import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Event from "../views/Event.vue";
import NewEvent from "../views/NewEvent.vue";
import Login from "../views/Login.vue";

const routes = [
  {
    path: "/login",
    name: "login",
    component: Login,
    meta: { public: true },
  },
  {
    path: "/",
    name: "home",
    component: Home,
    meta: { transition: "fade" },
  },
  {
    path: "/new",
    name: "newevent",
    component: NewEvent,
    meta: { transition: "slide" },
  },
  {
    path: "/event/:id",
    name: "event",
    component: Event,
    meta: { transition: "fade" },
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  if (to.meta.public) return true;
  const name = localStorage.getItem("dc_user_name");
  if (!name) {
    // Preserve destination so login can redirect back after auth
    const redirect = to.fullPath !== "/" ? to.fullPath : undefined;
    return { name: "login", query: redirect ? { redirect } : {} };
  }
  return true;
});

export default router;
