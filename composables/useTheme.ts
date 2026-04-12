const isDark = ref(false)

export const useTheme = () => {
  const init = () => {
    if (import.meta.server) return
    // Baca dari localStorage, fallback ke system preference
    const saved = localStorage.getItem('theme')
    if (saved) {
      isDark.value = saved === 'dark'
    } else {
      isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    applyTheme()
  }

  const applyTheme = () => {
    if (import.meta.server) return
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  const toggle = () => {
    isDark.value = !isDark.value
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
    applyTheme()
  }

  return { isDark: readonly(isDark), toggle, init }
}
