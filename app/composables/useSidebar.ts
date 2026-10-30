export interface NavItem {
  label: string
  to: string
  icon: string
  shortcut?: string
  badge?: string | number
  railPrimary?: boolean
  external?: boolean
  target?: string
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const APP_NAV_SECTIONS: NavSection[] = [
  {
    title: 'Register',
    items: [
      { label: 'Point of Sale', to: '/pos', icon: 'i-heroicons-computer-desktop', railPrimary: true, shortcut: 'F1' },
      { label: 'Barcode Scanner', to: '/pos/scanner', icon: 'i-heroicons-qr-code', railPrimary: true, shortcut: 'F2' },
    ],
  },
  {
    title: 'Display',
    items: [
      { label: 'Customer Screen', to: '/pos/customer-display', icon: 'i-heroicons-tv', railPrimary: true },
    ],
  },
  {
    title: 'Portal',
    items: [
      { label: 'Admin Portal', to: 'http://localhost:3001', icon: 'i-heroicons-arrow-top-right-on-square', external: true, target: '_blank' },
    ],
  },
  {
    title: 'Terminal',
    items: [
      { label: 'Settings', to: '/settings', icon: 'i-heroicons-cog-6-tooth', railPrimary: false },
    ],
  },
]

export function useSidebar() {
  // Default to collapsed icon rail so all POS & terminal pages have maximum workspace
  // while keeping navigation in the exact same left-hand position across every route.
  const isCollapsed = useState<boolean>('app_sidebar_collapsed', () => true)
  const isShortcutsOpen = useState<boolean>('app_shortcuts_modal_open', () => false)

  function toggle() {
    isCollapsed.value = !isCollapsed.value
  }

  function collapse() {
    isCollapsed.value = true
  }

  function expand() {
    isCollapsed.value = false
  }

  function openShortcuts() {
    isShortcutsOpen.value = true
  }

  function closeShortcuts() {
    isShortcutsOpen.value = false
  }

  function toggleShortcuts() {
    isShortcutsOpen.value = !isShortcutsOpen.value
  }

  return {
    isCollapsed,
    isShortcutsOpen,
    navSections: APP_NAV_SECTIONS,
    toggle,
    collapse,
    expand,
    openShortcuts,
    closeShortcuts,
    toggleShortcuts,
  }
}
