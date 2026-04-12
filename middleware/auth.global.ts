export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { currentUser, userProfile, authLoading, initAuth } = useAuth()

  if (authLoading.value) {
    await initAuth()
  }

  const isLoginPage = to.path === '/login'

  if (!currentUser.value && !isLoginPage) {
    return navigateTo('/login')
  }

  if (currentUser.value && isLoginPage) {
    return navigateTo('/')
  }

  // Batasi akses laporan hanya untuk purchasing
  if (to.path === '/laporan' && userProfile.value?.role === 'kapal') {
    return navigateTo('/')
  }
})
