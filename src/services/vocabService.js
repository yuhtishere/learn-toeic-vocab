// ============================================================
// vocabService.js — CRUD cho vocabularies & user_progress
// ============================================================
import { supabase } from './supabaseClient'

// ─────────────────────────────────────────────────────────────
// Fetch toàn bộ tiến độ của user (JOIN với vocabularies)
// Trả về array các row với: day_key, local_id, status, is_bookmarked
// ─────────────────────────────────────────────────────────────
export async function fetchAllUserProgress(userId) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        status,
        is_bookmarked,
        vocabularies (
          id,
          local_id,
          day_key
        )
      `)
      .eq('user_id', userId)

    if (error) throw error

    // Flatten nested vocabularies object
    return data.map(row => ({
      status:        row.status,
      is_bookmarked: row.is_bookmarked,
      local_id:      row.vocabularies?.local_id,
      day_key:       row.vocabularies?.day_key,
      vocab_uuid:    row.vocabularies?.id,
    })).filter(row => row.local_id != null) // Bỏ qua row lỗi
  } catch (error) {
    console.error('[vocabService] fetchAllUserProgress error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Build cache UUID: "dayKey|localId" → vocab UUID
// Dùng để translate local_id → UUID khi gọi upsertProgress
// ─────────────────────────────────────────────────────────────
export async function buildVocabUUIDCache(dayKeys) {
  try {
    const { data, error } = await supabase
      .from('vocabularies')
      .select('id, local_id, day_key')
      .in('day_key', dayKeys)

    if (error) throw error

    // Build lookup map
    const cache = {}
    data.forEach(row => {
      cache[`${row.day_key}|${row.local_id}`] = row.id
    })
    return cache
  } catch (error) {
    console.error('[vocabService] buildVocabUUIDCache error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Upsert tiến độ học của một từ vựng
// Dùng UPSERT để INSERT hoặc UPDATE tùy thuộc vào conflict
//
// @param {string} userId   — UUID từ auth.users
// @param {string} vocabId  — UUID từ bảng vocabularies
// @param {object} payload  — { status?: 'known'|'unknown', is_bookmarked?: boolean }
// ─────────────────────────────────────────────────────────────
export async function upsertProgress(userId, vocabId, payload) {
  try {
    const { error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id:    userId,
          vocab_id:   vocabId,
          ...payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,vocab_id' }
      )
    if (error) throw error
  } catch (error) {
    console.error('[vocabService] upsertProgress error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Toggle bookmark (wrapper tiện lợi)
// ─────────────────────────────────────────────────────────────
export async function toggleBookmarkRemote(userId, vocabId, currentValue) {
  return upsertProgress(userId, vocabId, { is_bookmarked: !currentValue })
}

// ─────────────────────────────────────────────────────────────
// Xóa tất cả bookmark của user trên Supabase
// ─────────────────────────────────────────────────────────────
export async function clearAllBookmarks(userId) {
  try {
    const { error } = await supabase
      .from('user_progress')
      .update({ is_bookmarked: false, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_bookmarked', true)

    if (error) throw error
  } catch (error) {
    console.error('[vocabService] clearAllBookmarks error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Lấy danh sách từ đã bookmark của user
// ─────────────────────────────────────────────────────────────
export async function fetchBookmarkedVocabs(userId) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select(`
        vocab_id,
        status,
        vocabularies (
          id, word, type, meaning, example, day_key
        )
      `)
      .eq('user_id', userId)
      .eq('is_bookmarked', true)

    if (error) throw error

    return data.map(row => ({
      ...row.vocabularies,
      status: row.status,
      is_bookmarked: true,
    }))
  } catch (error) {
    console.error('[vocabService] fetchBookmarkedVocabs error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Lưu kết quả quiz lên Supabase
// ─────────────────────────────────────────────────────────────
export async function saveQuizResultRemote(userId, dayKey, result) {
  try {
    const { error } = await supabase
      .from('quiz_results')
      .insert({
        user_id:    userId,
        day_key:    dayKey,
        score:      result.score,
        correct:    result.correct,
        wrong:      result.wrong,
        total:      result.total,
        created_at: result.date || new Date().toISOString(),
      })
    if (error) throw error
  } catch (error) {
    console.error('[vocabService] saveQuizResultRemote error:', error.message)
    throw error
  }
}

// ─────────────────────────────────────────────────────────────
// Lấy lịch sử quiz của một ngày
// ─────────────────────────────────────────────────────────────
export async function fetchQuizHistory(userId, dayKey) {
  try {
    const { data, error } = await supabase
      .from('quiz_results')
      .select('score, correct, wrong, total, created_at')
      .eq('user_id', userId)
      .eq('day_key', dayKey)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error
    return data
  } catch (error) {
    console.error('[vocabService] fetchQuizHistory error:', error.message)
    throw error
  }
}

// ============================================================
// Lay toan bo lich su quiz cua user
// ============================================================
export async function fetchAllQuizResults(userId, options = {}) {
  const { dayKey = null, limit = 200, offset = 0 } = options

  try {
    let query = supabase
      .from('quiz_results')
      .select('day_key, score, correct, wrong, total, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (dayKey) {
      query = query.eq('day_key', dayKey)
    }

    if (Number.isFinite(limit)) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query
    if (error) throw error

    return data || []
  } catch (error) {
    console.error('[vocabService] fetchAllQuizResults error:', error.message)
    throw error
  }
}
