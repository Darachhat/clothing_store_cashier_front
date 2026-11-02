<!-- KeyHint — small keyboard-shortcut badge shared by header, cart and payment UI -->
<template>
  <kbd
    class="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded text-xs font-mono font-semibold leading-none select-none"
    :class="tone === 'inverse'
      ? 'bg-white/20 text-white'
      : 'bg-gray-100 text-gray-600'"
    aria-hidden="true"
  >
    <slot />
  </kbd>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tone?: 'default' | 'inverse' }>(), { tone: 'default' })
</script>

