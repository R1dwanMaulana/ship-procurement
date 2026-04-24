<template>
  <div class="min-h-screen bg-background flex flex-col max-w-md mx-auto">
    <!-- Toast Notification -->
    <ToastNotif />

    <!-- Header -->
    <header class="sticky top-0 z-50 bg-background border-b border-border h-14 px-4 flex items-center justify-between"
      style="padding-top: env(safe-area-inset-top, 0px)">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <AppIcon :name="userProfile?.role === 'kapal' ? 'anchor' : 'building'" :size="15" class="text-primary-foreground" />
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-sm leading-none truncate">{{ userProfile?.nama || '...' }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">
            {{ userProfile?.role === 'kapal' ? 'Pihak Kapal' : 'Tim Purchasing' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-0.5">
        <!-- Dark mode toggle -->
        <button @click="toggleTheme"
          class="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors press">
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
        </button>
        <NuxtLink to="/notifikasi"
          class="relative w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors press">
          <AppIcon name="bell" :size="18" />
          <span v-if="unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-foreground rounded-full" />
        </NuxtLink>
        <button @click="handleLogout"
          class="w-9 h-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors press">
          <AppIcon name="logout" :size="18" />
        </button>
      </div>
    </header>

    <main class="flex-1" style="padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px))">
      <slot />
    </main>

    <!-- Bottom Nav -->
    <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border z-50 nav-safe">
      <div class="flex justify-around">
        <NuxtLink
          v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-4 min-w-0 relative transition-colors"
          :class="isActive(item.to) ? 'text-foreground' : 'text-muted-foreground'">
          <div class="relative">
            <AppIcon :name="item.icon as any" :size="20" />
            <span v-if="item.badge && item.badge > 0"
              class="absolute -top-1 -right-1 w-1.5 h-1.5 bg-foreground rounded-full" />
          </div>
          <span class="text-xs">{{ item.label }}</span>
          <!-- active underline -->
          <span v-if="isActive(item.to)"
            class="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-foreground rounded-full" />
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const { userProfile, logout } = useAuth()
const { unreadCount, startListening, stopListening, stats } = useStore()
const { isDark, toggle: toggleTheme, init: initTheme } = useTheme()
const { start: startRealtimeNotif, stop: stopRealtimeNotif } = useRealtimeNotif()
const router = useRouter()
const route = useRoute()

onMounted(() => {
  initTheme()
  startListening(userProfile.value?.role)
  startRealtimeNotif()
})
onUnmounted(() => {
  stopListening()
  stopRealtimeNotif()
})

const handleLogout = async () => {
  stopListening()
  await logout()
  router.push('/login')
}

const isActive = (path: string) => path === '/' ? route.path === '/' : route.path.startsWith(path)

const navItems = computed(() => {
  const base = [
    { to: '/', icon: 'home', label: 'Beranda', badge: 0 },
    { to: '/pengajuan', icon: 'list', label: 'Pengajuan', badge: stats.value.urgentDiajukan },
    { to: '/tracking', icon: 'map', label: 'Tracking', badge: 0 },
  ]
  if (userProfile.value?.role === 'purchasing')
    base.push({ to: '/laporan', icon: 'chart', label: 'Laporan', badge: stats.value.belumPasang })
  base.push({ to: '/profil', icon: 'user', label: 'Profil', badge: 0 })
  return base
})
</script>
