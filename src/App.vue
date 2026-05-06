<template>
  <!-- Root app layout -->
  <div class="app-wrapper">
    <!-- Header cố định trên cùng -->
    <AppHeader />

    <!-- Main content area — router views render ở đây -->
    <main class="main-content">
      <router-view />
    </main>

    <footer class="app-footer">
      Developed by Yuht
    </footer>

    <!-- Bottom navigation (chỉ hiện trên mobile) -->
    <BottomNav />
  </div>
</template>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import BottomNav from '@/components/layout/BottomNav.vue'
</script>

<style lang="scss">
@use "@/assets/styles/variables.scss" as *;

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $color-bg;
}

.app-footer {
  padding: $space-4 $space-6 calc(#{$bottom-nav-height} + #{$space-4});
  border-top: 1px solid $color-border;
  color: $color-text-muted;
  font-size: $font-size-sm;
  text-align: center;
  background: $color-surface;

  @media (min-width: $bp-md) {
    padding: $space-4 $space-6;
  }
}
</style>
