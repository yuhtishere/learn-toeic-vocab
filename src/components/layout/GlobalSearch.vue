<template>
  <!-- Global Search Dialog -->
  <teleport to="body">
    <transition name="search-overlay">
      <div v-if="visible" class="search-overlay" @click.self="close">
        <transition name="search-panel">
          <div v-if="visible" class="search-panel">
            <!-- Search input -->
            <div class="search-panel__header">
              <el-icon class="search-panel__icon"><Search /></el-icon>
              <input
                ref="inputRef"
                v-model="query"
                class="search-panel__input"
                placeholder="Tìm từ vựng trên toàn bộ 30 ngày..."
                id="global-search-input"
                @keydown.esc="close"
              />
              <kbd class="search-panel__kbd" @click="close">ESC</kbd>
            </div>

            <!-- Results -->
            <div class="search-panel__body" v-if="query.trim()">
              <div v-if="results.length" class="search-panel__results">
                <div class="search-panel__count">
                  Tìm thấy <strong>{{ results.length }}</strong> kết quả
                </div>
                <div
                  v-for="(group, idx) in groupedResults"
                  :key="idx"
                  class="search-panel__group"
                >
                  <div class="search-panel__group-title">
                    {{ group.dayLabel }}
                    <span class="search-panel__group-count">{{ group.words.length }}</span>
                  </div>
                  <button
                    v-for="word in group.words"
                    :key="`${word.dayKey}-${word.id}`"
                    class="search-panel__item"
                    @click="goToWord(word)"
                  >
                    <div class="search-panel__item-main">
                      <span class="search-panel__item-word" v-html="highlight(word.word)"></span>
                      <span v-if="word.type" class="search-panel__item-type">{{ word.type }}</span>
                    </div>
                    <div class="search-panel__item-meaning" v-html="highlight(word.meaning)"></div>
                  </button>
                </div>
              </div>

              <div v-else class="search-panel__empty">
                <div class="search-panel__empty-icon">🔍</div>
                <p>Không tìm thấy từ nào phù hợp</p>
              </div>
            </div>

            <!-- Default state -->
            <div class="search-panel__body" v-else>
              <div class="search-panel__hint">
                <p>Nhập từ tiếng Anh hoặc nghĩa tiếng Việt để tìm kiếm</p>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import database from '../../../database.json'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close'])

const router = useRouter()
const query = ref('')
const inputRef = ref(null)

// Build flat list of all words once
const allWords = (() => {
  const words = []
  for (const [dayKey, list] of Object.entries(database)) {
    list.forEach(w => words.push({ ...w, dayKey }))
  }
  return words
})()

const results = computed(() => {
  const q = query.value.toLowerCase().trim()
  if (!q) return []
  return allWords.filter(w =>
    w.word.toLowerCase().includes(q) ||
    w.meaning.toLowerCase().includes(q)
  ).slice(0, 50) // Cap at 50 results for performance
})

const groupedResults = computed(() => {
  const map = new Map()
  for (const w of results.value) {
    if (!map.has(w.dayKey)) {
      map.set(w.dayKey, { dayKey: w.dayKey, dayLabel: w.dayKey.replace('day ', 'Ngày '), words: [] })
    }
    map.get(w.dayKey).words.push(w)
  }
  return Array.from(map.values())
})

function highlight(text) {
  const q = query.value.trim()
  if (!q) return text
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

function goToWord(word) {
  close()
  router.push({ name: 'day', params: { dayKey: word.dayKey } })
}

function close() {
  emit('close')
  query.value = ''
}

// Focus input when opened
watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => inputRef.value?.focus())
  }
})

// Ctrl+K / Cmd+K shortcut
function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    if (props.visible) close()
    else emit('open')
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style lang="scss">
@use "@/assets/styles/variables.scss" as *;

.search-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-modal;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  padding-top: 10vh;
}

// Transitions
.search-overlay-enter-active,
.search-overlay-leave-active {
  transition: opacity 0.2s ease;
}
.search-overlay-enter-from,
.search-overlay-leave-to {
  opacity: 0;
}

.search-panel-enter-active {
  transition: all 0.2s ease-out;
}
.search-panel-leave-active {
  transition: all 0.15s ease-in;
}
.search-panel-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
.search-panel-leave-to {
  opacity: 0;
  transform: scale(0.98);
}

.search-panel {
  width: 90vw;
  max-width: 580px;
  max-height: 70vh;
  background: $color-card;
  border: 1px solid $color-border;
  border-radius: $radius-xl;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-self: flex-start;
}

.search-panel__header {
  display: flex;
  align-items: center;
  gap: $space-3;
  padding: $space-4 $space-5;
  border-bottom: 1px solid $color-border;
}

.search-panel__icon {
  font-size: 1.25rem;
  color: $color-text-muted;
  flex-shrink: 0;
}

.search-panel__input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: $color-text-primary;
  font-size: $font-size-base;
  font-family: $font-family-base;

  &::placeholder {
    color: $color-text-muted;
  }
}

.search-panel__kbd {
  padding: 2px 8px;
  background: $color-surface;
  border: 1px solid $color-border;
  border-radius: $radius-sm;
  font-size: $font-size-xs;
  color: $color-text-muted;
  font-family: $font-family-base;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
}

.search-panel__body {
  overflow-y: auto;
  padding: $space-3;
}

.search-panel__count {
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  color: $color-text-muted;
}

.search-panel__group {
  margin-bottom: $space-2;
}

.search-panel__group-title {
  display: flex;
  align-items: center;
  gap: $space-2;
  padding: $space-2 $space-3;
  font-size: $font-size-xs;
  font-weight: $font-weight-semibold;
  color: $color-primary;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.search-panel__group-count {
  background: rgba($color-primary, 0.15);
  color: $color-primary;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: $radius-full;
}

.search-panel__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  padding: $space-3 $space-4;
  border: none;
  background: transparent;
  border-radius: $radius-md;
  cursor: pointer;
  transition: $transition-fast;
  text-align: left;

  &:hover {
    background: $color-card-hover;
  }
}

.search-panel__item-main {
  display: flex;
  align-items: center;
  gap: $space-2;
}

.search-panel__item-word {
  color: $color-text-primary;
  font-weight: $font-weight-semibold;
  font-size: $font-size-base;
}

.search-panel__item-type {
  color: $color-text-muted;
  font-size: $font-size-xs;
}

.search-panel__item-meaning {
  color: $color-text-secondary;
  font-size: $font-size-sm;
  line-height: 1.4;
}

.search-highlight {
  background: rgba($color-gold, 0.3);
  color: $color-text-primary;
  border-radius: 2px;
  padding: 0 2px;
}

.search-panel__empty {
  text-align: center;
  padding: $space-8 $space-4;
  color: $color-text-muted;
}

.search-panel__empty-icon {
  font-size: 2rem;
  margin-bottom: $space-3;
}

.search-panel__hint {
  text-align: center;
  padding: $space-6 $space-4;
  color: $color-text-muted;
  font-size: $font-size-sm;
}
</style>
