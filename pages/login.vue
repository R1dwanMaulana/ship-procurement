<template>
  <div class="min-h-screen flex flex-col" style="background: linear-gradient(160deg, #0f172a 0%, #1e3a5f 50%, #0f4c75 100%)">

    <!-- Top decoration -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-10"
        style="background: radial-gradient(circle, #38bdf8, transparent)"></div>
      <div class="absolute top-1/3 -left-20 w-60 h-60 rounded-full opacity-5"
        style="background: radial-gradient(circle, #34d399, transparent)"></div>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">

      <!-- Logo area -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.15)">
          <AppIcon name="anchor" :size="30" class="text-white" />
        </div>
        <h1 class="text-2xl font-bold text-white tracking-tight">Ship Procurement</h1>
        <p class="text-sm font-semibold text-blue-200 mt-1 tracking-widest uppercase">BSL & SPT</p>
      </div>

      <!-- Card -->
      <div class="w-full max-w-sm rounded-3xl p-6 space-y-5"
        style="background: rgba(255,255,255,0.07); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.12)">

        <div>
          <h2 class="text-lg font-semibold text-white">Selamat datang</h2>
          <p class="text-sm text-blue-200 mt-0.5">Masuk untuk melanjutkan</p>
        </div>

        <!-- Error -->
        <div v-if="errorMsg"
          class="flex items-start gap-2.5 rounded-xl px-3.5 py-3"
          style="background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3)">
          <AppIcon name="alert" :size="15" class="text-red-400 flex-shrink-0 mt-0.5" />
          <p class="text-sm text-red-300">{{ errorMsg }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <!-- Email -->
          <div>
            <label class="block text-xs font-medium text-blue-200 mb-1.5">Email</label>
            <input v-model="email" type="email" required autocomplete="email"
              placeholder="email@example.com"
              class="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);"
              @focus="e => (e.target as HTMLElement).style.borderColor = 'rgba(56,189,248,0.6)'"
              @blur="e => (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'" />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-medium text-blue-200 mb-1.5">Password</label>
            <div class="relative">
              <input v-model="password" :type="showPass ? 'text' : 'password'"
                required autocomplete="current-password"
                placeholder="••••••••"
                class="w-full rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder-white/30 outline-none transition-all"
                style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);"
                @focus="e => (e.target as HTMLElement).style.borderColor = 'rgba(56,189,248,0.6)'"
                @blur="e => (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)'" />
              <button type="button" @click="showPass = !showPass"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                <AppIcon :name="showPass ? 'eyeOff' : 'eye'" :size="17" />
              </button>
            </div>
          </div>

          <!-- Submit -->
          <button type="submit" :disabled="loading"
            class="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1 disabled:opacity-50"
            style="background: linear-gradient(135deg, #38bdf8, #0284c7)">
            <AppIcon v-if="loading" name="loader" :size="16" class="animate-spin text-white" />
            <span class="text-white">{{ loading ? 'Masuk...' : 'Masuk' }}</span>
          </button>
        </form>
      </div>

      <p class="text-xs text-white/25 mt-8">Hubungi admin untuk mendapatkan akun</p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { login } = useAuth()
const router = useRouter()
const email = ref(''), password = ref(''), loading = ref(false), showPass = ref(false), errorMsg = ref('')

const handleLogin = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e: unknown) {
    const code = (e as { code?: string })?.code
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(code || ''))
      errorMsg.value = 'Email atau password salah.'
    else if (code === 'auth/too-many-requests')
      errorMsg.value = 'Terlalu banyak percobaan. Coba lagi nanti.'
    else errorMsg.value = 'Gagal masuk. Periksa koneksi internet.'
  } finally { loading.value = false }
}
</script>
