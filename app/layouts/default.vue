<template>
  <div class="app-main-layout flex h-dvh w-screen overflow-hidden bg-slate-100 text-slate-900 font-sans">
    <!-- Active Page Viewport (Full Screen Width - No Sidebar) -->
    <div class="app-main-layout__viewport flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden relative">
      <slot />
    </div>

    <!-- Global Keyboard Shortcuts Cheat Sheet (F1) -->
    <PosShortcutsModal v-model="isShortcutsOpen" />

    <!-- Global Toast Stack -->
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { useSidebar } from '~/composables/useSidebar'

const { isShortcutsOpen } = useSidebar()
</script>
