<template>
  <div class="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

    <!-- Top Bar -->
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center text-white"
          :class="userProfile?.role === 'kapal' ? 'bg-blue-500' : 'bg-teal-500'">
          <AppIcon :name="userProfile?.role === 'kapal' ? 'anchor' : 'building'" :size="14" />
        </div>
        <div>
          <p class="font-semibold text-gray-800 text-sm leading-none">{{ userProfile?.nama || '...' }}</p>
          <p class="text-xs mt-0.5" :class="userProfile?.role === 'kapal' ? 'text-blue-400' : 'text-teal-400'">
            {{ userProfile?.role === 'kapal' ? 'Pihak Kapal' : 'Tim Purchasing' }}
          </p>
        </div>
      </div>
      <div class="flex items-center gap-0.5">
        <NuxtLink to="/notifikasi"
          class="relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <AppIcon name="bell" :size="18" />
          <span v-if="unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white">
          </span>
        </NuxtLink>
        <button @click="handleLogout"
          class="w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
          <AppIcon name="logout" :size="18" />
        </button>
      </div>
    </header>

    <main class="flex-1 pb-20">
      <slot />
    </main>

    <!-- Bottom Nav -->
    <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 z-50">
      <div class="flex justify-around px-2 py-1">
        <NuxtLink v-for="item in navItems" :key="item.to" :to="item.to"
          class="flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all min-w-0"
          :class="isActive(item.to)
            ? (userProfile?.role === 'kapal' ? 'text-blue-500' : 'text-teal-500')
            : 'text-gray-300'">
          <div class="relative">
            <AppIcon :name="item.icon as any" :size="22" />
            <span v-if="item.badge && item.badge > 0"
              class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full">
            </span>
          </div>
          <span class="text-xs font-medium">{{ item.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
const { userProfile, logout } = useAuth()
const { unreadCount, startListening, stopListening, stats } = useStore()
const router = useRouter()
const route = useRoute()

onMounted(() => startListening(userProfile.value?.role))
onUnmounted(() => stopListening())

const handleLogout = async () => {
  stopListening()
  await logout()
  router.push('/login')
}

const isActive = (path: string) => path === '/' ? route.path === '/' : route.path.startsWith(path)

const navItems = computed(() => {
  const base = [
    { to: '/', icon: 'home', label: 'Beranda', badge: 0 },
    { to: '/pengajuan', icon: 'list', label: 'Pengajuan', badge: 0 },
    { to: '/tracking', icon: 'map', label: 'Tracking', badge: 0 },
  ]
  // Laporan hanya untuk purchasing
  if (userProfile.value?.role === 'purchasing') {
    base.push({ to: '/laporan', icon: 'chart', label: 'Laporan', badge: stats.value.belumPasang })
  }
  return base
})
</script>
