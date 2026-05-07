// ============================================================
// useAuthStore.js — Pinia Store cho Authentication State
// Quản lý: user, session, loading state, và auth listeners
// ============================================================
import { defineStore } from 'pinia'
import {
  getCurrentSession,
  getCurrentUser,
  signIn  as authSignIn,
  signOut as authSignOut,
  signUp  as authSignUp,
  onAuthStateChange,
} from '@/services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** User object từ Supabase (null nếu chưa đăng nhập) */
    user:    null,
    /** Session object (chứa access_token, etc.) */
    session: null,
    /** Loading khi đang thực hiện auth actions */
    loading: false,
    /** Error message gần nhất */
    error:   null,
    /** true sau khi đã gọi initialize() */
    initialized: false,
  }),

  getters: {
    isLoggedIn: (state) => !!state.user,
    userId:     (state) => state.user?.id ?? null,
    userEmail:  (state) => state.user?.email ?? null,
  },

  actions: {
    // ─────────────────────────────────────────────────────────
    // Khởi tạo auth state khi app mount
    // Gọi một lần trong App.vue (onMounted)
    // ─────────────────────────────────────────────────────────
    async initialize() {
      try {
        this.loading = true
        const session = await getCurrentSession()
        this.session = session
        this.user    = session?.user ?? null
      } catch (err) {
        console.error('[authStore] initialize error:', err.message)
      } finally {
        this.loading     = false
        this.initialized = true
      }

      // Lắng nghe thay đổi auth state (token refresh, sign out từ tab khác...)
      const { data: { subscription } } = onAuthStateChange((event, session) => {
        this.session = session
        this.user    = session?.user ?? null
      })

      // Lưu subscription để cleanup khi cần (optional)
      this._authSubscription = subscription
    },

    // ─────────────────────────────────────────────────────────
    // Đăng ký
    // Sau khi đăng ký thành công KHÔNG tự đăng nhập —
    // user phải tự điền form đăng nhập để kiểm soát rõ ràng hơn.
    // ─────────────────────────────────────────────────────────
    async signUp(email, password) {
      this.loading = true
      this.error   = null
      try {
        await authSignUp(email, password)
        // KHÔNG set this.user / this.session ở đây
        // để tránh auto-login sau khi đăng ký
        return { success: true }
      } catch (err) {
        this.error = err.message
        return { success: false, error: err.message }
      } finally {
        this.loading = false
      }
    },

    // ─────────────────────────────────────────────────────────
    // Đăng nhập
    // ─────────────────────────────────────────────────────────
    async signIn(email, password) {
      this.loading = true
      this.error   = null
      try {
        const { user, session } = await authSignIn(email, password)
        this.user    = user
        this.session = session
        return { success: true }
      } catch (err) {
        this.error = err.message
        return { success: false, error: err.message }
      } finally {
        this.loading = false
      }
    },

    // ─────────────────────────────────────────────────────────
    // Đăng xuất
    // ─────────────────────────────────────────────────────────
    async signOut() {
      this.loading = true
      this.error   = null
      try {
        await authSignOut()
        this.user    = null
        this.session = null
        return { success: true }
      } catch (err) {
        this.error = err.message
        return { success: false, error: err.message }
      } finally {
        this.loading = false
      }
    },
  },
})
