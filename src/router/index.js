import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import About from '../views/About.vue'
import Mh4uSelection from '../views/Mh4uSelection.vue'
import MhguSelection from '../views/MhguSelection.vue'
import Wishes from '../views/Wishes.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'Home', component: Home },
    { path: '/about', name: 'About', component: About },
    { path: '/mh4u', name: 'Mh4uSelection', component: Mh4uSelection },
    { path: '/mhgu', name: 'MhguSelection', component: MhguSelection },
    { path: '/wishlist', name: 'wishes', component: Wishes }
  ]
})

export default router
