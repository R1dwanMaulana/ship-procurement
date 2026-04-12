<template>
  <div class="p-4 space-y-5">
    <div class="pt-1">
      <h1 class="text-base font-semibold">Profil</h1>
    </div>

    <!-- Avatar & info -->
    <Card class="p-5">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span class="text-primary-foreground text-xl font-bold">{{ initials }}</span>
        </div>
        <div class="min-w-0">
          <p class="font-semibold text-base">{{ userProfile?.nama }}</p>
          <p class="text-sm text-muted-foreground">{{ userProfile?.email }}</p>
          <div class="mt-1.5">
            <Badge variant="secondary" class="text-xs">
              {{ userProfile?.role === 'kapal' ? 'Pihak Kapal' : 'Tim Purchasing' }}
            </Badge>
          </div>
        </div>
      </div>
    </Card>

    <!-- Edit nama -->
    <Card class="p-4 space-y-3">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Edit Profil</p>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Nama</label>
        <Input v-model="editNama" :placeholder="userProfile?.nama || 'Nama Anda'" />
      </div>
      <Button class="w-full gap-1.5" :disabled="!editNama.trim() || saving" @click="saveNama">
        <AppIcon v-if="saving" name="loader" :size="14" class="animate-spin" />
        <AppIcon v-else name="check" :size="14" />
        {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
      </Button>
    </Card>

    <!-- Statistik -->
    <Card class="p-4 space-y-3">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Statistik Saya</p>
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg bg-secondary p-3 text-center">
          <p class="text-2xl font-bold">{{ myStats.total }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">Total SPB</p>
        </div>
        <div class="rounded-lg bg-secondary p-3 text-center">
          <p class="text-2xl font-bold">{{ myStats.selesai }}</p>
          <p class="text-xs text-muted-foreground mt-0.5">Selesai</p>
        </div>
      </div>
    </Card>

    <!-- Tema -->
    <Card class="p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium">Tema Gelap</p>
          <p class="text-xs text-muted-foreground mt-0.5">Ubah tampilan aplikasi</p>
        </div>
        <button @click="toggleTheme"
          :class="['relative w-11 h-6 rounded-full transition-colors', isDark ? 'bg-foreground' : 'bg-border']">
          <span :class="['absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform',
            isDark ? 'translate-x-5' : 'translate-x-0.5']" />
        </button>
      </div>
    </Card>

    <!-- Logout -->
    <Button variant="outline" class="w-full gap-1.5 text-muted-foreground" @click="showLogout = true">
      <AppIcon name="logout" :size="15" /> Keluar
    </Button>

    <ConfirmDialog
      v-model="showLogout"
      title="Keluar dari akun?"
      message="Anda akan diarahkan ke halaman login."
      confirm-label="Keluar"
      :danger="true"
      @confirm="handleLogout"
    />

    <!-- Toast -->
    <Transition name="fade">
      <div v-if="showToast" class="fixed bottom-20 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium z-50 whitespace-nowrap shadow-lg">
        Profil berhasil diperbarui
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { doc, updateDoc } from 'firebase/firestore'

const { userProfile, logout } = useAuth()
const { poList } = useStore()
const { isDark, toggle: toggleTheme } = useTheme()
const router = useRouter()
const nuxtApp = useNuxtApp()

const editNama = ref(userProfile.value?.nama || '')
const saving = ref(false)
const showToast = ref(false)
const showLogout = ref(false)

const initials = computed(() => {
  const nama = userProfile.value?.nama || ''
  return nama.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?'
})

const myStats = computed(() => {
  const uid = userProfile.value?.uid
  const mine = poList.value.filter(p => p.createdBy === uid)
  return {
    total: mine.length,
    selesai: mine.filter(p => p.status === 'selesai').length,
  }
})

const saveNama = async () => {
  if (!editNama.value.trim() || !userProfile.value?.uid) return
  saving.value = true
  try {
    const db = nuxtApp.$firebaseDb as import('firebase/firestore').Firestore
    await updateDoc(doc(db, 'users', userProfile.value.uid), { nama: editNama.value.trim() })
    // Update local state
    if (userProfile.value) (userProfile.value as any).nama = editNama.value.trim()
    showToast.value = true
    setTimeout(() => { showToast.value = false }, 2000)
  } finally { saving.value = false }
}

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
