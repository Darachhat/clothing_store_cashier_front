<template>
  <aside
    class="app-sidebar no-print"
    :class="[
      isRail ? 'app-sidebar--rail' : 'app-sidebar--full',
      customClass,
    ]"
    :aria-label="ariaLabel || 'Main navigation'"
  >
    <!-- ─── Header: Brand Logo & Title ─────────────────────────────── -->
    <div class="app-sidebar__header">
      <NuxtLink
        to="/pos"
        class="app-sidebar__brand"
        :title="config.public.appName"
        :aria-label="config.public.appName"
      >
        <div class="app-sidebar__logo-mark">
          <UIcon name="i-heroicons-building-storefront" class="w-4 h-4 text-white" />
        </div>
        <div v-if="!isRail" class="app-sidebar__brand-meta">
          <span class="app-sidebar__brand-name">{{ config.public.appName }}</span>
          <span v-if="branchName" class="app-sidebar__brand-branch">{{ branchName }}</span>
        </div>
      </NuxtLink>

      <!-- Collapse / Expand Toggle Button (in header for full mode) -->
      <button
        v-if="collapsible && !isRail"
        type="button"
        class="app-sidebar__toggle-btn"
        title="Collapse sidebar"
        aria-label="Collapse sidebar"
        @click="toggleCollapse"
      >
        <UIcon name="i-heroicons-chevron-left" class="w-4 h-4" />
      </button>
    </div>

    <!-- ─── Rail Mode Navigation (Icon Only) ───────────────────────── -->
    <nav v-if="isRail" class="app-sidebar__rail-nav" aria-label="Quick navigation">
      <NuxtLink
        v-for="item in railItems"
        :key="item.to"
        :to="item.to"
        :external="item.external"
        :target="item.target"
        class="app-sidebar__rail-link"
        :class="{ 'is-active': isActive(item.to) }"
        :title="item.label + (item.shortcut ? ` [${item.shortcut}]` : '')"
        :aria-label="item.label"
      >
        <UIcon :name="item.icon" class="w-4 h-4" />
        <span v-if="item.badge" class="app-sidebar__rail-badge">{{ item.badge }}</span>
      </NuxtLink>
    </nav>

    <!-- ─── Full Mode Navigation (Categorized Sections) ────────────── -->
    <nav v-else class="app-sidebar__full-nav" aria-label="Categorized navigation">
      <div v-for="section in navSections" :key="section.title" class="app-sidebar__section">
        <span class="app-sidebar__section-title">{{ section.title }}</span>
        <NuxtLink
          v-for="item in section.items"
          :key="item.to"
          :to="item.to"
          :external="item.external"
          :target="item.target"
          class="app-sidebar__nav-link"
          :class="{ 'is-active': isActive(item.to) }"
        >
          <span class="app-sidebar__icon-box">
            <UIcon :name="item.icon" class="w-4 h-4" />
          </span>
          <span class="app-sidebar__nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="app-sidebar__nav-badge">{{ item.badge }}</span>
          <span v-else-if="item.shortcut" class="app-sidebar__nav-shortcut">{{ item.shortcut }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- ─── Bottom Footer Actions ──────────────────────────────────── -->
    <div class="app-sidebar__footer" :class="{ 'is-rail': isRail }">
      <!-- Rail-specific bottom icons -->
      <template v-if="isRail">
        <!-- Expand button for rail mode -->
        <button
          v-if="collapsible"
          type="button"
          class="app-sidebar__rail-link app-sidebar__rail-link--toggle"
          title="Expand sidebar"
          aria-label="Expand sidebar"
          @click="toggleCollapse"
        >
          <UIcon name="i-heroicons-chevron-right" class="w-4 h-4" />
        </button>

        <button
          v-if="showShortcuts"
          type="button"
          class="app-sidebar__rail-link"
          title="Keyboard Shortcuts [F1]"
          aria-label="Keyboard Shortcuts"
          @click="$emit('shortcuts')"
        >
          <UIcon name="i-heroicons-question-mark-circle" class="w-4 h-4" />
        </button>

        <NuxtLink
          to="/settings"
          class="app-sidebar__rail-link"
          :class="{ 'is-active': isActive('/settings') }"
          title="System Settings"
          aria-label="System Settings"
        >
          <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4" />
        </NuxtLink>

        <button
          type="button"
          class="app-sidebar__rail-link app-sidebar__rail-link--danger"
          title="Sign Out"
          aria-label="Sign Out"
          @click="onLogout"
        >
          <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
        </button>
      </template>

      <!-- Full mode user card -->
      <template v-else>
        <div class="app-sidebar__user">
          <div class="app-sidebar__user-avatar">
            {{ userInitials }}
          </div>
          <div class="app-sidebar__user-info">
            <div class="app-sidebar__user-name" :title="userName">{{ userName }}</div>
            <div class="app-sidebar__user-role">{{ userRole }}</div>
          </div>
          <button
            type="button"
            class="app-sidebar__logout-btn"
            title="Sign Out"
            aria-label="Sign Out"
            @click="onLogout"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
          </button>
        </div>
      </template>
    </div>
  </aside>

  <!-- ─── Mobile Slide-over Drawer (< lg screens) ──────────────────── -->
  <Teleport to="body">
    <div
      v-if="isMobileOpen"
      class="fixed inset-0 z-50 lg:hidden flex"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation drawer"
    >
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        @click="closeMobile"
      />

      <!-- Drawer Content -->
      <aside
        class="relative flex flex-col w-[260px] max-w-[85vw] h-full bg-white border-r border-gray-200 z-10 shadow-2xl overflow-hidden select-none font-sans"
      >
        <!-- Drawer Header -->
        <div class="h-14 px-4 border-b border-gray-200 flex items-center justify-between gap-2 flex-shrink-0">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-8 h-8 rounded-md bg-gray-900 text-white flex items-center justify-center flex-shrink-0">
              <UIcon name="i-heroicons-building-storefront" class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="text-sm font-semibold text-gray-900 truncate">{{ config.public.appName }}</span>
              <span v-if="branchName" class="text-xs text-gray-500 truncate">{{ branchName }}</span>
            </div>
          </div>
          <button
            type="button"
            class="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label="Close menu"
            @click="closeMobile"
          >
            <UIcon name="i-heroicons-x-mark" class="w-5 h-5" />
          </button>
        </div>

        <!-- Drawer Navigation Items -->
        <nav class="flex-1 overflow-y-auto pos-scroll p-3 flex flex-col gap-4">
          <div v-for="section in navSections" :key="section.title" class="flex flex-col gap-1">
            <span class="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{{ section.title }}</span>
            <NuxtLink
              v-for="item in section.items"
              :key="item.to"
              :to="item.to"
              :external="item.external"
              :target="item.target"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              :class="isActive(item.to)
                ? 'bg-gray-900 text-white'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'"
              @click="closeMobile"
            >
              <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
              <span class="truncate">{{ item.label }}</span>
              <span v-if="item.badge" class="ml-auto px-1.5 py-0.5 text-xs font-bold rounded-full bg-gray-200 text-gray-800">{{ item.badge }}</span>
              <span v-else-if="item.shortcut" class="ml-auto text-xs text-gray-400 font-mono">{{ item.shortcut }}</span>
            </NuxtLink>
          </div>
        </nav>

        <!-- Drawer Footer -->
        <div class="p-3 border-t border-gray-200 bg-gray-50 flex flex-col gap-2 flex-shrink-0">
          <div class="flex items-center gap-2.5 px-2 py-1 min-w-0">
            <div class="w-8 h-8 rounded-full bg-gray-200 text-gray-800 font-bold text-xs flex items-center justify-center flex-shrink-0">
              {{ userInitials }}
            </div>
            <div class="flex flex-col min-w-0 leading-tight">
              <span class="text-sm font-semibold text-gray-900 truncate">{{ userName }}</span>
              <span class="text-xs text-gray-500 truncate">{{ userRole }}</span>
            </div>
          </div>
          <button
            type="button"
            class="w-full flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-gray-200 bg-white hover:bg-red-50 text-red-700 text-sm font-semibold transition-colors cursor-pointer"
            @click="onLogout(); closeMobile()"
          >
            <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter, useRuntimeConfig } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useSidebar, type NavItem } from '~/composables/useSidebar'

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

<style scoped>
.app-sidebar {
  background: var(--surface-card, #ffffff);
  border-right: 1px solid var(--border-subtle, #e5e7eb);
  display: flex;
  flex-direction: column;
  transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  z-index: 20;
  height: 100%;
}

@media (max-width: 1023px) {
  .app-sidebar {
    display: none !important;
  }
}

.app-sidebar--full {
  width: 200px;
  min-width: 200px;
}

.app-sidebar--rail {
  width: 52px;
  min-width: 52px;
  align-items: center;
}

/* Header */
.app-sidebar__header {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid var(--border-subtle, #e5e7eb);
  flex-shrink: 0;
  width: 100%;
}

.app-sidebar--rail .app-sidebar__header {
  padding: 0;
  justify-content: center;
}

.app-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  min-width: 0;
  flex: 1;
}

.app-sidebar--rail .app-sidebar__brand {
  flex: none;
}

.app-sidebar__logo-mark {
  width: 30px;
  height: 30px;
  background: var(--brand-900, #111827);
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-sidebar__brand-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.app-sidebar__brand-name {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: var(--text-primary, #111827);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__brand-branch {
  font-size: 10px;
  color: var(--text-tertiary, #6b7280);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__toggle-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm, 6px);
  background: transparent;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary, #6b7280);
  transition: all 0.15s;
  flex-shrink: 0;
}

.app-sidebar__toggle-btn:hover {
  background: var(--surface-hover, #f3f4f6);
  color: var(--text-primary, #111827);
}

/* Full Nav */
.app-sidebar__full-nav {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.app-sidebar__full-nav::-webkit-scrollbar {
  width: 4px;
}
.app-sidebar__full-nav::-webkit-scrollbar-thumb {
  background: var(--border-subtle, #e5e7eb);
  border-radius: 4px;
}

.app-sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.app-sidebar__section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary, #9ca3af);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 4px 8px 2px;
}

.app-sidebar__nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 30px;
  padding: 0 8px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-sm, 12px);
  font-weight: 500;
  color: var(--text-secondary, #4b5563);
  text-decoration: none;
  transition: background 0.12s, color 0.12s;
  position: relative;
}

.app-sidebar__nav-link:hover {
  background: var(--surface-hover, #f3f4f6);
  color: var(--text-primary, #111827);
}

.app-sidebar__nav-link.is-active {
  background: var(--surface-active, #f3f4f6);
  color: var(--text-primary, #111827);
  font-weight: 600;
}

.app-sidebar__icon-box {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: currentColor;
}

.app-sidebar__nav-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__nav-shortcut {
  font-size: 10px;
  font-family: monospace;
  background: var(--surface-hover, #e5e7eb);
  color: var(--text-tertiary, #6b7280);
  padding: 1px 4px;
  border-radius: 4px;
}

.app-sidebar__nav-badge {
  font-size: 10px;
  font-weight: 600;
  background: var(--brand-900, #111827);
  color: #fff;
  padding: 1px 6px;
  border-radius: 999px;
}

/* Rail Nav */
.app-sidebar__rail-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  width: 100%;
  padding: 6px 0;
  overflow-y: auto;
}

.app-sidebar__rail-nav::-webkit-scrollbar {
  width: 0;
}

.app-sidebar__rail-link {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, #6b7280);
  text-decoration: none;
  position: relative;
  transition: all 0.15s;
  background: transparent;
  border: none;
  cursor: pointer;
}

.app-sidebar__rail-link:hover {
  background: var(--surface-hover, #f3f4f6);
  color: var(--text-primary, #111827);
}

.app-sidebar__rail-link.is-active {
  background: var(--brand-900, #111827);
  color: #ffffff;
}

.app-sidebar__rail-link--toggle {
  color: var(--text-secondary, #4b5563);
}

.app-sidebar__rail-link--toggle:hover {
  background: var(--brand-900, #111827);
  color: #ffffff;
}

.app-sidebar__rail-link--danger:hover {
  color: #ef4444;
  background: #fef2f2;
}

.app-sidebar__rail-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #ef4444;
}

/* Footer */
.app-sidebar__footer {
  border-top: 1px solid var(--border-subtle, #e5e7eb);
  flex-shrink: 0;
  width: 100%;
}

.app-sidebar__footer.is-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 6px 0;
}

.app-sidebar__user {
  padding: 8px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-sidebar__user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--brand-900, #111827);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.app-sidebar__user-info {
  flex: 1;
  min-width: 0;
}

.app-sidebar__user-name {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: var(--text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.app-sidebar__user-role {
  font-size: 10px;
  color: var(--text-tertiary, #6b7280);
}

.app-sidebar__logout-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm, 6px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-tertiary, #6b7280);
  background: none;
  border: none;
  transition: all 0.15s;
  flex-shrink: 0;
}

.app-sidebar__logout-btn:hover {
  background: var(--surface-hover, #f3f4f6);
  color: #ef4444;
}
</style>
