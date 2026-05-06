// ============================================================
// Pinia Store — vocabulary.js
// Quản lý: bookmarks, progress flashcard (lưu localStorage)
// ============================================================
import { defineStore } from 'pinia'
import database from '../../database.json'

export const useVocabularyStore = defineStore('vocabulary', {
  // --- State ---
  state: () => ({
    /**
     * Tập hợp các ID từ đã bookmark.
     * Dùng Set để O(1) lookup, nhưng vì Pinia persist cần plain object,
     * ta lưu dưới dạng Array rồi convert khi đọc.
     */
    bookmarkedIds: [],  // Array<number> — persisted

    /**
     * Tiến độ flashcard theo từng từ.
     * Key: `${dayKey}_${wordId}` (ví dụ: "day 1_5")
     * Value: 'known' | 'unknown' | null
     */
    progress: {},       // Record<string, string> — persisted

    /**
     * Lịch sử điểm quiz.
     * Key: dayKey (ví dụ: "day 1")
     * Value: Array<{ score: number, correct: number, wrong: number, total: number, date: string }>
     */
    quizHistory: {},     // Record<string, Array> — persisted
  }),

  // --- Getters ---
  getters: {
    /**
     * Lấy toàn bộ dữ liệu từ điển, trả về object với key là dayKey
     * và value là array các từ đã được bổ sung dayKey
     */
    allDays: () => {
      const days = {}
      for (const [dayKey, words] of Object.entries(database)) {
        days[dayKey] = words.map(word => ({ ...word, dayKey }))
      }
      return days
    },

    /** Danh sách tất cả các day keys (["day 1", "day 2", ...]) */
    dayKeys: () => Object.keys(database),

    /** Lấy từ của một ngày cụ thể */
    getWordsByDay: (state) => (dayKey) => {
      return (database[dayKey] || []).map(word => ({ ...word, dayKey }))
    },

    /** Kiểm tra một từ có được bookmark không */
    isBookmarked: (state) => (wordId) => {
      return state.bookmarkedIds.includes(wordId)
    },

    /** Lấy tất cả từ đã bookmark với đầy đủ thông tin */
    bookmarkedWords: (state) => {
      const allWords = []
      for (const [dayKey, words] of Object.entries(database)) {
        words.forEach(word => {
          if (state.bookmarkedIds.includes(word.id + '_' + dayKey)) {
            allWords.push({ ...word, dayKey })
          }
        })
      }
      return allWords
    },

    /** Lấy trạng thái một từ trong flashcard */
    getWordStatus: (state) => (dayKey, wordId) => {
      return state.progress[`${dayKey}_${wordId}`] || null
    },

    /** Số từ đã thuộc trong một ngày */
    knownCountByDay: (state) => (dayKey) => {
      const words = database[dayKey] || []
      return words.filter(w => state.progress[`${dayKey}_${w.id}`] === 'known').length
    },

    /** Phần trăm hoàn thành một ngày (0-100)
     * Pinia getter chỉ nhận (state), KHÔNG có tham số getters thứ hai như Vuex.
     * Để dùng getter khác, tính inline hoặc dùng `this` trong function thường.
     */
    progressPercentByDay: (state) => (dayKey) => {
      const words = database[dayKey] || []
      if (!words.length) return 0
      // Tính lại inline (giống knownCountByDay) thay vì gọi getter khác
      const known = words.filter(w => state.progress[`${dayKey}_${w.id}`] === 'known').length
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
  },

  // --- Actions ---
  actions: {
    /**
     * Toggle bookmark cho một từ.
     * Key bookmark: `wordId_dayKey` (để tránh trùng ID giữa các ngày)
     */
    toggleBookmark(wordId, dayKey) {
      const key = `${wordId}_${dayKey}`
      const idx = this.bookmarkedIds.indexOf(key)
      if (idx === -1) {
        this.bookmarkedIds.push(key)
      } else {
        this.bookmarkedIds.splice(idx, 1)
      }
    },

    /** Kiểm tra bookmark theo key composite */
    isBookmarkedWord(wordId, dayKey) {
      return this.bookmarkedIds.includes(`${wordId}_${dayKey}`)
    },

    /** Đánh dấu từ là đã thuộc */
    markKnown(dayKey, wordId) {
      this.progress[`${dayKey}_${wordId}`] = 'known'
    },

    /** Đánh dấu từ là chưa thuộc */
    markUnknown(dayKey, wordId) {
      this.progress[`${dayKey}_${wordId}`] = 'unknown'
    },

    /** Reset toàn bộ progress của một ngày */
    resetDayProgress(dayKey) {
      const words = database[dayKey] || []
      words.forEach(w => {
        delete this.progress[`${dayKey}_${w.id}`]
      })
    },

    /** Reset tất cả dữ liệu (bookmark + progress + quiz history) */
    resetAll() {
      this.bookmarkedIds = []
      this.progress = {}
      this.quizHistory = {}
    },

    /** Lưu kết quả quiz */
    saveQuizResult(dayKey, { correct, wrong, total }) {
      if (!this.quizHistory[dayKey]) {
        this.quizHistory[dayKey] = []
      }
      const score = total > 0 ? Math.round((correct / total) * 100) : 0
      this.quizHistory[dayKey].push({
        score,
        correct,
        wrong,
        total,
        date: new Date().toISOString(),
      })
      // Giữ tối đa 10 lần gần nhất
      if (this.quizHistory[dayKey].length > 10) {
        this.quizHistory[dayKey] = this.quizHistory[dayKey].slice(-10)
      }
    },
  },

  // --- Persist to localStorage ---
  persist: {
    key: 'toeic-vocab-store',
    storage: localStorage,
    paths: ['bookmarkedIds', 'progress', 'quizHistory'],
  },
})
