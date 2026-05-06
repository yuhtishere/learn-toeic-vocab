<template>
  <div class="quiz-view">
    <!-- Fireworks -->
    <div v-if="showFireworks" :key="fireworksKey" class="quiz-fireworks" aria-hidden="true">
      <div
        v-for="burst in fireworkBursts"
        :key="burst.id"
        class="quiz-firework"
        :style="{ left: burst.left, top: burst.top, '--fw-color': burst.color, '--fw-delay': burst.delay }"
      >
        <span v-for="s in 8" :key="s" class="quiz-firework__spark" :style="{ '--spark-angle': `${s * 45}deg` }"></span>
      </div>
    </div>

    <!-- Completion screen -->
    <transition name="fade">
      <div v-if="isCompleted" class="quiz-complete">
        <div class="quiz-complete__card container">
          <div class="quiz-complete__icon">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <h2 class="quiz-complete__title">Hoàn thành Quiz!</h2>
          <p class="quiz-complete__sub">{{ formattedDayLabel }}</p>

          <div class="quiz-complete__stats">
            <div class="quiz-complete__stat quiz-complete__stat--green">
              <span class="quiz-complete__stat-value">{{ correctCount }}</span>
              <span class="quiz-complete__stat-label">Đúng</span>
            </div>
            <div class="quiz-complete__stat quiz-complete__stat--red">
              <span class="quiz-complete__stat-value">{{ wrongCount }}</span>
              <span class="quiz-complete__stat-label">Sai</span>
            </div>
            <div class="quiz-complete__stat quiz-complete__stat--blue">
              <span class="quiz-complete__stat-value">{{ scorePercent }}%</span>
              <span class="quiz-complete__stat-label">Điểm</span>
            </div>
          </div>

          <!-- Best score & history -->
          <div v-if="bestScore" class="quiz-complete__best">
            <div class="quiz-complete__best-row">
              <span class="quiz-complete__best-icon">🏆</span>
              <span>Kỷ lục: <strong>{{ bestScore.score }}%</strong></span>
              <span class="quiz-complete__best-date">{{ formatDate(bestScore.date) }}</span>
            </div>
            <div class="quiz-complete__history-count">
              Đã làm {{ quizHistoryCount }} lần
            </div>
          </div>

          <div class="quiz-complete__actions">
            <el-button @click="restartAll" id="btn-quiz-restart">
              <el-icon><Refresh /></el-icon>
              Làm lại
            </el-button>
            <el-button type="primary" id="btn-quiz-back" @click="goBack">
              <el-icon><ArrowLeft /></el-icon>
              Về danh sách
            </el-button>
          </div>
        </div>
      </div>
    </transition>

    <!-- Quiz area -->
    <div v-if="!isCompleted && currentWord" class="quiz-view__inner container">
      <!-- Topbar -->
      <div class="quiz-view__topbar">
        <router-link :to="backRoute" class="quiz-view__back" id="quiz-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>{{ formattedDayLabel }}</span>
        </router-link>

        <div class="quiz-view__progress">
          <el-progress
            :percentage="progressPercent"
            :stroke-width="6"
            :show-text="false"
            :color="progressPercent === 100 ? '#3fb950' : '#4f8ef7'"
          />
        </div>

        <div class="quiz-view__counter">
          {{ currentIndex + 1 }} / {{ deck.length }}
        </div>
      </div>

      <!-- Question card -->
      <section class="quiz-card" :key="currentWord.id + '-' + currentWord.dayKey">
        <div class="quiz-card__header">
          <span class="badge badge--muted">Câu {{ currentIndex + 1 }}</span>
          <span class="badge badge--muted">{{ currentWord.type || 'Từ vựng' }}</span>
        </div>

        <div class="quiz-card__prompt">
          <span class="quiz-card__label">Nghĩa tiếng Việt</span>
          <p class="quiz-card__meaning">{{ currentWord.meaning }}</p>
        </div>

        <!-- 4 options -->
        <div class="quiz-card__options">
          <button
            v-for="(opt, idx) in options"
            :key="idx"
            class="quiz-card__option"
            :class="getOptionClass(opt)"
            :disabled="answered"
            @click="selectAnswer(opt)"
            :id="`quiz-option-${idx}`"
          >
            <span class="quiz-card__option-key">{{ ['A', 'B', 'C', 'D'][idx] }}</span>
            <span class="quiz-card__option-text">{{ opt.word }}</span>
            <el-icon v-if="answered && opt.id === currentWord.id && opt.dayKey === currentWord.dayKey" class="quiz-card__option-icon quiz-card__option-icon--correct">
              <CircleCheck />
            </el-icon>
            <el-icon v-else-if="answered && selected === opt && opt.id !== currentWord.id" class="quiz-card__option-icon quiz-card__option-icon--wrong">
              <CircleClose />
            </el-icon>
          </button>
        </div>

        <!-- Next button (shown after answering) -->
        <div v-if="answered" class="quiz-card__next">
          <el-button type="primary" size="large" @click="nextWord" id="btn-quiz-next">
            {{ currentIndex < deck.length - 1 ? 'Câu tiếp theo →' : 'Xem kết quả →' }}
          </el-button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useVocabularyStore } from '@/store/vocabulary'
import database from '../../database.json'

const route = useRoute()
const router = useRouter()
const store = useVocabularyStore()

const dayKey = computed(() => decodeURIComponent(route.params.dayKey))
const formattedDayLabel = computed(() => dayKey.value.replace('day ', 'Ngày '))
const backRoute = computed(() => ({ name: 'day', params: { dayKey: dayKey.value } }))

function goBack() { router.push(backRoute.value) }

// State
const deck = ref([])
const deckReady = ref(false)
const currentIndex = ref(0)
const options = ref([])
const selected = ref(null)
const answered = ref(false)
const correctCount = ref(0)
const wrongCount = ref(0)
const showFireworks = ref(false)
const fireworksKey = ref(0)
let fireworksTimer = null

const fireworkBursts = [
  { id: 1, left: '20%', top: '25%', color: '#ffd166', delay: '0s' },
  { id: 2, left: '80%', top: '30%', color: '#4f8ef7', delay: '0.08s' },
  { id: 3, left: '50%', top: '18%', color: '#3fb950', delay: '0.16s' },
]

const currentWord = computed(() => deck.value[currentIndex.value] || null)
const isCompleted = computed(() => deckReady.value && currentIndex.value >= deck.value.length)
const progressPercent = computed(() =>
  deck.value.length ? Math.round((currentIndex.value / deck.value.length) * 100) : 0
)
const scorePercent = computed(() =>
  (correctCount.value + wrongCount.value) > 0
    ? Math.round((correctCount.value / (correctCount.value + wrongCount.value)) * 100)
    : 0
)

// Quiz history
const bestScore = computed(() => store.bestQuizScore(dayKey.value))
const quizHistoryCount = computed(() => store.getQuizHistory(dayKey.value).length)

function formatDate(isoStr) {
  const d = new Date(isoStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Auto-save when quiz completes
const savedThisRound = ref(false)
watch(isCompleted, (val) => {
  if (val && !savedThisRound.value) {
    savedThisRound.value = true
    store.saveQuizResult(dayKey.value, {
      correct: correctCount.value,
      wrong: wrongCount.value,
      total: correctCount.value + wrongCount.value,
    })
  }
})

// Build word pool from ALL days for wrong answers diversity
const allWords = computed(() => {
  const words = []
  for (const [dk, list] of Object.entries(database)) {
    list.forEach(w => words.push({ ...w, dayKey: dk }))
  }
  return words
})

function loadDeck() {
  if (route.name !== 'quiz') return
  deckReady.value = false
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  selected.value = null
  answered.value = false

  const words = store.getWordsByDay(dayKey.value)
  if (!words.length) return

  // Shuffle deck, only pick words that have actual word text
  deck.value = [...words]
    .filter(w => w.word && w.word.trim())
    .sort(() => Math.random() - 0.5)

  deckReady.value = true
  generateOptions()
}

function generateOptions() {
  const correct = currentWord.value
  if (!correct) return

  // Get wrong options from all words (different word text)
  const correctText = correct.word.toLowerCase().trim()
  const pool = allWords.value.filter(w =>
    w.word && w.word.trim() &&
    w.word.toLowerCase().trim() !== correctText &&
    w.word.length > 1
  )

  // Shuffle pool and pick 3
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const wrongs = shuffled.slice(0, 3)

  // Combine and shuffle
  const opts = [correct, ...wrongs].sort(() => Math.random() - 0.5)
  options.value = opts
}
// Sound effects using Web Audio API
let audioCtx = null
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playCorrectSound() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    // Ascending chime: C5 → E5 → G5
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(523, now)
    osc.frequency.setValueAtTime(659, now + 0.08)
    osc.frequency.setValueAtTime(784, now + 0.16)
    gain.gain.setValueAtTime(0.18, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35)
    osc.start(now)
    osc.stop(now + 0.35)
  } catch { /* silent fallback */ }
}

function playWrongSound() {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    // Low buzz: descending
    const now = ctx.currentTime
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.setValueAtTime(160, now + 0.12)
    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
    osc.start(now)
    osc.stop(now + 0.25)
  } catch { /* silent fallback */ }
}

function selectAnswer(opt) {
  if (answered.value) return
  selected.value = opt
  answered.value = true

  const isCorrect = opt.id === currentWord.value.id && opt.dayKey === currentWord.value.dayKey
  if (isCorrect) {
    correctCount.value++
    store.markKnown(currentWord.value.dayKey, currentWord.value.id)
    triggerFireworks()
    playCorrectSound()
  } else {
    wrongCount.value++
    store.markUnknown(currentWord.value.dayKey, currentWord.value.id)
    playWrongSound()
  }
}

function getOptionClass(opt) {
  if (!answered.value) return ''
  const isCorrect = opt.id === currentWord.value.id && opt.dayKey === currentWord.value.dayKey
  if (isCorrect) return 'quiz-card__option--correct'
  if (selected.value === opt && !isCorrect) return 'quiz-card__option--wrong'
  return 'quiz-card__option--dimmed'
}

function nextWord() {
  currentIndex.value++
  selected.value = null
  answered.value = false
  if (!isCompleted.value) generateOptions()
}

function restartAll() {
  const words = store.getWordsByDay(dayKey.value)
  deck.value = [...words]
    .filter(w => w.word && w.word.trim())
    .sort(() => Math.random() - 0.5)
  currentIndex.value = 0
  correctCount.value = 0
  wrongCount.value = 0
  selected.value = null
  answered.value = false
  savedThisRound.value = false
  generateOptions()
}

function triggerFireworks() {
  clearFwTimer()
  fireworksKey.value++
  showFireworks.value = true
  fireworksTimer = window.setTimeout(() => {
    showFireworks.value = false
    fireworksTimer = null
  }, 900)
}

function clearFwTimer() {
  if (fireworksTimer) { window.clearTimeout(fireworksTimer); fireworksTimer = null }
}

// Keyboard shortcuts: Enter/Space = next, 1-4 = select option
function handleKeydown(e) {
  if (isCompleted.value) return

  // After answering → Enter or Space to go next
  if (answered.value && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault()
    nextWord()
    return
  }

  // Before answering → 1/2/3/4 to pick option
  if (!answered.value && options.value.length) {
    const idx = ['1', '2', '3', '4'].indexOf(e.key)
    if (idx !== -1 && options.value[idx]) {
      e.preventDefault()
      selectAnswer(options.value[idx])
    }
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
watch(dayKey, loadDeck, { immediate: true })
onUnmounted(() => {
  clearFwTimer()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.quiz-view {
  position: relative;
  min-height: calc(100vh - #{$header-height});
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// Fireworks (reuse pattern from StudyView)
.quiz-fireworks { position: fixed; inset: $header-height 0 0; z-index: 0; pointer-events: none; }
.quiz-firework {
  position: absolute; width: 8px; height: 8px; transform: translate(-50%, -50%);
  animation: qfwCore 0.75s ease-out var(--fw-delay) both;
}
.quiz-firework__spark {
  position: absolute; left: 50%; top: 50%; width: 6px; height: 18px;
  border-radius: $radius-full; background: var(--fw-color);
  box-shadow: 0 0 14px var(--fw-color);
  transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(0.25);
  opacity: 0; animation: qfwSpark 0.75s ease-out var(--fw-delay) both;
}
@keyframes qfwCore { 0% { opacity: 1; } 100% { opacity: 0; } }
@keyframes qfwSpark {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0) scale(0.25); }
  15% { opacity: 1; }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(-80px) scale(1); }
}

// Inner layout
.quiz-view__inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  gap: $space-6; padding-top: $space-6; padding-bottom: $space-8;
}

.quiz-view__topbar { width: 100%; display: flex; align-items: center; gap: $space-4; }

.quiz-view__back {
  display: flex; align-items: center; gap: $space-2;
  color: $color-text-secondary; font-size: $font-size-sm;
  text-decoration: none; white-space: nowrap; transition: $transition-fast;
  &:hover { color: $color-primary; }
}

.quiz-view__progress { flex: 1; }

.quiz-view__counter {
  min-width: 64px; color: $color-text-secondary;
  font-size: $font-size-sm; font-weight: $font-weight-semibold; text-align: right;
}

// Quiz card
.quiz-card {
  width: 100%; max-width: 620px;
  display: flex; flex-direction: column; gap: $space-5;
  padding: $space-6; background: $color-card;
  border: 1px solid $color-border; border-radius: $radius-md;
  box-shadow: $shadow-lg; animation: fadeIn 0.25s ease both;
}

.quiz-card__header {
  display: flex; justify-content: space-between; align-items: center;
}

.quiz-card__prompt {
  display: flex; flex-direction: column; align-items: center;
  gap: $space-3; padding: $space-6 $space-4; text-align: center;
  border-radius: $radius-md; background: rgba($color-primary, 0.08);
  border: 1px solid rgba($color-primary, 0.22);
}

.quiz-card__label {
  color: $color-text-muted; font-size: $font-size-xs;
  font-weight: $font-weight-semibold; text-transform: uppercase;
}

.quiz-card__meaning {
  margin: 0; color: $color-text-primary;
  font-size: $font-size-xl; font-weight: $font-weight-bold;
  line-height: 1.4; word-break: break-word;
}

// Options grid
.quiz-card__options {
  display: grid; grid-template-columns: 1fr 1fr; gap: $space-3;

  @media (max-width: $bp-sm) {
    grid-template-columns: 1fr;
  }
}

.quiz-card__option {
  display: flex; align-items: center; gap: $space-3;
  padding: $space-4 $space-5;
  background: $color-surface; border: 2px solid $color-border;
  border-radius: $radius-lg; cursor: pointer;
  transition: $transition-base; text-align: left;
  color: $color-text-primary; font-size: $font-size-base;
  position: relative;

  &:not(:disabled):hover {
    border-color: rgba($color-primary, 0.6);
    background: rgba($color-primary, 0.08);
    transform: translateY(-2px);
    box-shadow: $shadow-md;
  }

  &:not(:disabled):active {
    transform: scale(0.98);
  }

  &:disabled {
    cursor: default;
  }

  &--correct {
    border-color: $color-success !important;
    background: rgba($color-success, 0.12) !important;
    box-shadow: 0 0 20px rgba($color-success, 0.2);
  }

  &--wrong {
    border-color: $color-danger !important;
    background: rgba($color-danger, 0.12) !important;
    box-shadow: 0 0 20px rgba($color-danger, 0.15);
    animation: shake 0.4s ease;
  }

  &--dimmed {
    opacity: 0.4;
  }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}

.quiz-card__option-key {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; min-width: 32px;
  border-radius: $radius-md; font-weight: $font-weight-bold;
  font-size: $font-size-sm; color: $color-primary;
  background: rgba($color-primary, 0.1);
  border: 1px solid rgba($color-primary, 0.25);

  .quiz-card__option--correct & {
    color: $color-success; background: rgba($color-success, 0.15);
    border-color: rgba($color-success, 0.4);
  }

  .quiz-card__option--wrong & {
    color: $color-danger; background: rgba($color-danger, 0.15);
    border-color: rgba($color-danger, 0.4);
  }
}

.quiz-card__option-text {
  flex: 1; font-weight: $font-weight-medium;
}

.quiz-card__option-icon {
  font-size: 1.25rem;
  &--correct { color: $color-success; }
  &--wrong { color: $color-danger; }
}

.quiz-card__next {
  display: flex; justify-content: center; padding-top: $space-2;
  .el-button { min-width: 200px; }
}

// Completion screen
.quiz-complete {
  position: relative; z-index: 1;
  min-height: calc(100vh - #{$header-height});
  display: flex; align-items: center; justify-content: center;
  padding: $space-6 0;
}

.quiz-complete__card {
  max-width: 420px;
  display: flex; flex-direction: column; align-items: center;
  gap: $space-5; padding: $space-10 $space-6; text-align: center;
  background: $color-card; border: 1px solid $color-border;
  border-radius: $radius-md; box-shadow: $shadow-lg;
}

.quiz-complete__icon {
  display: flex; align-items: center; justify-content: center;
  width: 64px; height: 64px; color: $color-success; font-size: 2.25rem;
  border: 1px solid rgba($color-success, 0.35); border-radius: $radius-full;
  background: rgba($color-success, 0.12);
}

.quiz-complete__title {
  margin: 0; color: $color-text-primary;
  font-size: $font-size-3xl; font-weight: $font-weight-extrabold;
}

.quiz-complete__sub { margin: 0; color: $color-text-secondary; }

.quiz-complete__stats { display: flex; gap: $space-6; }

.quiz-complete__stat {
  display: flex; flex-direction: column; align-items: center; gap: $space-1;
  &--green { color: $color-success; }
  &--red { color: $color-danger; }
  &--blue { color: $color-primary; }
}

.quiz-complete__stat-value {
  font-size: $font-size-3xl; font-weight: $font-weight-extrabold; line-height: 1;
}

.quiz-complete__stat-label {
  color: $color-text-muted; font-size: $font-size-xs;
  font-weight: $font-weight-semibold; text-transform: uppercase;
}

.quiz-complete__best {
  width: 100%;
  padding: $space-4;
  background: rgba($color-gold, 0.08);
  border: 1px solid rgba($color-gold, 0.25);
  border-radius: $radius-md;
  text-align: center;
}

.quiz-complete__best-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: $space-2;
  color: $color-text-primary;
  font-size: $font-size-sm;

  strong { color: $color-gold; font-size: $font-size-base; }
}

.quiz-complete__best-icon {
  font-size: 1.1rem;
}

.quiz-complete__best-date {
  color: $color-text-muted;
  font-size: $font-size-xs;
}

.quiz-complete__history-count {
  margin-top: $space-1;
  color: $color-text-muted;
  font-size: $font-size-xs;
}

.quiz-complete__actions {
  width: 100%; display: flex; flex-direction: column; gap: $space-3;
  .el-button { width: 100%; }
}

@media (max-width: $bp-sm) {
  .quiz-view__topbar { gap: $space-3; }
  .quiz-view__back span { display: none; }
  .quiz-card { padding: $space-4; }
  .quiz-card__meaning { font-size: $font-size-lg; }
}
</style>
