export interface Toast {
  id: string
  title: string
  body?: string
  type?: 'info' | 'success' | 'error' | 'warning'
  duration?: number
}

const toasts = ref<Toast[]>([])

export const useToast = () => {
  const show = (toast: Omit<Toast, 'id'>) => {
    const id = Date.now().toString()
    toasts.value.push({ ...toast, id })

    // Auto dismiss
    const duration = toast.duration ?? 4000
    setTimeout(() => dismiss(id), duration)

    return id
  }

  const dismiss = (id: string) => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }

  const success = (title: string, body?: string) =>
    show({ title, body, type: 'success' })

  const error = (title: string, body?: string) =>
    show({ title, body, type: 'error', duration: 6000 })

  const warning = (title: string, body?: string) =>
    show({ title, body, type: 'warning' })

  const info = (title: string, body?: string) =>
    show({ title, body, type: 'info' })

  return { toasts: readonly(toasts), show, dismiss, success, error, warning, info }
}
