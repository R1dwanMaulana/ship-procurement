<template>
  <div class="min-h-screen bg-background flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6">

      <!-- Logo -->
      <div class="text-center space-y-2">
        <div class="w-10 h-10 bg-primary rounded-lg flex items-center justify-center mx-auto">
          <AppIcon name="anchor" :size="20" class="text-primary-foreground" />
        </div>
        <h1 class="text-xl font-semibold tracking-tight">Ship Procurement</h1>
        <p class="text-sm text-muted-foreground">BSL & SPT</p>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <div v-if="errorMsg" class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2">
          <AppIcon name="alert" :size="14" class="flex-shrink-0" />
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-3">
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Email</label>
            <!-- type="text" bukan "email" untuk hindari browser/extension validation -->
            <input
              ref="emailInputRef"
              type="text"
              inputmode="email"
              autocomplete="email"
              autocorrect="off"
              autocapitalize="none"
              spellcheck="false"
              placeholder="email@example.com"
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
            />
          </div>
          <div class="space-y-1.5">
            <label class="text-sm font-medium">Password</label>
            <div class="relative">
              <input
                ref="passwordInputRef"
                :type="showPass ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="••••••••"
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
              />
              <button type="button" @click="showPass = !showPass"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <AppIcon :name="showPass ? 'eyeOff' : 'eye'" :size="16" />
              </button>
            </div>
          </div>
          <Button type="submit" class="w-full" :disabled="loading">
            <AppIcon v-if="loading" name="loader" :size="14" class="animate-spin" />
            {{ loading ? 'Masuk...' : 'Masuk' }}
          </Button>
        </form>
      </div>

      <p class="text-center text-xs text-muted-foreground">
        Hubungi admin untuk mendapatkan akun
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })
const { login } = useAuth()
const router = useRouter()
const { init: initTheme } = useTheme()

onMounted(() => initTheme())

const emailInputRef = ref<HTMLInputElement | null>(null)
const passwordInputRef = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const showPass = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  // Baca langsung dari DOM untuk bypass extension interference
  const emailVal = (emailInputRef.value?.value ?? '').trim()
  const passwordVal = passwordInputRef.value?.value ?? ''

  if (!emailVal) {
    errorMsg.value = 'Email tidak boleh kosong.'
    return
  }

  errorMsg.value = ''
  loading.value = true
  try {
    await login(emailVal, passwordVal)
    router.push('/')
  } catch (e: unknown) {
    console.error('Login error:', e)
    const code = (e as { code?: string })?.code
    if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(code || ''))
      errorMsg.value = 'Email atau password salah.'
    else if (code === 'auth/too-many-requests')
      errorMsg.value = 'Terlalu banyak percobaan.'
    else if (code === 'auth/network-request-failed')
      errorMsg.value = 'Tidak ada koneksi internet.'
    else if (code === 'auth/invalid-email')
      errorMsg.value = `Format email tidak valid. (${emailVal})`
    else
      errorMsg.value = `Error: ${code || 'unknown'}`
  } finally { loading.value = false }
}
</script>
