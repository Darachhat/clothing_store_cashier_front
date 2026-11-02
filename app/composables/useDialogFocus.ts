/**
 * useDialogFocus — minimal, dependency-free focus management for POS dialogs.
 *
 *  - moves focus into the dialog when it opens (optionally to a specific control)
 *  - traps Tab / Shift+Tab inside the dialog while it is open
 *  - returns focus to the element that opened it (e.g. the search/scan input) on close
 *
 * Escape handling stays with the POS page's global shortcut handler.
 */
import { nextTick, onBeforeUnmount, watch, type Ref } from 'vue'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useDialogFocus(
  open: Ref<boolean>,
  container: Ref<any>,
  options: { initialFocus?: () => any } = {},
) {
  let previouslyFocused: HTMLElement | null = null

  function focusables(): HTMLElement[] {
    const el = container.value as HTMLElement | null
    if (!el || !el.querySelectorAll) return []
    return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (item) => item.offsetParent !== null || item === document.activeElement,
    )
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const items = focusables()
    if (items.length === 0) return
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey && (active === first || !container.value?.contains(active))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (active === last || !container.value?.contains(active))) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(
    open,
    async (isOpen) => {
      if (typeof document === 'undefined') return
      if (isOpen) {
        previouslyFocused = document.activeElement as HTMLElement | null
        document.addEventListener('keydown', onKeydown)
        await nextTick()
        const target = options.initialFocus?.() ?? focusables()[0]
        target?.focus()
      } else {
        document.removeEventListener('keydown', onKeydown)
        const back = previouslyFocused
        previouslyFocused = null
        if (back && document.contains(back)) back.focus()
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') document.removeEventListener('keydown', onKeydown)
  })
}

