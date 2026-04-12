<template>
  <div class="p-4 space-y-5">
    <!-- Header -->
    <div class="flex items-center gap-3">
      <NuxtLink to="/pengajuan"
        class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 active:bg-slate-200">
        <AppIcon name="chevronLeft" :size="18" />
      </NuxtLink>
      <div>
        <h1 class="text-lg font-semibold text-slate-800">Buat Pengajuan PO</h1>
        <p class="text-xs text-slate-400">{{ items.length }} barang ditambahkan</p>
      </div>
    </div>

    <div v-if="role !== 'kapal'" class="alert-warning flex items-center gap-2">
      <AppIcon name="alert" :size="16" class="text-amber-500" />
      <p class="text-sm text-amber-700">Hanya Pihak Kapal yang dapat membuat pengajuan.</p>
    </div>

    <template v-else>
      <!-- Identitas -->
      <div class="card space-y-4">
        <p class="section-title mb-0">Identitas Pengajuan</p>
        <div>
          <label class="field-label">No. SPB <span class="text-red-400 normal-case">*</span></label>
          <input v-model="noSPB" class="field-input" placeholder="SPB-2026-001" />
          <p class="text-xs text-slate-400 mt-1">Nomor Surat Permintaan Barang</p>
        </div>
        <div>
          <label class="field-label">Nama Kapal <span class="text-red-400 normal-case">*</span></label>
          <input v-model="namaKapal" class="field-input" placeholder="KM Nusantara Jaya" />
        </div>
      </div>

      <!-- Daftar Barang -->
      <div>
        <p class="section-title">Daftar Barang</p>

        <div v-if="items.length === 0"
          class="border-2 border-dashed border-slate-200 rounded-2xl text-center py-10">
          <AppIcon name="package" :size="32" class="text-slate-300 mx-auto mb-2" />
          <p class="text-sm text-slate-400">Belum ada barang</p>
        </div>

        <div class="space-y-3">
          <div v-for="(item, idx) in items" :key="idx" class="card space-y-3">
            <div class="flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-600">Barang #{{ idx + 1 }}</p>
              <button @click="removeItem(idx)"
                class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 active:bg-red-100">
                <AppIcon name="trash" :size="14" />
              </button>
            </div>

            <div>
              <label class="field-label">Nama Barang <span class="text-red-400 normal-case">*</span></label>
              <input v-model="item.nama" class="field-input" placeholder="Pompa Air Laut" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="field-label">Qty <span class="text-red-400 normal-case">*</span></label>
                <input v-model.number="item.qty" type="number" min="1" class="field-input" />
              </div>
              <div>
                <label class="field-label">Urgensi</label>
                <div class="flex gap-1.5">
                  <button v-for="u in urgensiOptions" :key="u.value" type="button"
                    @click="item.urgensi = u.value"
                    :class="['flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-all',
                      item.urgensi === u.value ? u.activeClass : 'border-slate-200 text-slate-400 bg-white']">
                    {{ u.label }}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label class="field-label">Spesifikasi <span class="text-red-400 normal-case">*</span></label>
              <textarea v-model="item.spesifikasi" class="field-input resize-none" rows="2"
                placeholder="Tipe, ukuran, kapasitas..."></textarea>
            </div>
          </div>
        </div>

        <button @click="addItem"
          class="mt-3 w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 text-sm font-medium hover:border-blue-300 hover:text-blue-500 active:bg-slate-50 flex items-center justify-center gap-2 transition-colors">
          <AppIcon name="plus" :size="16" />
          Tambah Barang
        </button>
      </div>

      <!-- Catatan -->
      <div>
        <label class="field-label">Catatan (opsional)</label>
        <textarea v-model="catatanKapal" class="field-input resize-none" rows="3"
          placeholder="Catatan untuk Tim Purchasing..."></textarea>
      </div>

      <!-- Summary -->
      <div v-if="items.length > 0" class="alert-info space-y-2">
        <p class="text-xs font-semibold text-blue-700">Ringkasan Pengajuan</p>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="text-slate-500">No. SPB</span>
            <span class="font-semibold text-slate-800">{{ noSPB || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Nama Kapal</span>
            <span class="font-semibold text-slate-800">{{ namaKapal || '-' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Total Barang</span>
            <span class="font-semibold text-slate-800">{{ items.length }} item</span>
          </div>
        </div>
      </div>

      <!-- Submit — inline, tidak fixed -->
      <button
        @click="submitForm"
        :disabled="!isValid || submitting"
        class="w-full btn btn-primary btn-lg justify-center disabled:opacity-40">
        <AppIcon v-if="submitting" name="loader" :size="18" class="animate-spin" />
        <AppIcon v-else name="send" :size="18" />
        <span>{{ submitting ? 'Mengirim...' : 'Kirim ke Purchasing' }}</span>
      </button>

      <!-- spacer agar tidak tertutup nav -->
      <div class="h-4"></div>
    </template>

    <Transition name="slide-up">
      <div v-if="showSuccess"
        class="fixed bottom-24 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-semibold z-50 flex items-center gap-2 whitespace-nowrap">
        <AppIcon name="check" :size="16" />
        Pengajuan berhasil dikirim!
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { ItemBarang } from '~/composables/useStore'

const { userProfile } = useAuth()
const { createPO, urgensiColor, urgensiIcon } = useStore()
const router = useRouter()

const role = computed(() => userProfile.value?.role ?? 'kapal')
const showSuccess = ref(false)
const submitting = ref(false)
const noSPB = ref('')
const namaKapal = ref('')
const catatanKapal = ref('')

const urgensiOptions = [
  { value: 'rendah' as const, label: 'Rendah', activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700' },
  { value: 'sedang' as const, label: 'Sedang', activeClass: 'border-amber-400 bg-amber-50 text-amber-700' },
  { value: 'tinggi' as const, label: 'Tinggi', activeClass: 'border-red-400 bg-red-50 text-red-700' },
]

const makeItem = (): ItemBarang => ({ nama: '', qty: 1, spesifikasi: '', urgensi: 'sedang', statusInstalasi: 'belum' })
const items = ref<ItemBarang[]>([makeItem()])
const addItem = () => items.value.push(makeItem())
const removeItem = (idx: number) => { if (items.value.length > 1) items.value.splice(idx, 1) }

const isValid = computed(() =>
  noSPB.value.trim() !== '' &&
  namaKapal.value.trim() !== '' &&
  items.value.length > 0 &&
  items.value.every(i => i.nama.trim() && i.qty > 0 && i.spesifikasi.trim())
)

const submitForm = async () => {
  if (!isValid.value) return
  submitting.value = true
  try {
    await createPO({ noSPB: noSPB.value.trim(), namaKapal: namaKapal.value.trim(), items: items.value, catatanKapal: catatanKapal.value, createdBy: userProfile.value?.uid })
    showSuccess.value = true
    setTimeout(() => router.push('/pengajuan'), 1500)
  } finally { submitting.value = false }
}
</script>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateX(-50%) translateY(16px); }
</style>
