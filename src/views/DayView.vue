<template>
  <!-- ============================================================
    DayView — Danh sách từ của một ngày cụ thể
  ============================================================ -->
  <div class="day-view">
    <div class="container">

      <!-- Page Header -->
      <div class="day-view__header">
        <!-- Back button -->
        <router-link :to="{ name: 'home' }" class="day-view__back" id="day-back-btn">
          <el-icon><ArrowLeft /></el-icon>
          <span>Trang chủ</span>
        </router-link>

        <div class="day-view__header-content">
          <div class="day-view__title-row">
            <h1 class="day-view__title">{{ formattedDayLabel }}</h1>
            <span class="badge badge--muted">{{ words.length }} từ</span>
          </div>

          <!-- Day progress -->
          <div class="day-view__progress">
            <div class="day-view__progress-text">
              <span class="text-success">{{ knownCount }} đã thuộc</span>
              <span class="text-muted"> · {{ words.length - knownCount }} chưa thuộc</span>
            </div>
            <el-progress
              :percentage="progressPercent"
              :stroke-width="6"
              :show-text="false"
              :status="progressPercent === 100 ? 'success' : ''"
            />
          </div>
        </div>

        <!-- Actions -->
        <div class="day-view__actions">
          <!-- Reset progress -->
          <el-tooltip content="Reset tiến độ ngày này" placement="bottom">
            <el-button
              circle
              size="small"
              :icon="RefreshLeft"
              id="btn-reset-progress"
              @click="handleReset"
              style="color: var(--el-text-color-secondary)"
            />
          </el-tooltip>

          <!-- Học Flashcard -->
          <el-button type="success" id="day-study-btn" @click="goToStudy">
            Học từ vựng
          </el-button>

          <el-button type="primary" id="day-flashcard-btn" @click="goToFlashcard">
            Học Flashcard
          </el-button>

          <el-button type="warning" id="day-quiz-btn" @click="goToQuiz">
            Làm Quiz
          </el-button>

          <el-button id="day-quiz-results-btn" @click="goToQuizResults">
            Kết quả
          </el-button>
        </div>
      </div>

      <!-- Search / Filter bar -->
      <div class="day-view__toolbar">
        <el-input
          v-model="searchQuery"
          placeholder="Tìm kiếm từ vựng..."
          clearable
          id="day-search-input"
          class="day-view__search"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <!-- Filter tabs -->
        <div class="day-view__filters">
          <button
            v-for="f in filters"
            :key="f.value"
            class="day-view__filter-btn"
            :class="{ 'day-view__filter-btn--active': activeFilter === f.value }"
            :id="`filter-${f.value}`"
            @click="activeFilter = f.value"
          >
            {{ f.label }}
            <span class="day-view__filter-count">{{ getFilterCount(f.value) }}</span>
          </button>
        </div>
      </div>

      <!-- Word list -->
      <div class="day-view__list" v-if="filteredWords.length">
        <WordCard
          v-for="(word, idx) in filteredWords"
          :key="`${word.id}-${word.dayKey}`"
          :word="word"
          :index="idx + 1"
        />
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">Không tìm thấy từ nào</p>
        <p class="empty-state__desc">Thử tìm kiếm với từ khóa khác</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { RefreshLeft } from '@element-plus/icons-vue'
import { useVocabularyStore } from '@/store/vocabulary'
import WordCard from '@/components/common/WordCard.vue'

const route  = useRoute()
const router = useRouter()
const store  = useVocabularyStore()

// Lấy dayKey từ URL params, decode vì có space
const dayKey = computed(() => decodeURIComponent(route.params.dayKey))

// Dữ liệu từ vựng của ngày
const words = computed(() => store.getWordsByDay(dayKey.value))

// Nếu ngày không tồn tại → về trang chủ
onMounted(() => {
  if (!words.value.length) router.replace({ name: 'home' })
})

// Format label
const formattedDayLabel = computed(() =>
  dayKey.value.replace('day ', 'Ngày ')
)

// Stats
const knownCount = computed(() => store.knownCountByDay(dayKey.value))
const progressPercent = computed(() => store.progressPercentByDay(dayKey.value))

// Search
const searchQuery = ref('')

// Filter: all / unknown / known / bookmarked
const activeFilter = ref('all')
const filters = [
  { value: 'all',        label: 'Tất cả' },
  { value: 'unknown',    label: 'Chưa thuộc' },
  { value: 'known',      label: 'Đã thuộc' },
  { value: 'bookmarked', label: '★ Đã lưu' },
]

function getFilterCount(filterVal) {
  return applyFilter(words.value, filterVal).length
}

function applyFilter(list, filterVal) {
  return list.filter(w => {
    if (filterVal === 'known')      return store.getWordStatus(w.dayKey, w.id) === 'known'
    if (filterVal === 'unknown')    return store.getWordStatus(w.dayKey, w.id) !== 'known'
    if (filterVal === 'bookmarked') return store.isBookmarkedWord(w.id, w.dayKey)
    return true
  })
}

// Kết hợp search + filter
const filteredWords = computed(() => {
  let result = applyFilter(words.value, activeFilter.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(w =>
      w.word.toLowerCase().includes(q) ||
      w.meaning.toLowerCase().includes(q)
    )
  }
  return result
})

function goToStudy() {
  router.push({ name: 'study', params: { dayKey: dayKey.value } })
}

function goToFlashcard() {
  router.push({ name: 'flashcard', params: { dayKey: dayKey.value } })
}

function goToQuiz() {
  router.push({ name: 'quiz', params: { dayKey: dayKey.value } })
}

function goToQuizResults() {
  router.push({ name: 'quiz-results' })
}

// Reset progress với xác nhận
async function handleReset() {
  try {
    await ElMessageBox.confirm(
      `Bạn có chắc muốn xóa toàn bộ tiến độ của ${formattedDayLabel.value}?`,
      'Xác nhận reset',
      { confirmButtonText: 'Xóa', cancelButtonText: 'Hủy', type: 'warning' }
    )
    store.resetDayProgress(dayKey.value)
    ElMessage.success('Đã reset tiến độ!')
  } catch {
    // Người dùng bấm Hủy
  }
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.day-view {
  padding: $space-6 0 $space-8;
}

// --- Header ---
.day-view__header {
  display: flex;
  flex-direction: column;
  gap: $space-4;
  margin-bottom: $space-6;

  @media (min-width: $bp-md) {
    flex-direction: row;
    align-items: flex-start;
  }
}

.day-view__back {
  display: inline-flex;
  align-items: center;
  gap: $space-2;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  text-decoration: none;
  transition: $transition-fast;
  padding: $space-2 $space-3;
  border-radius: $radius-md;
  border: 1px solid $color-border;
  align-self: flex-start;
  white-space: nowrap;

  &:hover {
    color: $color-primary;
    border-color: rgba($color-primary, 0.4);
  }
}

.day-view__header-content {
  flex: 1;
}

.day-view__title-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-3;
  flex-wrap: wrap;
}

.day-view__title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
  letter-spacing: -0.02em;
  margin: 0;
}

.day-view__progress {
  display: flex;
  flex-direction: column;
  gap: $space-2;
}

.day-view__progress-text {
  font-size: $font-size-sm;
}

.day-view__actions {
  display: flex;
  align-items: center;
  gap: $space-3;
  flex-wrap: wrap;
  align-self: flex-start;
  margin-top: $space-2;

  @media (min-width: $bp-md) {
    margin-top: 0;
  }

  a { text-decoration: none; }
}

// --- Toolbar ---
.day-view__toolbar {
  display: flex;
  flex-direction: column;
  gap: $space-3;
  margin-bottom: $space-5;

  @media (min-width: $bp-md) {
    flex-direction: row;
    align-items: center;
  }
}

.day-view__search {
  @media (min-width: $bp-md) {
    max-width: 300px;
  }
}

.day-view__filters {
  display: flex;
  gap: $space-2;
  flex-wrap: wrap;
}

.day-view__filter-btn {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-md;
  font-size: $font-size-sm;
  color: $color-text-secondary;
  cursor: pointer;
  transition: $transition-fast;
  white-space: nowrap;

  &:hover {
    border-color: rgba($color-primary, 0.4);
    color: $color-primary;
  }

  &--active {
    background: rgba($color-primary, 0.1);
    border-color: rgba($color-primary, 0.5);
    color: $color-primary;
    font-weight: $font-weight-medium;
  }
}

.day-view__filter-count {
  background: $color-card-hover;
  color: $color-text-muted;
  font-size: $font-size-xs;
  padding: 0 6px;
  border-radius: $radius-full;
  min-width: 20px;
  text-align: center;
}

// --- Word list ---
.day-view__list {
  display: flex;
  flex-direction: column;
  gap: $space-3;
}
</style>
