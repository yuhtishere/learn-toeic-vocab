<template>
  <!-- ============================================================
    MyListView — Trang "Từ vựng của tôi" (Bookmarks)
  ============================================================ -->
  <div class="mylist-view">
    <div class="container">

      <!-- Header -->
      <div class="mylist-view__header">
        <div class="mylist-view__title-row">
          <el-icon class="mylist-view__icon"><Star /></el-icon>
          <h1 class="mylist-view__title">Từ vựng của tôi</h1>
          <span v-if="bookmarkedWords.length" class="badge badge--gold">
            {{ bookmarkedWords.length }} từ
          </span>
        </div>
        <p class="mylist-view__desc">
          Những từ bạn đã đánh dấu để ôn luyện thêm
        </p>
      </div>

      <!-- Actions row -->
      <div v-if="bookmarkedWords.length" class="mylist-view__actions">
        <!-- Học Flashcard với bookmark list -->
        <el-button type="primary" id="mylist-flashcard-btn" @click="goToFlashcardMyList">
          Học Flashcard ({{ bookmarkedWords.length }} từ)
        </el-button>

        <!-- Xóa tất cả bookmark -->
        <el-popconfirm
          title="Xóa tất cả từ đã lưu?"
          confirm-button-text="Xóa tất cả"
          cancel-button-text="Hủy"
          @confirm="clearAll"
        >
          <template #reference>
            <el-button id="mylist-clear-btn">
              <el-icon><Delete /></el-icon>
              Xóa tất cả
            </el-button>
          </template>
        </el-popconfirm>
      </div>

      <!-- Search -->
      <div v-if="bookmarkedWords.length" class="mylist-view__search">
        <el-input
          v-model="searchQuery"
          placeholder="Tìm trong danh sách của tôi..."
          clearable
          id="mylist-search-input"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <!-- Grouped by day -->
      <div v-if="filteredGrouped.length" class="mylist-view__groups">
        <div
          v-for="group in filteredGrouped"
          :key="group.dayKey"
          class="mylist-group"
        >
          <!-- Group header -->
          <div class="mylist-group__header">
            <span class="mylist-group__label">
              {{ group.dayKey.replace('day ', 'Ngày ') }}
            </span>
            <span class="badge badge--muted">{{ group.words.length }} từ</span>
            <router-link
              :to="{ name: 'day', params: { dayKey: group.dayKey } }"
              class="mylist-group__link"
            >
              Xem ngày này →
            </router-link>
          </div>

          <!-- Word cards -->
          <div class="mylist-group__words">
            <WordCard
              v-for="(word, idx) in group.words"
              :key="`${word.id}-${word.dayKey}`"
              :word="word"
              :index="idx + 1"
            />
          </div>
        </div>
      </div>

      <!-- Search empty -->
      <div v-else-if="bookmarkedWords.length && !filteredGrouped.length" class="empty-state">
        <div class="empty-state__icon">🔍</div>
        <p class="empty-state__title">Không tìm thấy kết quả</p>
        <p class="empty-state__desc">Thử tìm kiếm với từ khóa khác</p>
      </div>

      <!-- No bookmarks yet -->
      <div v-else class="empty-state">
        <div class="empty-state__icon">⭐</div>
        <p class="empty-state__title">Chưa có từ nào được lưu</p>
        <p class="empty-state__desc">
          Bấm vào icon ⭐ trên từ bất kỳ để thêm vào danh sách này
        </p>
        <el-button type="primary" id="mylist-start-btn" style="margin-top: 8px;" @click="goHome">
          Bắt đầu học ngay
        </el-button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useVocabularyStore } from '@/store/vocabulary'
import { ElMessage } from 'element-plus'
import WordCard from '@/components/common/WordCard.vue'

const store = useVocabularyStore()
const router = useRouter()

// Lấy tất cả từ đã bookmark
const bookmarkedWords = computed(() => store.bookmarkedWords)

// Search
const searchQuery = ref('')

// Lọc theo search
const filteredWords = computed(() => {
  if (!searchQuery.value.trim()) return bookmarkedWords.value
  const q = searchQuery.value.toLowerCase()
  return bookmarkedWords.value.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.meaning.toLowerCase().includes(q)
  )
})

// Group từ theo ngày (để hiển thị theo nhóm)
const filteredGrouped = computed(() => {
  const groups = {}
  filteredWords.value.forEach(word => {
    if (!groups[word.dayKey]) groups[word.dayKey] = []
    groups[word.dayKey].push(word)
  })
  // Sort groups theo thứ tự ngày
  return Object.entries(groups)
    .sort(([a], [b]) => {
      const numA = parseInt(a.replace('day ', ''))
      const numB = parseInt(b.replace('day ', ''))
      return numA - numB
    })
    .map(([dayKey, words]) => ({ dayKey, words }))
})

// Xóa tất cả bookmark
function clearAll() {
  store.bookmarkedIds.splice(0)
  ElMessage.success('Đã xóa tất cả từ đã lưu')
}

function goToFlashcardMyList() {
  router.push({ name: 'flashcard-mylist' })
}

function goHome() {
  router.push({ name: 'home' })
}
</script>

<style lang="scss" scoped>
@use "@/assets/styles/variables.scss" as *;

.mylist-view {
  padding: $space-6 0 $space-8;
}

// --- Header ---
.mylist-view__header {
  margin-bottom: $space-6;
}

.mylist-view__title-row {
  display: flex;
  align-items: center;
  gap: $space-3;
  margin-bottom: $space-2;
  flex-wrap: wrap;
}

.mylist-view__icon {
  font-size: 1.8rem;
  color: $color-gold;
}

.mylist-view__title {
  font-size: $font-size-3xl;
  font-weight: $font-weight-extrabold;
  letter-spacing: -0.02em;
  margin: 0;
}

.mylist-view__desc {
  font-size: $font-size-sm;
  color: $color-text-secondary;
  margin: 0;
}

// --- Actions ---
.mylist-view__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $space-3;
  margin-bottom: $space-5;

  a { text-decoration: none; }
}

// --- Search ---
.mylist-view__search {
  margin-bottom: $space-5;
  max-width: 400px;
}

// --- Groups ---
.mylist-view__groups {
  display: flex;
  flex-direction: column;
  gap: $space-8;
}

.mylist-group {
  &__header {
    display: flex;
    align-items: center;
    gap: $space-3;
    margin-bottom: $space-4;
    padding-bottom: $space-3;
    border-bottom: 1px solid $color-border;
    flex-wrap: wrap;
  }

  &__label {
    font-size: $font-size-lg;
    font-weight: $font-weight-bold;
    color: $color-text-primary;
  }

  &__link {
    font-size: $font-size-sm;
    color: $color-primary;
    text-decoration: none;
    margin-left: auto;

    &:hover { opacity: 0.8; }
  }

  &__words {
    display: flex;
    flex-direction: column;
    gap: $space-3;
  }
}
</style>
