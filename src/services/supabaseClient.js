// ============================================================
// supabaseClient.js — Khởi tạo Supabase Client
// Import file này ở mọi nơi cần tương tác với Supabase.
// Biến môi trường được đọc từ file .env (VITE_ prefix cho Vite)
// ============================================================
import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Supabase] Thiếu biến môi trường. Hãy tạo file .env và thêm VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.'
  )
}

// Tạo singleton client — dùng chung toàn app
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Tự động persist session vào localStorage của trình duyệt
    persistSession: true,
    // Tự động refresh token trước khi hết hạn
    autoRefreshToken: true,
  },
})
