<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-slate-800">Pengajuan PO</h1>
      <NuxtLink v-if="role === 'kapal'" to="/pengajuan/buat" class="btn btn-primary btn-sm gap-1.5">
        <AppIcon name="plus" :size="14" /> Buat PO
      </NuxtLink>
    </div>

    <!-- Search -->
    <div class="relative">
      <AppIcon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input v-model="search" class="field-input pl-9 text-sm" placeholder="Cari no. PO, SPB, kapal, barang..." />
    </div>

    <!-- Filter Tabs -->
    <div class="flex gap-2 overflow-x-auto pb-1">
      <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
        :class="['flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all',
          activeTab === tab.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500']">
        {{ tab.label }}
        <span v-if="tab.count > 0" :class="['ml-1 text-xs px-1.5 rounded-full', activeTab === tab.value ? 'bg-white/20' : 'bg-slate-100 text-slate-500']">{{ tab.count }}</span>
      </button>
    </div>

    <div v-if="loadingPO" class="text-center py-12 text-slate-400 text-sm">Memuat data...</div>

    <div v-else-if="filteredList.length === 0" class="text-center py-12">
      <AppIcon name="file" :size="40" class="text-slate-200 mx-auto mb-3" />
      <p class="text-sm text-slate-400">Tidak ada pengajuan</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="po in filteredList" :key="po.id"
        :id="`po-${po.id}`"
        :class="['card space-y-4 transition-all duration-300',
          highlightId === po.id ? 'ring-2 ring-orange-400 ring-offset-1' : '']">

        <!-- PO Header -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-slate-800">{{ po.noPO || 'Belum ada No. PO' }}</p>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              <span v-if="po.noSPB" class="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AppIcon name="file" :size="12" /> {{ po.noSPB }}
              </span>
              <span v-if="po.namaKapal" class="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <AppIcon name="ship" :size="12" /> {{ po.namaKapal }}
              </span>
              <span class="text-xs text-slate-400">{{ po.tanggalPengajuan }}</span>
            </div>
          </div>
          <span :class="['status-pill flex-shrink-0', statusColor(po.status)]">{{ statusLabel(po.status) }}</span>
        </div>

        <!-- Info chips -->
        <div v-if="po.lokasiDocking || po.noTracking || po.tanggalTiba" class="flex flex-wrap gap-2">
          <span v-if="po.lokasiDocking" class="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
            <AppIcon name="pin" :size="11" /> {{ po.lokasiDocking }}
          </span>
          <span v-if="po.noTracking" class="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
            <AppIcon name="truck" :size="11" /> {{ po.noTracking }}
          </span>
          <span v-if="po.tanggalTiba" class="flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
            <AppIcon name="calendar" :size="11" /> Tiba: {{ po.tanggalTiba }}
          </span>
        </div>

        <!-- Items Checklist -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium text-slate-400">{{ po.items.length }} Barang</p>
            <span v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="text-xs text-slate-400">
              {{ po.items.filter(i => i.statusInstalasi === 'terpasang').length }}/{{ po.items.length }} terpasang
            </span>
          </div>

          <!-- Progress bar -->
          <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all duration-500"
              :style="{ width: `${(po.items.filter(i => i.statusInstalasi === 'terpasang').length / po.items.length) * 100}%` }">
            </div>
          </div>

          <div v-for="(item, idx) in po.items" :key="idx"
            :class="['rounded-xl p-3 border transition-all',
              (po.status === 'dikonfirmasi' || po.status === 'selesai')
                ? item.statusInstalasi === 'terpasang' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'
                : 'bg-slate-50 border-transparent']">
            <div class="flex items-start gap-2.5">
              <!-- Checkbox -->
              <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="flex-shrink-0 mt-0.5">
                <div :class="['w-5 h-5 rounded-md border-2 flex items-center justify-center',
                  item.statusInstalasi === 'terpasang' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300']">
                  <AppIcon v-if="item.statusInstalasi === 'terpasang'" name="check" :size="11" />
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <p :class="['text-sm font-medium', item.statusInstalasi === 'terpasang' ? 'line-through text-slate-400' : 'text-slate-800']">
                    {{ item.nama }}
                  </p>
                  <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', urgensiColor(item.urgensi)]">
                    {{ item.urgensi }}
                  </span>
                </div>
                <p class="text-xs text-slate-400 mt-0.5">Qty: {{ item.qty }} · {{ item.spesifikasi }}</p>
                <div v-if="item.statusInstalasi === 'terpasang'" class="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-emerald-600">
                  <span v-if="item.lokasiPasang" class="flex items-center gap-1"><AppIcon name="pin" :size="11" />{{ item.lokasiPasang }}</span>
                  <span v-if="item.teknisi" class="flex items-center gap-1"><AppIcon name="user" :size="11" />{{ item.teknisi }}</span>
                  <span v-if="item.tanggalDipasang" class="flex items-center gap-1"><AppIcon name="calendar" :size="11" />{{ item.tanggalDipasang }}</span>
                </div>
                <!-- Foto bukti -->
                <div v-if="item.fotoBukti" class="mt-2">
                  <a :href="item.fotoBukti" target="_blank" class="block">
                    <img :src="item.fotoBukti" class="w-full h-28 object-cover rounded-lg border border-emerald-200" />
                    <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <AppIcon name="camera" :size="11" /> Lihat foto bukti
                    </p>
                  </a>
                </div>
              </div>
              <button v-if="role === 'kapal' && (po.status === 'dikonfirmasi' || po.status === 'selesai') && item.statusInstalasi !== 'terpasang'"
                @click="openPasangModal(po.id, idx, item.nama)"
                class="flex-shrink-0 btn btn-success btn-sm gap-1">
                <AppIcon name="tool" :size="13" /> Pasang
              </button>
            </div>
          </div>
        </div>

        <!-- Catatan purchasing -->
        <div v-if="po.catatanPurchasing" class="alert-info flex items-start gap-2">
          <AppIcon name="info" :size="14" class="text-blue-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-blue-700">{{ po.catatanPurchasing }}</p>
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          <template v-if="role === 'kapal'">
            <button v-if="po.status === 'tiba'" @click="konfirmasiTerima(po.id)" class="btn btn-primary btn-sm flex-1">
              <AppIcon name="check" :size="14" /> Konfirmasi Terima
            </button>
          </template>
          <template v-if="role === 'purchasing'">
            <button v-if="po.status === 'diajukan'" @click="openValidasiModal(po)" class="btn btn-success btn-sm flex-1">
              <AppIcon name="check" :size="14" /> Validasi & Proses
            </button>
            <button v-if="po.status === 'divalidasi'" @click="openKirimModal(po)" class="btn btn-primary btn-sm flex-1">
              <AppIcon name="truck" :size="14" /> Input Pengiriman
            </button>
            <button v-if="po.status === 'dikirim'" @click="tandaiTiba(po.id)" class="btn btn-warning btn-sm flex-1">
              <AppIcon name="package" :size="14" /> Tandai Tiba
            </button>
            <button v-if="po.status === 'selesai'" @click="closingPO(po.id)" class="btn btn-ghost btn-sm">
              <AppIcon name="file" :size="14" /> Closing PO
            </button>
          </template>
          <NuxtLink :to="`/tracking?id=${po.id}`" class="btn btn-outline btn-sm">
            <AppIcon name="map" :size="14" /> Tracking
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- MODAL VALIDASI -->
    <Teleport to="body">
      <div v-if="showValidasiModal" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" @click.self="showValidasiModal = false">
        <div class="bg-white rounded-t-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
          <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 bg-slate-200 rounded-full"></div></div>
          <div class="px-5 pb-10 space-y-4">
            <h3 class="font-semibold text-slate-800 text-lg">Validasi Pengajuan</h3>
            <div class="bg-slate-50 rounded-xl p-3 space-y-1">
              <div class="flex items-center gap-2 text-sm">
                <span class="text-amber-600 font-medium">{{ selectedPO?.noSPB }}</span>
                <span class="text-slate-300">·</span>
                <span class="text-blue-600 font-medium">{{ selectedPO?.namaKapal }}</span>
              </div>
              <p class="text-xs text-slate-400">{{ selectedPO?.items.length }} barang · {{ selectedPO?.tanggalPengajuan }}</p>
            </div>
            <div>
              <label class="field-label">Nomor PO <span class="text-red-400 normal-case">*</span></label>
              <input v-model="formValidasi.noPO" class="field-input" placeholder="PO-2026-XXX" />
            </div>
            <div>
              <label class="field-label">Lokasi Docking <span class="text-red-400 normal-case">*</span></label>
              <select v-model="formValidasi.lokasiDocking" class="field-input">
                <option value="">Pilih lokasi</option>
                <option>Cilegon</option><option>Semarang</option><option>Surabaya</option><option>Batam</option>
              </select>
            </div>
            <div>
              <label class="field-label">Catatan</label>
              <textarea v-model="formValidasi.catatan" class="field-input resize-none" rows="3" placeholder="Catatan untuk pihak kapal..."></textarea>
            </div>
            <div class="flex gap-2 pt-1">
              <button @click="showValidasiModal = false" class="btn btn-ghost flex-1">Batal</button>
              <button @click="submitValidasi" :disabled="!formValidasi.noPO || !formValidasi.lokasiDocking" class="btn btn-success flex-1 disabled:opacity-40">
                <AppIcon name="check" :size="16" /> Validasi
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL KIRIM -->
    <Teleport to="body">
      <div v-if="showKirimModal" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" @click.self="showKirimModal = false">
        <div class="bg-white rounded-t-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
          <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 bg-slate-200 rounded-full"></div></div>
          <div class="px-5 pb-10 space-y-4">
            <h3 class="font-semibold text-slate-800 text-lg">Input Pengiriman</h3>
            <p class="text-sm text-slate-500">{{ selectedPO?.noPO }} · {{ selectedPO?.lokasiDocking }}</p>
            <div>
              <label class="field-label">Nomor Tracking <span class="text-red-400 normal-case">*</span></label>
              <input v-model="formKirim.noTracking" class="field-input" placeholder="TRK-2026-XXX" />
            </div>
            <div class="flex gap-2 pt-1">
              <button @click="showKirimModal = false" class="btn btn-ghost flex-1">Batal</button>
              <button @click="submitKirim" :disabled="!formKirim.noTracking" class="btn btn-primary flex-1 disabled:opacity-40">
                <AppIcon name="truck" :size="16" /> Kirim
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- MODAL PASANG -->
    <Teleport to="body">
      <div v-if="showPasangModal" class="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" @click.self="showPasangModal = false">
        <div class="bg-white rounded-t-2xl w-full max-w-md overflow-y-auto max-h-[90vh]">
          <div class="flex justify-center pt-3 pb-1"><div class="w-10 h-1 bg-slate-200 rounded-full"></div></div>
          <div class="px-5 pb-10 space-y-4">
            <h3 class="font-semibold text-slate-800 text-lg">Catat Pemasangan</h3>
            <div class="bg-slate-50 rounded-xl p-3">
              <p class="font-medium text-slate-800 text-sm">{{ pasangTarget.namaBarang }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ pasangTarget.noSPB }} · {{ pasangTarget.namaKapal }}</p>
            </div>
            <div>
              <label class="field-label">Lokasi Pemasangan <span class="text-red-400 normal-case">*</span></label>
              <input v-model="formPasang.lokasi" class="field-input" placeholder="Ruang Mesin Deck 2" />
            </div>
            <div>
              <label class="field-label">Nama Teknisi <span class="text-red-400 normal-case">*</span></label>
              <input v-model="formPasang.teknisi" class="field-input" placeholder="Nama teknisi" />
            </div>
            <!-- Foto Bukti -->
            <div>
              <label class="field-label">Foto Bukti Pemasangan</label>
              <div v-if="!fotoPreview"
                class="border-2 border-dashed border-slate-200 rounded-xl p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all"
                @click="triggerFotoInput">
                <AppIcon name="camera" :size="24" class="text-slate-300 mx-auto mb-2" />
                <p class="text-sm text-slate-400">Tap untuk ambil / pilih foto</p>
                <p class="text-xs text-slate-300 mt-0.5">JPG, PNG maks 5MB</p>
              </div>
              <div v-else class="relative rounded-xl overflow-hidden">
                <img :src="fotoPreview" class="w-full h-48 object-cover rounded-xl" />
                <button @click="clearFoto"
                  class="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70">
                  <AppIcon name="x" :size="14" />
                </button>
                <div class="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                  Foto terpilih
                </div>
              </div>
              <input ref="fotoInputRef" type="file" accept="image/*" capture="environment"
                class="hidden" @change="onFotoChange" />
            </div>
            <div class="flex gap-2 pt-1">
              <button @click="showPasangModal = false" class="btn btn-ghost flex-1">Batal</button>
              <button @click="submitPasang" :disabled="!formPasang.lokasi || !formPasang.teknisi || uploadingFoto" class="btn btn-success flex-1 disabled:opacity-40">
                <AppIcon v-if="uploadingFoto" name="loader" :size="14" class="animate-spin" />
                <AppIcon v-else name="tool" :size="14" />
                {{ uploadingFoto ? 'Mengupload...' : 'Konfirmasi' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { PengajuanPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, loadingPO, updatePO, updateItemInstalasi, statusLabel, statusColor, urgensiColor } = useStore()
const { uploadFoto } = useStorage()
const role = computed(() => userProfile.value?.role ?? 'kapal')
const route = useRoute()
const highlightId = computed(() => route.query.highlight as string || '')
const activeTab = ref('semua')
const search = ref('')

// Auto-scroll ke PO yang di-highlight dari notifikasi
onMounted(() => {
  if (highlightId.value) {
    activeTab.value = 'semua'
    nextTick(() => {
      const el = document.getElementById(`po-${highlightId.value}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
})

const tabs = computed(() => [
  { value: 'semua', label: 'Semua', count: poList.value.length },
  { value: 'diajukan', label: 'Diajukan', count: poList.value.filter(p => p.status === 'diajukan').length },
  { value: 'proses', label: 'Diproses', count: poList.value.filter(p => ['divalidasi','dikirim'].includes(p.status)).length },
  { value: 'tiba', label: 'Tiba', count: poList.value.filter(p => ['tiba','dikonfirmasi'].includes(p.status)).length },
  { value: 'selesai', label: 'Selesai', count: poList.value.filter(p => p.status === 'selesai').length },
])

const filteredList = computed(() => {
  let list = poList.value

  // Search filter
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(po =>
      (po.noPO || '').toLowerCase().includes(q) ||
      (po.noSPB || '').toLowerCase().includes(q) ||
      (po.namaKapal || '').toLowerCase().includes(q) ||
      po.items.some(i => i.nama.toLowerCase().includes(q))
    )
  }

  if (activeTab.value === 'semua') return list
  if (activeTab.value === 'proses') return list.filter(p => ['divalidasi','dikirim'].includes(p.status))
  if (activeTab.value === 'tiba') return list.filter(p => ['tiba','dikonfirmasi'].includes(p.status))
  if (activeTab.value === 'selesai') return list.filter(p => p.status === 'selesai')
  return list.filter(p => p.status === activeTab.value)
})

const selectedPO = ref<PengajuanPO | null>(null)
const showValidasiModal = ref(false), showKirimModal = ref(false), showPasangModal = ref(false)
const formValidasi = ref({ noPO: '', lokasiDocking: '', catatan: '' })
const formKirim = ref({ noTracking: '' })
const formPasang = ref({ lokasi: '', teknisi: '' })
const pasangTarget = ref({ poId: '', itemIndex: 0, namaBarang: '', noSPB: '', namaKapal: '' })

// Foto bukti
const fotoInputRef = ref<HTMLInputElement | null>(null)
const fotoFile = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)
const uploadingFoto = ref(false)

const triggerFotoInput = () => fotoInputRef.value?.click()
const onFotoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fotoFile.value = file
  fotoPreview.value = URL.createObjectURL(file)
}
const clearFoto = () => {
  fotoFile.value = null
  fotoPreview.value = null
  if (fotoInputRef.value) fotoInputRef.value.value = ''
}

const openValidasiModal = (po: PengajuanPO) => {
  selectedPO.value = po
  formValidasi.value = { noPO: `PO-2026-${String(poList.value.length + 1).padStart(3,'0')}`, lokasiDocking: '', catatan: '' }
  showValidasiModal.value = true
}
const openKirimModal = (po: PengajuanPO) => {
  selectedPO.value = po
  formKirim.value = { noTracking: `TRK-${po.id.slice(-4).toUpperCase()}-SBY` }
  showKirimModal.value = true
}
const openPasangModal = (poId: string, itemIndex: number, namaBarang: string) => {
  const po = poList.value.find(p => p.id === poId)
  pasangTarget.value = { poId, itemIndex, namaBarang, noSPB: po?.noSPB || '', namaKapal: po?.namaKapal || '' }
  formPasang.value = { lokasi: '', teknisi: '' }
  clearFoto()
  showPasangModal.value = true
}

const submitValidasi = async () => {
  if (!selectedPO.value) return
  await updatePO(selectedPO.value.id, { status: 'divalidasi', noPO: formValidasi.value.noPO, lokasiDocking: formValidasi.value.lokasiDocking, catatanPurchasing: formValidasi.value.catatan } as any)
  showValidasiModal.value = false
}
const submitKirim = async () => {
  if (!selectedPO.value) return
  await updatePO(selectedPO.value.id, { status: 'dikirim', noTracking: formKirim.value.noTracking } as any)
  showKirimModal.value = false
}
const tandaiTiba = async (id: string) => {
  await updatePO(id, { status: 'tiba', tanggalTiba: new Date().toISOString().split('T')[0] } as any)
}
const konfirmasiTerima = async (id: string) => {
  const po = poList.value.find(p => p.id === id)
  if (!po) return
  await updatePO(id, { status: 'dikonfirmasi', items: po.items.map(i => ({ ...i, statusInstalasi: 'belum' as const })), tanggalTiba: new Date().toISOString().split('T')[0] } as any)
}
const submitPasang = async () => {
  uploadingFoto.value = true
  try {
    let fotoBuktiUrl: string | undefined
    if (fotoFile.value) {
      fotoBuktiUrl = await uploadFoto(fotoFile.value, pasangTarget.value.poId, pasangTarget.value.itemIndex)
    }
    await updateItemInstalasi(pasangTarget.value.poId, pasangTarget.value.itemIndex, {
      lokasiPasang: formPasang.value.lokasi,
      teknisi: formPasang.value.teknisi,
      fotoBukti: fotoBuktiUrl,
    })
    showPasangModal.value = false
    clearFoto()
  } finally {
    uploadingFoto.value = false
  }
}
const closingPO = async (id: string) => { await updatePO(id, { status: 'selesai' } as any) }
</script>
