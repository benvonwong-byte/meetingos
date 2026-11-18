import { createRouter, createWebHistory } from "vue-router";
import Home from "../views/Home.vue";
import Event from "../views/Event.vue";
import NewEvent from "../views/NewEvent.vue";
import Login from "../views/Login.vue";
import { sessionState, readMe, applyMe, forgetMe, viaDearCrisis, renewThroughApp } from "../dcSession";

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

// Once per page load: who the Dear Crisis app says is signed in on this browser (dcSession.ts). A member
// signed in on the app is signed in here, with the app's name and photo; signed out there, out here too.
// A guest who joined an event by name is left as they are.
let checked = false;
async function syncWithApp(fullPath: string): Promise<boolean> {
  if (checked) return true;
  checked = true;
  const st = sessionState();
  if (st === "fresh") {
    const me = await readMe();
    if (me) applyMe(me);
    else if (viaDearCrisis()) forgetMe(false);
    return true;
  }
  if (st === "stale" && (viaDearCrisis() || !localStorage.getItem("dc_user_name"))) {
    if (renewThroughApp(fullPath)) return false; // the page is leaving for the app, which renews and comes back
    if (viaDearCrisis()) forgetMe(false);
    return true;
  }
  if (st === "none" && viaDearCrisis()) forgetMe(false);
  return true;
}

router.beforeEach(async (to) => {
  if (!(await syncWithApp(to.fullPath))) return false;
  if (to.meta.public) return true;
  const name = localStorage.getItem("dc_user_name");
  if (!name) {
    const redirect = to.fullPath !== "/" ? to.fullPath : undefined;
    const mode = to.name === "event" ? "join" : "member";
    return { name: "login", query: { ...(redirect ? { redirect } : {}), mode } };
  }
  return true;
});

export default router;
