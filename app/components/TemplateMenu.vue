<script setup lang="ts">
// DropdownMenuItem inlined to avoid module export mismatch with @nuxt/ui
type DropdownMenuItem = {
  label?: string
  to?: string
  color?: string
  checked?: boolean
  type?: string
}

const items: DropdownMenuItem[] = [{
  label: 'Starter',
  to: 'https://starter-template.nuxt.dev/',
  color: 'primary',
  checked: true,
  type: 'checkbox'
}, {
  label: 'Landing',
  to: 'https://landing-template.nuxt.dev/'
}, {
  label: 'Docs',
  to: 'https://docs-template.nuxt.dev/'
}, {
  label: 'SaaS',
  to: 'https://saas-template.nuxt.dev/'
}, {
  label: 'Dashboard',
  to: 'https://dashboard-template.nuxt.dev/'
}, {
  label: 'Chat',
  to: 'https://chat-template.nuxt.dev/'
}, {
  label: 'Portfolio',
  to: 'https://portfolio-template.nuxt.dev/'
}, {
  label: 'Changelog',
  to: 'https://changelog-template.nuxt.dev/'
}, {
  label: 'Editor',
  to: 'https://editor-template.nuxt.dev/'
}, {
  label: 'Calendar',
  to: 'https://calendar-template.nuxt.dev/'
}]
</script>

<template>
  <UDropdownMenu
    v-slot="{ open }"
    :modal="false"
    :items="items"
    :content="{ align: 'start' }"
    :ui="{ content: 'min-w-fit' }"
    size="xs"
  >
    <UButton
      label="Starter"
      variant="ghost"
      trailing-icon="i-lucide-chevron-down"
      size="xs"
      class="-mb-[6px] font-semibold rounded-full truncate"
      :class="[open && 'bg-primary/15']"
      :ui="{
        trailingIcon: ['transition-transform duration-200', open ? 'rotate-180' : undefined].filter(Boolean).join(' ')
      }"
    />
  </UDropdownMenu>
</template>
