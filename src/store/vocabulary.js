// ============================================================
// Pinia Store — vocabulary.js
// Quản lý tiến độ học, bookmark, quiz history
// Dữ liệu được lưu trên Supabase, giữ trên RAM (Pinia state)
// Dùng Optimistic Update: cập nhật RAM ngay, sync Supabase background
// ============================================================
import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import database from '../../database.json'
import {
  fetchAllUserProgress,
  upsertProgress,
  clearAllBookmarks as clearAllBookmarksRemote,
  saveQuizResultRemote,
  fetchAllQuizResults,
  buildVocabUUIDCache,
} from '@/services/vocabService'

function normalizeQuizResult(row) {
  return {
    dayKey:  row.day_key ?? row.dayKey,
    score:   row.score,
    correct: row.correct,
    wrong:   row.wrong,
    total:   row.total,
    date:    row.created_at ?? row.date,
  }
}

export const useVocabularyStore = defineStore('vocabulary', {
  // ─────────────────────────────────────────────────────────────
  // State — giữ trên RAM, không persist xuống localStorage
  // ─────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * Map tiến độ mỗi từ.
     * Key: "dayKey_localId" (ví dụ: "day 1_5")
     * Value: { status: 'known'|'unknown'|null, is_bookmarked: boolean }
     */
    progressMap: {},

    /**
     * Danh sách composite key của từ đã bookmark.
     * Format: "wordId_dayKey" (ví dụ: "5_day 1")
     * Giữ format cũ để backward-compatible với template hiện tại.
     */
    bookmarkedIds: [],

    /**
     * Lịch sử điểm quiz.
     * Key: dayKey — Value: Array<{ score, correct, wrong, total, date }>
     */
    quizHistory: {},

    /**
     * Full quiz result list for the results screen.
     * Array<{ dayKey, score, correct, wrong, total, date }>
     */
    quizResults: [],
    quizResultsLoading: false,
    quizResultsError: null,
    quizResultsLoaded: false,

    /**
     * Cache UUID của từ vựng trong Supabase.
     * Key: "dayKey|localId" (ví dụ: "day 1|5")
     * Value: UUID string
     * Dùng để gọi upsertProgress mà không cần query lại.
     */
    vocabUUIDCache: {},

    /** true khi đang fetch dữ liệu từ Supabase */
    loading: false,
  }),

  // ─────────────────────────────────────────────────────────────
  // Getters — backward-compatible với tất cả Views hiện tại
  // ─────────────────────────────────────────────────────────────
  getters: {
    /** Lấy toàn bộ từ điển, trả về object với key là dayKey */
    allDays: () => {
      const days = {}
      for (const [dayKey, words] of Object.entries(database)) {
        days[dayKey] = words.map(word => ({ ...word, dayKey }))
      }
      return days
    },

    /** Danh sách tất cả các day keys */
    dayKeys: () => Object.keys(database),

    /** Lấy từ của một ngày cụ thể */
    getWordsByDay: () => (dayKey) => {
      return (database[dayKey] || []).map(word => ({ ...word, dayKey }))
    },

    /** Kiểm tra một từ có được bookmark không (theo composite key) */
    isBookmarked: (state) => (wordId) => {
      return state.bookmarkedIds.includes(wordId)
    },

    /** Lấy tất cả từ đã bookmark với đầy đủ thông tin */
    bookmarkedWords: (state) => {
      const allWords = []
      for (const [dayKey, words] of Object.entries(database)) {
        words.forEach(word => {
          if (state.bookmarkedIds.includes(`${word.id}_${dayKey}`)) {
            allWords.push({ ...word, dayKey })
          }
        })
      }
      return allWords
    },

    /** Lấy trạng thái một từ trong flashcard */
    getWordStatus: (state) => (dayKey, wordId) => {
      return state.progressMap[`${dayKey}_${wordId}`]?.status || null
    },

    /** Số từ đã thuộc trong một ngày */
    knownCountByDay: (state) => (dayKey) => {
      const words = database[dayKey] || []
      return words.filter(w => state.progressMap[`${dayKey}_${w.id}`]?.status === 'known').length
    },

    /** Phần trăm hoàn thành một ngày (0-100) */
    progressPercentByDay: (state) => (dayKey) => {
      const words = database[dayKey] || []
      if (!words.length) return 0
      const known = words.filter(w => state.progressMap[`${dayKey}_${w.id}`]?.status === 'known').length
      return Math.round((known / words.length) * 100)
    },

    /** Lấy lịch sử quiz của một ngày */
    getQuizHistory: (state) => (dayKey) => {
      return state.quizHistory[dayKey] || []
    },

    /** Lấy điểm cao nhất quiz của một ngày */
    bestQuizScore: (state) => (dayKey) => {
      const history = state.quizHistory[dayKey] || []
      if (!history.length) return null
      return history.reduce((best, h) => h.score > best.score ? h : best, history[0])
    },

    /** Toan bo ket qua quiz da lam, moi nhat truoc */
    allQuizResults: (state) => state.quizResults,

    /** Thong ke tong quan cho man hinh ket qua quiz */
    quizResultsSummary: (state) => {
      const totalAttempts = state.quizResults.length
      if (!totalAttempts) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          bestResult: null,
          latestResult: null,
          totalCorrect: 0,
          totalQuestions: 0,
          completedDays: 0,
        }
      }

      const totalScore = state.quizResults.reduce((sum, result) => sum + (result.score || 0), 0)
      const totalCorrect = state.quizResults.reduce((sum, result) => sum + (result.correct || 0), 0)
      const totalQuestions = state.quizResults.reduce((sum, result) => sum + (result.total || 0), 0)
      const bestResult = state.quizResults.reduce(
        (best, result) => result.score > best.score ? result : best,
        state.quizResults[0]
      )

      return {
        totalAttempts,
        averageScore: Math.round(totalScore / totalAttempts),
        bestResult,
        latestResult: state.quizResults[0],
        totalCorrect,
        totalQuestions,
        completedDays: new Set(state.quizResults.map(result => result.dayKey)).size,
      }
    },
  },

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────
  actions: {

    // ═══════════════════════════════════════════════════════════
    // SUPABASE SYNC ACTIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Fetch toàn bộ tiến độ của user từ Supabase.
     * Gọi sau khi user đăng nhập thành công.
     */
    async fetchUserProgress(userId) {
      this.loading = true
      try {
        const dayKeys = Object.keys(database)

        // Song song: fetch progress + build UUID cache + fetch quiz history
        const [progressData, uuidCache, quizData] = await Promise.all([
          fetchAllUserProgress(userId),
          buildVocabUUIDCache(dayKeys),
          // Query quiz_results cho user này
          (async () => {
            const { supabase } = await import('@/services/supabaseClient')
            const { data } = await supabase
              .from('quiz_results')
              .select('day_key, score, correct, wrong, total, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
            return data || []
          })(),
        ])

        this.vocabUUIDCache = uuidCache
        this.progressMap = {}
        this.bookmarkedIds = []
        this.quizHistory = {}
        this.quizResults = quizData.map(normalizeQuizResult)
        this.quizResultsLoaded = true
        this.quizResultsError = null

        // Populate progressMap và bookmarkedIds
        progressData.forEach(row => {
          const key = `${row.day_key}_${row.local_id}`
          this.progressMap[key] = {
            status:        row.status || null,
            is_bookmarked: row.is_bookmarked || false,
          }
          if (row.is_bookmarked) {
            this.bookmarkedIds.push(`${row.local_id}_${row.day_key}`)
          }
        })

        // Populate quizHistory (group by day_key, max 10 mỗi ngày)
        quizData.forEach(row => {
          if (!this.quizHistory[row.day_key]) {
            this.quizHistory[row.day_key] = []
          }
          if (this.quizHistory[row.day_key].length < 10) {
            this.quizHistory[row.day_key].push({
              score:   row.score,
              correct: row.correct,
              wrong:   row.wrong,
              total:   row.total,
              date:    row.created_at,
            })
          }
        })
      } catch (err) {
        console.error('[vocabStore] fetchUserProgress error:', err.message)
      } finally {
        this.loading = false
      }
    },

    /**
     * Xóa toàn bộ dữ liệu user khỏi RAM.
     * Gọi khi user đăng xuất.
     */
    clearUserProgress() {
      this.progressMap = {}
      this.bookmarkedIds = []
      this.quizHistory = {}
      this.quizResults = []
      this.quizResultsError = null
      this.quizResultsLoaded = false
      this.vocabUUIDCache = {}
    },

    // ═══════════════════════════════════════════════════════════
    // PROGRESS ACTIONS (Optimistic Update + Supabase background)
    // ═══════════════════════════════════════════════════════════

    /**
     * Helper: lấy userId và vocabUUID, rồi gọi upsertProgress background.
     */
    /** Fetch full quiz result history for the current user */
    async fetchQuizResults(options = {}) {
      const authStore = useAuthStore()
      if (!authStore.userId) {
        this.quizResults = []
        this.quizResultsLoaded = false
        return
      }

      this.quizResultsLoading = true
      this.quizResultsError = null
      try {
        const data = await fetchAllQuizResults(authStore.userId, options)
        this.quizResults = data.map(normalizeQuizResult)
        this.quizResultsLoaded = true
      } catch (err) {
        this.quizResultsError = err.message || 'Fetch quiz results failed'
        console.error('[vocabStore] fetchQuizResults error:', err.message)
      } finally {
        this.quizResultsLoading = false
      }
    },

    _syncToSupabase(dayKey, wordId, payload) {
      const authStore = useAuthStore()
      const userId = authStore.userId
      const vocabId = this.vocabUUIDCache[`${dayKey}|${wordId}`]
      if (userId && vocabId) {
        upsertProgress(userId, vocabId, payload).catch(err =>
          console.warn('[vocabStore] Supabase sync failed:', err.message)
        )
      }
    },

    /** Đánh dấu từ là đã thuộc */
    markKnown(dayKey, wordId) {
      // Optimistic update
      const key = `${dayKey}_${wordId}`
      this.progressMap[key] = { ...this.progressMap[key], status: 'known' }
      // Background sync
      this._syncToSupabase(dayKey, wordId, { status: 'known' })
    },

    /** Đánh dấu từ là chưa thuộc */
    markUnknown(dayKey, wordId) {
      const key = `${dayKey}_${wordId}`
      this.progressMap[key] = { ...this.progressMap[key], status: 'unknown' }
      this._syncToSupabase(dayKey, wordId, { status: 'unknown' })
    },

    /**
     * Toggle bookmark cho một từ.
     * Key bookmark: "wordId_dayKey"
     */
    toggleBookmark(wordId, dayKey) {
      const bookmarkKey = `${wordId}_${dayKey}`
      const progressKey = `${dayKey}_${wordId}`
      const isCurrentlyBookmarked = this.bookmarkedIds.includes(bookmarkKey)
      const newValue = !isCurrentlyBookmarked

      // Optimistic update bookmarkedIds
      if (newValue) {
        this.bookmarkedIds.push(bookmarkKey)
      } else {
        const idx = this.bookmarkedIds.indexOf(bookmarkKey)
        if (idx !== -1) this.bookmarkedIds.splice(idx, 1)
      }

      // Optimistic update progressMap
      this.progressMap[progressKey] = {
        ...this.progressMap[progressKey],
        is_bookmarked: newValue,
      }

      // Background sync
      this._syncToSupabase(dayKey, wordId, { is_bookmarked: newValue })
    },

    /** Kiểm tra bookmark theo key composite */
    isBookmarkedWord(wordId, dayKey) {
      return this.bookmarkedIds.includes(`${wordId}_${dayKey}`)
    },

    /** Reset toàn bộ progress của một ngày */
    resetDayProgress(dayKey) {
      const words = database[dayKey] || []
      words.forEach(w => {
        delete this.progressMap[`${dayKey}_${w.id}`]
      })
    },

    /** Xóa tất cả bookmark (gọi Supabase + clear local) */
    async clearAllBookmarks(userId) {
      try {
        await clearAllBookmarksRemote(userId)
        // Clear local state
        this.bookmarkedIds = []
        // Clear is_bookmarked trong progressMap
        for (const key of Object.keys(this.progressMap)) {
          if (this.progressMap[key]?.is_bookmarked) {
            this.progressMap[key] = { ...this.progressMap[key], is_bookmarked: false }
          }
        }
      } catch (err) {
        console.error('[vocabStore] clearAllBookmarks error:', err.message)
        throw err
      }
    },

    /** Reset tất cả dữ liệu (chỉ local, không xóa Supabase) */
    resetAll() {
      this.progressMap = {}
      this.bookmarkedIds = []
      this.quizHistory = {}
      this.quizResults = []
      this.quizResultsLoaded = false
    },

    // ═══════════════════════════════════════════════════════════
    // QUIZ ACTIONS
    // ═══════════════════════════════════════════════════════════

    /** Lưu kết quả quiz (local + Supabase background) */
    saveQuizResult(dayKey, { correct, wrong, total }) {
      if (!this.quizHistory[dayKey]) {
        this.quizHistory[dayKey] = []
      }
      const score = total > 0 ? Math.round((correct / total) * 100) : 0
      const newResult = {
        dayKey,
        score,
        correct,
        wrong,
        total,
        date: new Date().toISOString(),
      }

      // Optimistic update local
      this.quizHistory[dayKey].push(newResult)
      if (this.quizHistory[dayKey].length > 10) {
        this.quizHistory[dayKey] = this.quizHistory[dayKey].slice(-10)
      }
      this.quizResults.unshift(newResult)
      this.quizResultsLoaded = true

      // Background sync lên Supabase
      const authStore = useAuthStore()
      if (authStore.userId) {
        saveQuizResultRemote(authStore.userId, dayKey, newResult).catch(err =>
          console.warn('[vocabStore] Quiz result sync failed:', err.message)
        )
      }
    },
  },
})
