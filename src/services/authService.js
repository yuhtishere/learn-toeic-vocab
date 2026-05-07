// ============================================================
// authService.js — Xử lý Authentication
// Sign up, Sign in, Sign out, lắng nghe auth state changes
// (Đã xóa logic sync localStorage — dữ liệu quản lý bởi vocabService)
// ============================================================
import { supabase } from './supabaseClient'

// ─────────────────────────────────────────────────────────────
// Lấy session hiện tại (dùng khi khởi động app để restore state)
// ─────────────────────────────────────────────────────────────
export async function getCurrentSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

// ─────────────────────────────────────────────────────────────
// Lấy thông tin user đang đăng nhập
// ─────────────────────────────────────────────────────────────
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// ─────────────────────────────────────────────────────────────
// Đăng ký tài khoản mới bằng Email/Password
// Gọi signOut ngay sau để hủy session tự động — user phải login thủ công.
// ─────────────────────────────────────────────────────────────
export async function signUp(email, password) {
  try {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // Hủy session tự động mà Supabase tạo sau signUp
    // để đảm bảo user phải đăng nhập thủ công
    await supabase.auth.signOut()
    return { user: data.user, session: null }
  } catch (error) {
    console.error('[authService] signUp error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Đăng nhập bằng Email/Password
// ─────────────────────────────────────────────────────────────
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { user: data.user, session: data.session }
  } catch (error) {
    console.error('[authService] signIn error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Đăng xuất
// ─────────────────────────────────────────────────────────────
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('[authService] signOut error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Lắng nghe thay đổi trạng thái auth
// Usage:
//   const { data: { subscription } } = onAuthStateChange((event, session) => { ... })
//   // Cleanup: subscription.unsubscribe()
// ─────────────────────────────────────────────────────────────
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}
