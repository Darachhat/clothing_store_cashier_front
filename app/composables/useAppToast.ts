// useAppToast — lightweight toast state, replaces Nuxt UI useToast()
import { ref } from 'vue'

export interface Toast {
  id:          string
  title:       string
  description?: string
  color?:      'green' | 'red' | 'amber' | 'default'
  timeout?:    number
}

const toasts = ref<Toast[]>([])

export function useAppToast() {
  function add(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).slice(2)
    toasts.value.push({ ...toast, id })
    const timeout = toast.timeout ?? 3500
    if (timeout > 0) {
      setTimeout(() => dismiss(id), timeout)
    }
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function success(title: string, description?: string) {
    add({ title, description, color: 'green' })
  }

  function error(title: string, description?: string) {
    add({ title, description, color: 'red' })
  }

  function warn(title: string, description?: string) {
    add({ title, description, color: 'amber' })
  }

  return { toasts, add, dismiss, success, error, warn }
}
