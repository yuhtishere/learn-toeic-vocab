<template>
  <div class="quiz-results-view">
    <div class="container">
      <div class="quiz-results-view__header">
        <router-link :to="{ name: 'home' }" class="quiz-results-view__back" id="quiz-results-back">
          <el-icon><ArrowLeft /></el-icon>
          <span>Trang chủ</span>
        </router-link>

        <div class="quiz-results-view__heading">
          <h1 class="quiz-results-view__title">Kết quả Quiz</h1>
          <p class="quiz-results-view__desc">
            Lịch sử các bài quiz đã hoàn thành và điểm số theo từng ngày học.
          </p>
        </div>

        <el-button
          :loading="store.quizResultsLoading"
          id="quiz-results-refresh"
          @click="refreshResults"
        >
          <el-icon><Refresh /></el-icon>
          Làm mới
        </el-button>
      </div>

      <el-alert
        v-if="store.quizResultsError"
        class="quiz-results-view__alert"
        type="error"
        :title="store.quizResultsError"
        show-icon
        :closable="false"
      />

      <div v-if="store.quizResultsLoading && !store.quizResultsLoaded" class="quiz-results-skeleton">
        <div class="skeleton quiz-results-skeleton__stat"></div>
        <div class="skeleton quiz-results-skeleton__stat"></div>
        <div class="skeleton quiz-results-skeleton__stat"></div>
        <div class="skeleton quiz-results-skeleton__row"></div>
        <div class="skeleton quiz-results-skeleton__row"></div>
      </div>

      <template v-else>
        <section v-if="allResults.length" class="quiz-results-summary">
          <div class="quiz-results-summary__item">
            <el-icon class="quiz-results-summary__icon"><DataAnalysis /></el-icon>
            <span class="quiz-results-summary__value">{{ summary.totalAttempts }}</span>
            <span class="quiz-results-summary__label">Lần làm</span>
          </div>
          <div class="quiz-results-summary__item">
            <el-icon class="quiz-results-summary__icon quiz-results-summary__icon--gold"><Trophy /></el-icon>
            <span class="quiz-results-summary__value">{{ summary.bestResult?.score ?? 0 }}%</span>
            <span class="quiz-results-summary__label">Điểm cao nhất</span>
          </div>
          <div class="quiz-results-summary__item">
            <el-icon class="quiz-results-summary__icon quiz-results-summary__icon--green"><TrendCharts /></el-icon>
            <span class="quiz-results-summary__value">{{ summary.averageScore }}%</span>
            <span class="quiz-results-summary__label">Điểm trung bình</span>
          </div>
          <div class="quiz-results-summary__item">
            <el-icon class="quiz-results-summary__icon quiz-results-summary__icon--blue"><Calendar /></el-icon>
            <span class="quiz-results-summary__value">{{ summary.completedDays }}</span>
            <span class="quiz-results-summary__label">Ngày đã quiz</span>
          </div>
        </section>

        <section v-if="allResults.length" class="quiz-results-toolbar">
          <div class="quiz-results-toolbar__meta">
            <strong>{{ filteredResults.length }}</strong>
            <span>kết quả hiển thị</span>
          </div>

          <el-select
            v-model="selectedDay"
            id="quiz-results-day-filter"
            class="quiz-results-toolbar__select"
            placeholder="Lọc theo ngày"
          >
            <el-option label="Tất cả ngày" value="all" />
            <el-option
              v-for="day in dayOptions"
              :key="day.value"
              :label="day.label"
              :value="day.value"
            />
          </el-select>
        </section>

        <div v-if="filteredResults.length" class="quiz-results-list">
          <article
            v-for="(result, idx) in filteredResults"
            :key="`${result.dayKey}-${result.date}-${idx}`"
            class="quiz-result-card"
          >
            <div class="quiz-result-card__main">
              <div class="quiz-result-card__score" :class="scoreClass(result.score)">
                {{ result.score }}%
              </div>

              <div class="quiz-result-card__content">
                <div class="quiz-result-card__title-row">
                  <h2 class="quiz-result-card__title">{{ formatDayLabel(result.dayKey) }}</h2>
                  <span class="badge" :class="scoreBadgeClass(result.score)">
                    {{ result.correct }}/{{ result.total }} đúng
                  </span>
                </div>

                <div class="quiz-result-card__meta">
                  <span>
                    <el-icon><CircleCheck /></el-icon>
                    Đúng {{ result.correct }}
                  </span>
                  <span>
                    <el-icon><CircleClose /></el-icon>
                    Sai {{ result.wrong }}
                  </span>
                  <span>
                    <el-icon><Clock /></el-icon>
                    {{ formatDateTime(result.date) }}
                  </span>
                </div>
              </div>
            </div>

            <el-button
              type="primary"
              plain
              :id="`quiz-result-retry-${idx}`"
              @click="goToQuiz(result.dayKey)"
            >
              <el-icon><VideoPlay /></el-icon>
              Làm lại
            </el-button>
          </article>
        </div>

        <div v-else-if="allResults.length" class="empty-state">
          <el-icon class="empty-state__icon"><Search /></el-icon>
          <p class="empty-state__title">Không có kết quả cho bộ lọc này</p>
          <p class="empty-state__desc">Chọn ngày khác để xem lịch sử quiz.</p>
        </div>

        <div v-else class="empty-state">
          <el-icon class="empty-state__icon"><DocumentChecked /></el-icon>
          <p class="empty-state__title">Chưa có kết quả quiz</p>
          <p class="empty-state__desc">Hoàn thành một bài quiz để lưu điểm tại đây.</p>
          <el-button type="primary" id="quiz-results-start" @click="goHome">
            <el-icon><House /></el-icon>
            Chọn ngày học
          </el-button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '@/store/vocabulary'

const router = useRouter()
const store = useVocabularyStore()
const selectedDay = ref('all')

const allResults = computed(() => store.allQuizResults)
const summary = computed(() => store.quizResultsSummary)

const filteredResults = computed(() => {
  if (selectedDay.value === 'all') return allResults.value
  return allResults.value.filter(result => result.dayKey === selectedDay.value)
})

const dayOptions = computed(() => {
  const counts = allResults.value.reduce((acc, result) => {
    acc[result.dayKey] = (acc[result.dayKey] || 0) + 1
    return acc
  }, {})

  return store.dayKeys
    .filter(dayKey => counts[dayKey])
    .map(dayKey => ({
      value: dayKey,
      label: `${formatDayLabel(dayKey)} (${counts[dayKey]})`,
    }))
})

onMounted(async () => {
  if (!store.quizResultsLoaded) {
    await store.fetchQuizResults()
  }
})

async function refreshResults() {
  await store.fetchQuizResults()
}

function formatDayLabel(dayKey) {
  return dayKey?.replace('day ', 'Ngày ') || 'Không rõ ngày'
}

function formatDateTime(isoStr) {
  if (!isoStr) return 'Không rõ thời gian'
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return 'Không rõ thời gian'
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function scoreClass(score) {
  if (score >= 80) return 'quiz-result-card__score--high'
  if (score >= 50) return 'quiz-result-card__score--mid'
  return 'quiz-result-card__score--low'
}

function scoreBadgeClass(score) {
  if (score >= 80) return 'badge--green'
  if (score >= 50) return 'badge--gold'
  return 'badge--red'
}

function goToQuiz(dayKey) {
  router.push({ name: 'quiz', params: { dayKey } })
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.quiz-results-view {
  padding: $space-6 0 $space-8;
}

.quiz-results-view__header {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: $space-6;

  @media (min-width: $bp-md) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.quiz-results-view__back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  color: $color-text-secondary;
  font-size: $font-size-sm;
  text-decoration: none;
  white-space: nowrap;

  &:hover {
    color: $color-primary;
    border-color: rgba($color-primary, 0.4);
  }
}

.quiz-results-view__heading {
  flex: 1;
}

.quiz-results-view__title {
  margin: 0 0 $space-2;
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
}

.quiz-results-view__desc {
  margin: 0;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.quiz-results-view__alert {
  margin-bottom: $space-5;
}

.quiz-results-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;
  margin-bottom: $space-5;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.quiz-results-summary__item {
  display: flex;
  flex-direction: column;
  gap: $space-1;
  padding: $space-4;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-card;
}

.quiz-results-summary__icon {
  color: $color-text-secondary;
  font-size: 1.25rem;

  &--gold { color: $color-gold; }
  &--green { color: $color-success; }
  &--blue { color: $color-primary; }
}

.quiz-results-summary__value {
  color: $color-text-primary;
  font-size: $font-size-2xl;
  font-weight: $font-weight-extrabold;
  line-height: 1.1;
}

.quiz-results-summary__label {
  color: $color-text-muted;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  text-transform: uppercase;
}

.quiz-results-toolbar {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-4;

  @media (min-width: $bp-sm) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.quiz-results-toolbar__meta {
  display: flex;
  align-items: center;
  gap: $space-2;
  color: $color-text-secondary;
  font-size: $font-size-sm;
}

.quiz-results-toolbar__select {
  width: 100%;

  @media (min-width: $bp-sm) {
    width: 240px;
  }
}

.quiz-results-list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}

.quiz-result-card {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  padding: $space-4;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  background: $color-card;
  animation: fadeIn 0.25s ease both;

  @media (min-width: $bp-md) {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.quiz-result-card__main {
  display: flex;
  gap: $space-4;
  min-width: 0;
}

.quiz-result-card__score {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  flex: 0 0 72px;
  border: 1px solid currentColor;
  border-radius: $radius-md;
  font-size: $font-size-xl;
  font-weight: $font-weight-extrabold;

  &--high {
    color: $color-success;
    background: rgba($color-success, 0.1);
  }

  &--mid {
    color: $color-gold;
    background: rgba($color-gold, 0.1);
  }

  &--low {
    color: $color-danger;
    background: rgba($color-danger, 0.1);
  }
}

.quiz-result-card__content {
  min-width: 0;
}

.quiz-result-card__title-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
  flex-wrap: wrap;
}

.quiz-result-card__title {
  margin: 0;
  color: $color-text-primary;
  font-size: $font-size-lg;
  font-weight: $font-weight-bold;
}

.quiz-result-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  color: $color-text-secondary;
  font-size: $font-size-sm;

  span {
    display: inline-flex;
    align-items: center;
    gap: $space-1;
  }
}

.quiz-results-skeleton {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $space-3;

  @media (min-width: $bp-md) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.quiz-results-skeleton__stat {
  height: 112px;
}

.quiz-results-skeleton__row {
  grid-column: 1 / -1;
  height: 104px;
}
</style>
