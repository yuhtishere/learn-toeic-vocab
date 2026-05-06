// ============================================================
// main.js — Entry Point
// ============================================================
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPersistedState from 'pinia-plugin-persistedstate'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// Element Plus Icons
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

// Router
import router from './router'

// Global styles
import './assets/styles/main.scss'

// Root component
import App from './App.vue'

// Khởi tạo Pinia với plugin persist
const pinia = createPinia()
pinia.use(piniaPersistedState)

const app = createApp(App)

// Đăng ký tất cả Element Plus icons toàn cục
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app
  .use(pinia)
  .use(router)
  .use(ElementPlus)
  .mount('#app')
