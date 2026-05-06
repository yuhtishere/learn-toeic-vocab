// ============================================================
// Vue Router — index.js
// ============================================================
import { createRouter, createWebHashHistory } from 'vue-router'

// Lazy-load các view để tối ưu bundle size
const HomeView      = () => import('@/views/HomeView.vue')
const DayView       = () => import('@/views/DayView.vue')
const FlashCardView = () => import('@/views/FlashCardView.vue')
const StudyView     = () => import('@/views/StudyView.vue')
const QuizView      = () => import('@/views/QuizView.vue')
const MyListView    = () => import('@/views/MyListView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    meta: { title: 'Trang chủ — TOEIC Vocab' }
  },
  {
    path: '/day/:dayKey',
    name: 'day',
    component: DayView,
    meta: { title: 'Học từ vựng — TOEIC Vocab' }
  },
  {
    // Route đặc biệt phải đứng trước /flashcard/:dayKey để không bị bắt thành dayKey = "my-list".
    path: '/flashcard/my-list',
    name: 'flashcard-mylist',
    component: FlashCardView,
    meta: { title: 'Flashcard — Từ của tôi' }
  },
  {
    path: '/study/:dayKey',
    name: 'study',
    component: StudyView,
    meta: { title: 'Học từ vựng — TOEIC Vocab' }
  },
  {
    path: '/quiz/:dayKey',
    name: 'quiz',
    component: QuizView,
    meta: { title: 'Quiz — TOEIC Vocab' }
  },
  {
    path: '/flashcard/:dayKey',
    name: 'flashcard',
    component: FlashCardView,
    meta: { title: 'Flashcard — TOEIC Vocab' }
  },
  {
    path: '/my-list',
    name: 'my-list',
    component: MyListView,
    meta: { title: 'Từ vựng của tôi — TOEIC Vocab' }
  },
  // Redirect mọi route không hợp lệ về trang chủ
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  // Dùng hash history để không cần server config (phù hợp static hosting)
  history: createWebHashHistory(),
  routes,
  // Scroll to top khi chuyển trang
  scrollBehavior() {
    return { top: 0 }
  }
})

// Cập nhật document title theo route meta
router.afterEach((to) => {
  document.title = to.meta.title || 'TOEIC Vocab'
})

export default router
