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
const QuizResultsView = () => import('@/views/QuizResultsView.vue')
const MyListView    = () => import('@/views/MyListView.vue')
const AuthView      = () => import('@/views/AuthView.vue')

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
    meta: { title: 'Học từ vựng — TOEIC Vocab', requiresAuth: true }
  },
  {
    path: '/quiz/:dayKey',
    name: 'quiz',
    component: QuizView,
    meta: { title: 'Quiz — TOEIC Vocab', requiresAuth: true }
  },
  {
    path: '/quiz-results',
    name: 'quiz-results',
    component: QuizResultsView,
    meta: { title: 'Kết quả Quiz — TOEIC Vocab', requiresAuth: true }
  },
  {
    path: '/flashcard/:dayKey',
    name: 'flashcard',
    component: FlashCardView,
    meta: { title: 'Flashcard — TOEIC Vocab', requiresAuth: true }
  },
  {
    path: '/my-list',
    name: 'my-list',
    component: MyListView,
    meta: { title: 'Từ vựng của tôi — TOEIC Vocab', requiresAuth: true }
  },
  {
    path: '/auth',
    name: 'auth',
    component: AuthView,
    meta: { title: 'Đăng nhập / Đăng ký — TOEIC Vocab' }
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

// Route Guard: Kiểm tra đăng nhập
router.beforeEach(async (to, from, next) => {
  // Import store ở đây để tránh lỗi circular dependency khi khởi tạo app
  const { useAuthStore } = await import('@/store/auth')
  const authStore = useAuthStore()
  
  // Đảm bảo auth đã được khởi tạo (tránh trường hợp tải trực tiếp vào route được bảo vệ)
  if (!authStore.initialized) {
    await authStore.initialize()
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (requiresAuth && !authStore.isLoggedIn) {
    // Nếu chưa đăng nhập mà vào trang yêu cầu đăng nhập -> Chuyển hướng sang Auth
    next({ name: 'auth', query: { redirect: to.fullPath } })
  } else if (to.name === 'auth' && authStore.isLoggedIn) {
    // Nếu đã đăng nhập mà vẫn cố vào trang Auth -> Chuyển về Home
    next({ name: 'home' })
  } else {
    next()
  }
})

export default router
