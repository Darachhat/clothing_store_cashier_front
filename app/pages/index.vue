<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    () => navigateTo('/pos', { replace: true }),
  ],
})
</script>
