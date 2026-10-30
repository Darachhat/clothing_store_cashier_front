<template>
  <div class="flex-1 min-w-0 min-h-0 flex items-center justify-center h-full bg-slate-900 text-white">
    <div class="flex items-center gap-3">
      <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-gray-400" />
      <span class="text-sm font-medium">Opening POS Terminal…</span>
    </div>
  </div>
</template>

<script setup lang="ts">
navigateTo('/pos')
</script>

