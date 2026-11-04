<script setup lang="ts">
// Scanner operates as a camera/modal workflow inside the main POS interface
await navigateTo('/pos?scan=1')
</script>

<template>
  <div class="p-6 text-center text-sm text-gray-500">
    Opening Scanner...
  </div>
</template>

