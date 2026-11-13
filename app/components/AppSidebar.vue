<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useSidebar, type NavItem } from '~/composables/useSidebar'
import { useBrand } from '~/composables/useBrand'

const { brand, displayName, loadBrand } = useBrand()

onMounted(() => {
  loadBrand()
})

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    mode?: 'full' | 'rail' | 'auto'
    defaultCollapsed?: boolean
    collapsible?: boolean
    customClass?: string
    showShortcuts?: boolean
    ariaLabel?: string
  }>(),
  {
    modelValue: undefined,
    mode: 'auto',
    defaultCollapsed: undefined,
    collapsible: true,
    customClass: '',
    showShortcuts: true,
    ariaLabel: 'Main navigation',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'shortcuts'): void
  (e: 'logout'): void
}>()

const config = useRuntimeConfig()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()
const { isCollapsed: globalCollapsed, isMobileOpen, closeMobile, navSections, toggle: globalToggle } = useSidebar()

watch(() => route.path, () => {
  closeMobile()
})

// Sync with shared global state unless explicitly overridden by v-model
const internalCollapsed = ref(
  props.defaultCollapsed !== undefined ? props.defaultCollapsed : globalCollapsed.value
)

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined) internalCollapsed.value = val
  }
)

watch(globalCollapsed, (val) => {
  if (props.modelValue === undefined) {
    internalCollapsed.value = val
  }
})

const isRail = computed(() => {
  if (props.mode === 'rail') return true
  if (props.mode === 'full') return false
  if (props.modelValue !== undefined) return props.modelValue
  return globalCollapsed.value
})

function toggleCollapse() {
  const nextVal = !isRail.value
  internalCollapsed.value = nextVal
  globalCollapsed.value = nextVal
  emit('update:modelValue', nextVal)
}

// Flat list of primary items for rail mode
const railItems = computed<NavItem[]>(() => {
  const primaries: NavItem[] = []
  for (const sec of navSections) {
    for (const it of sec.items) {
      if (it.railPrimary) {
        primaries.push(it)
      }
    }
  }
  return primaries
})

const branchName = computed(() => {
  return authStore.currentUser?.branch?.name || ''
})

const userName = computed(() => {
  return authStore.currentUser?.full_name || authStore.currentUser?.username || 'User'
})

const userRole = computed(() => {
  return authStore.currentUser?.roles?.[0]?.name || 'Staff'
})

const userInitials = computed(() => {
  const name = userName.value
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w: string) => w[0])
    .join('')
    .toUpperCase() || 'U'
})

function isActive(to: string): boolean {
  if (to.startsWith('http')) return false
  if (to === '/pos') return route.path === '/pos' || route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

async function onLogout() {
  emit('logout')
  try {
    await authStore.logout()
  } catch (err) {
    console.error('Logout error:', err)
  }
  await router.push('/login')
}
</script>

<template>
  <aside
    class="hidden lg:flex flex-col bg-surface-card border-r border-border-subtle transition-all duration-200 select-none z-20 h-full no-print"
    :class="[
      isRail ? 'w-[52px] min-w-[52px] items-center' : 'w-[200px] min-w-[200px]',
      customClass,
    ]"
    :aria-label="ariaLabel || 'Main navigation'"
  >
    <!-- ─── Header: BRAND_MODEL Logo & Title ─────────────────────────────── -->
    <div
      class="h-12 flex items-center border-b border-border-subtle shrink-0 w-full"
      :class="isRail ? 'justify-center px-0' : 'justify-between px-2.5'"
    >
      <NuxtLink
        to="/pos"
        class="flex items-center gap-2 min-w-0 no-underline"
        :class="isRail ? 'justify-center' : 'flex-1'"
        :title="config.public.appName"
        :aria-label="config.public.appName"
      >
        <div class="w-7.5 h-7.5 bg-brand-900 rounded-md flex items-center justify-center shrink-0 overflow-hidden">
          <img
            v-if="brand.logo_url"
            :src="brand.logo_url"
            :alt="displayName"
            class="w-full h-full object-contain p-0.5 rounded"
          />
          <UIcon v-else name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
        </div>
        <div v-if="!isRail" class="flex flex-col min-w-0">
          <span class="text-xs font-semibold text-ink truncate font-khmer">{{ displayName }}</span>
          <span v-if="branchName" class="text-[10px] text-ink-tertiary truncate leading-tight">{{ branchName }}</span>
        </div>
      </NuxtLink>

      <!-- Collapse / Expand Toggle Button (in header for full mode) -->
      <button
        v-if="collapsible && !isRail"
        type="button"
        class="w-6 h-6 rounded flex items-center justify-center text-ink-tertiary hover:bg-surface-hover hover:text-ink cursor-pointer shrink-0 transition-colors"
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
        @click="toggleCollapse"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
      </button>
    </div>

    <!-- ─── Rail Mode Navigation (Icon Only) ───────────────────────── -->
    <nav v-if="isRail" class="flex-1 flex flex-col items-center gap-1 w-full py-1.5 overflow-y-auto" aria-label="Quick navigation">
      <NuxtLink
        v-for="item in railItems"
        :key="item.to"
        :to="item.to"
        :external="item.external"
        :target="item.target"
        class="w-9 h-9 rounded-md flex items-center justify-center text-ink-tertiary hover:bg-surface-hover hover:text-ink transition-colors relative cursor-pointer"
        :class="[isActive(item.to) && 'bg-brand-900 text-white hover:bg-brand-900 hover:text-white font-semibold']"
        :title="item.label + (item.shortcut ? ` [${item.shortcut}]` : '')"
        :aria-label="item.label"
      >
        <UIcon :name="item.icon" class="w-4 h-4" />
        <span v-if="item.badge" class="absolute top-1 right-1 w-2 h-2 rounded-full bg-status-red" />
      </NuxtLink>
    </nav>

    <!-- ─── Full Mode Navigation (Categorized Sections) ────────────── -->
    <nav v-else class="flex-1 overflow-y-auto p-1.5 flex flex-col gap-1.5" aria-label="Categorized navigation">
      <div v-for="section in navSections" :key="section.title" class="flex flex-col gap-0.5">
        <span class="text-[10px] font-bold text-ink-tertiary uppercase tracking-wider px-2 pt-1 pb-0.5 select-none">{{ section.title }}</span>
        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :external="item.external"
          :target="item.target"
          class="flex items-center gap-2 h-7.5 px-2 rounded-md text-xs font-medium text-ink-secondary hover:bg-surface-hover hover:text-ink transition-colors relative"
          :class="[isActive(item.to) && 'bg-surface-active text-ink font-semibold']"
        >
          <span class="shrink-0 w-4 h-4 flex items-center justify-center">
            <UIcon :name="item.icon" class="w-4 h-4" />
          </span>
          <span class="flex-1 truncate">{{ item.label }}</span>
          <span v-if="item.badge" class="text-[10px] font-semibold bg-brand-900 text-white px-1.5 py-0.5 rounded-full">{{ item.badge }}</span>
          <span v-else-if="item.shortcut" class="text-[10px] font-mono bg-surface-hover text-ink-tertiary px-1 py-0.5 rounded">{{ item.shortcut }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- ─── Bottom Footer Actions ──────────────────────────────────── -->
    <div
      class="border-t border-border-subtle shrink-0 w-full"
      :class="isRail ? 'flex flex-col items-center gap-1 py-1.5' : 'p-2'"
    >
      <!-- Rail-specific bottom icons -->
      <template v-if="isRail">
        <!-- Expand button for rail mode -->
        <button
          v-if="collapsible"
          type="button"
          class="w-9 h-9 rounded-md flex items-center justify-center text-ink-secondary hover:bg-brand-900 hover:text-white transition-colors cursor-pointer"
          title="Expand sidebar"
          aria-label="Expand sidebar"
          @click="toggleCollapse"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        </button>

        <button
          v-if="showShortcuts"
          type="button"
          class="w-9 h-9 rounded-md flex items-center justify-center text-ink-tertiary hover:bg-surface-hover hover:text-ink transition-colors cursor-pointer"
          title="Keyboard Shortcuts [F1]"
          aria-label="Keyboard Shortcuts"
          @click="$emit('shortcuts')"
        >
          <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
        </button>

        <NuxtLink
          to="/settings"
          class="w-9 h-9 rounded-md flex items-center justify-center text-ink-tertiary hover:bg-surface-hover hover:text-ink transition-colors cursor-pointer"
          :class="[isActive('/settings') && 'bg-brand-900 text-white hover:bg-brand-900 hover:text-white font-semibold']"
          title="System Settings"
          aria-label="System Settings"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
        </NuxtLink>

        <button
          type="button"
          class="w-9 h-9 rounded-md flex items-center justify-center text-ink-tertiary hover:bg-status-red-bg hover:text-status-red transition-colors cursor-pointer"
          title="Sign Out"
          aria-label="Sign Out"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
        </button>
      </template>
