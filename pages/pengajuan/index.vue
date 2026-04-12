<template>
  <div class="p-4 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <h1 class="text-base font-semibold">Pengajuan PO</h1>
      <NuxtLink v-if="role === 'kapal'" to="/pengajuan/buat">
        <Button size="sm" class="gap-1.5">
          <AppIcon name="plus" :size="13" /> Buat PO
        </Button>
      </NuxtLink>
    </div>

    <!-- Search + Filter Kapal -->
    <div class="space-y-2">
      <div class="relative">
        <AppIcon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="search" class="pl-8 h-8 text-sm" placeholder="Cari SPB, kapal, barang..." />
      </div>
      <!-- Fitur 3: filter per kapal -->
      <div v-if="role === 'purchasing'" class="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <button @click="filterKapal = ''"
          :class="['flex-shrink-0 h-6 px-2.5 rounded-md text-xs transition-colors',
            filterKapal === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground']">
          Semua Kapal
        </button>
        <button v-for="kapal in kapalList" :key="kapal" @click="filterKapal = kapal"
          :class="['flex-shrink-0 h-6 px-2.5 rounded-md text-xs transition-colors',
            filterKapal === kapal ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground']">
          {{ kapal }}
        </button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
      <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
        :class="['flex-shrink-0 h-7 px-3 rounded-md text-xs font-medium transition-colors',
          activeTab === tab.value
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground hover:bg-accent hover:text-foreground']">
        {{ tab.label }}
        <span v-if="tab.count > 0" class="ml-1 opacity-70">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading / Empty -->
    <div v-if="loadingPO" class="py-12 text-center text-sm text-muted-foreground">Memuat...</div>
    <div v-else-if="filteredList.length === 0" class="py-12 text-center">
      <AppIcon name="file" :size="32" class="text-muted-foreground/30 mx-auto mb-2" />
      <p class="text-sm text-muted-foreground">Tidak ada pengajuan</p>
    </div>

    <!-- PO List -->
    <div v-else class="space-y-3">
      <Card v-for="po in filteredList" :key="po.id"
        :id="`po-${po.id}`"
        :class="['p-4 space-y-3', highlightId === po.id ? 'ring-1 ring-foreground' : '']">

        <!-- PO Header -->
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-medium text-sm">{{ po.noSPB || 'Belum ada No. SPB' }}</p>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span v-if="po.namaKapal" class="text-xs text-muted-foreground">{{ po.namaKapal }}</span>
              <span class="text-xs text-muted-foreground">{{ po.tanggalPengajuan }}</span>
            </div>
          </div>
          <Badge :variant="statusVariant(po.status)" class="flex-shrink-0 text-xs">{{ statusLabel(po.status) }}</Badge>
        </div>

        <!-- Info chips -->
        <div v-if="po.lokasiDocking || po.noTracking || po.tanggalTiba || po.estimasiTiba" class="flex flex-wrap gap-1.5">
          <span v-if="po.lokasiDocking" class="inline-flex items-center gap-1 text-xs border border-border rounded-sm px-2 py-0.5 text-muted-foreground">
            <AppIcon name="pin" :size="10" /> {{ po.lokasiDocking }}
          </span>
          <span v-if="po.noTracking" class="inline-flex items-center gap-1 text-xs border border-border rounded-sm px-2 py-0.5 text-muted-foreground">
            <AppIcon name="truck" :size="10" /> {{ po.noTracking }}
          </span>
          <span v-if="po.tanggalTiba" class="inline-flex items-center gap-1 text-xs border border-border rounded-sm px-2 py-0.5 text-muted-foreground">
            <AppIcon name="calendar" :size="10" /> Tiba: {{ po.tanggalTiba }}
          </span>
          <!-- Fitur 1: estimasi tiba -->
          <span v-if="po.estimasiTiba && !po.tanggalTiba" class="inline-flex items-center gap-1 text-xs border border-border rounded-sm px-2 py-0.5 text-muted-foreground">
            <AppIcon name="calendar" :size="10" /> Est. tiba: {{ po.estimasiTiba }}
          </span>
        </div>

        <!-- Items -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <p class="text-xs text-muted-foreground">{{ po.items.length }} barang</p>
            <span v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="text-xs text-muted-foreground">
              {{ po.items.filter(i => i.statusInstalasi === 'terpasang').length }}/{{ po.items.length }} terpasang
            </span>
          </div>

          <!-- Progress -->
          <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="h-1 bg-secondary rounded-full overflow-hidden">
            <div class="h-full bg-foreground rounded-full transition-all"
              :style="{ width: `${(po.items.filter(i => i.statusInstalasi === 'terpasang').length / po.items.length) * 100}%` }" />
          </div>

          <div v-for="(item, idx) in po.items" :key="idx"
            class="flex items-start gap-2.5 py-2 border-t border-border first:border-t-0">
            <!-- Checkbox -->
            <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'" class="flex-shrink-0 mt-0.5">
              <div :class="['w-4 h-4 rounded border flex items-center justify-center',
                item.statusInstalasi === 'terpasang' ? 'bg-foreground border-foreground' : 'border-border']">
                <AppIcon v-if="item.statusInstalasi === 'terpasang'" name="check" :size="10" class="text-background" />
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p :class="['text-sm', item.statusInstalasi === 'terpasang' ? 'line-through text-muted-foreground' : 'font-medium']">
                  {{ item.nama }}
                </p>
                <span class="text-xs text-muted-foreground">×{{ item.qty }}</span>
                <Badge variant="outline" class="text-xs py-0">{{ item.urgensi }}</Badge>
              </div>
              <p class="text-xs text-muted-foreground mt-0.5">{{ item.spesifikasi }}</p>
              <!-- Fitur 6: catatan per item -->
              <p v-if="item.catatan" class="text-xs text-muted-foreground mt-0.5 italic">{{ item.catatan }}</p>
              <div v-if="item.statusInstalasi === 'terpasang'" class="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                <span v-if="item.lokasiPasang" class="flex items-center gap-1"><AppIcon name="pin" :size="10" />{{ item.lokasiPasang }}</span>
                <span v-if="item.teknisi" class="flex items-center gap-1"><AppIcon name="user" :size="10" />{{ item.teknisi }}</span>
                <span v-if="item.tanggalDipasang" class="flex items-center gap-1"><AppIcon name="calendar" :size="10" />{{ item.tanggalDipasang }}</span>
              </div>
              <div v-if="item.fotoBukti" class="mt-1.5">
                <a :href="item.fotoBukti" target="_blank">
                  <img :src="item.fotoBukti" class="h-20 w-auto rounded border border-border object-cover" />
                </a>
              </div>
            </div>
            <Button v-if="role === 'kapal' && (po.status === 'dikonfirmasi' || po.status === 'selesai') && item.statusInstalasi !== 'terpasang'"
              variant="outline" size="sm" class="flex-shrink-0 gap-1 text-xs"
              @click="openPasangModal(po.id, idx, item.nama)">
              <AppIcon name="tool" :size="12" /> Pasang
            </Button>
          </div>
        </div>

        <!-- Catatan -->
        <div v-if="po.catatanPurchasing" class="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
          {{ po.catatanPurchasing }}
        </div>

        <!-- Actions -->
        <div class="flex flex-wrap gap-2 pt-1 border-t border-border">
          <template v-if="role === 'kapal'">
            <Button v-if="po.status === 'tiba'" size="sm" class="flex-1 gap-1" @click="askConfirm('terima', po.id)">
              <AppIcon name="check" :size="13" /> Konfirmasi Terima
            </Button>
          </template>
          <template v-if="role === 'purchasing'">
            <Button v-if="po.status === 'diajukan'" size="sm" class="flex-1 gap-1" @click="openValidasiModal(po)">
              <AppIcon name="check" :size="13" /> Validasi & Proses
            </Button>
            <Button v-if="po.status === 'divalidasi'" size="sm" class="flex-1 gap-1" @click="openKirimModal(po)">
              <AppIcon name="truck" :size="13" /> Input Pengiriman
            </Button>
            <Button v-if="po.status === 'dikirim'" variant="outline" size="sm" class="flex-1 gap-1" @click="askConfirm('tiba', po.id)">
              <AppIcon name="package" :size="13" /> Tandai Tiba
            </Button>
            <Button v-if="po.status === 'selesai'" variant="ghost" size="sm" class="gap-1" @click="askConfirm('closing', po.id)">
              <AppIcon name="file" :size="13" /> Closing PO
            </Button>
          </template>
          <!-- Fitur 5: history log -->
          <Button variant="ghost" size="sm" class="gap-1 text-muted-foreground" @click="openLog(po)">
            <AppIcon name="list" :size="13" /> Log
          </Button>
          <NuxtLink :to="`/tracking?id=${po.id}`">
            <Button variant="ghost" size="sm" class="gap-1 text-muted-foreground">
              <AppIcon name="map" :size="13" /> Tracking
            </Button>
          </NuxtLink>
        </div>
      </Card>
    </div>

    <!-- Sheet Validasi -->
    <Sheet v-model="showValidasiModal">
      <h3 class="font-semibold">Validasi Pengajuan</h3>
      <div class="rounded-md bg-secondary px-3 py-2 text-sm">
        <span class="font-medium">{{ selectedPO?.noSPB }}</span>
        <span class="text-muted-foreground"> · {{ selectedPO?.namaKapal }}</span>
        <p class="text-xs text-muted-foreground mt-0.5">{{ selectedPO?.items.length }} barang · {{ selectedPO?.tanggalPengajuan }}</p>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Lokasi Docking</label>
        <Select v-model="formValidasi.lokasiDocking">
          <option value="">Pilih lokasi</option>
          <option>Cilegon</option><option>Semarang</option><option>Surabaya</option><option>Batam</option>
        </Select>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Catatan</label>
        <Textarea v-model="formValidasi.catatan" :rows="3" placeholder="Catatan untuk pihak kapal..." />
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="showValidasiModal = false">Batal</Button>
        <Button class="flex-1 gap-1" :disabled="!formValidasi.lokasiDocking" @click="submitValidasi">
          <AppIcon name="check" :size="14" /> Validasi
        </Button>
      </div>
    </Sheet>

    <!-- Sheet Kirim -->
    <Sheet v-model="showKirimModal">
      <h3 class="font-semibold">Input Pengiriman</h3>
      <p class="text-sm text-muted-foreground">{{ selectedPO?.noSPB }} · {{ selectedPO?.lokasiDocking }}</p>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Nomor Tracking</label>
        <Input v-model="formKirim.noTracking" placeholder="TRK-2026-XXX" />
      </div>
      <!-- Fitur 1: estimasi tiba -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Estimasi Tiba <span class="text-muted-foreground font-normal">(opsional)</span></label>
        <Input v-model="formKirim.estimasiTiba" type="date" />
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="showKirimModal = false">Batal</Button>
        <Button class="flex-1 gap-1" :disabled="!formKirim.noTracking" @click="submitKirim">
          <AppIcon name="truck" :size="14" /> Kirim
        </Button>
      </div>
    </Sheet>

    <!-- Sheet Pasang -->
    <Sheet v-model="showPasangModal">
      <h3 class="font-semibold">Catat Pemasangan</h3>
      <div class="rounded-md bg-secondary px-3 py-2 text-sm">
        <p class="font-medium">{{ pasangTarget.namaBarang }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">{{ pasangTarget.noSPB }} · {{ pasangTarget.namaKapal }}</p>
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Lokasi Pemasangan</label>
        <Input v-model="formPasang.lokasi" placeholder="Ruang Mesin Deck 2" />
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Nama Teknisi</label>
        <Input v-model="formPasang.teknisi" placeholder="Nama teknisi" />
      </div>
      <!-- Fitur 6: catatan per item -->
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Catatan <span class="text-muted-foreground font-normal">(opsional)</span></label>
        <Input v-model="formPasang.catatan" placeholder="Catatan pemasangan..." />
      </div>
      <div class="space-y-1.5">
        <label class="text-sm font-medium">Foto Bukti <span class="text-muted-foreground font-normal">(opsional)</span></label>
        <div v-if="!fotoPreview"
          class="border border-dashed border-border rounded-md p-6 text-center cursor-pointer hover:bg-accent transition-colors"
          @click="triggerFotoInput">
          <AppIcon name="camera" :size="20" class="text-muted-foreground mx-auto mb-1.5" />
          <p class="text-sm text-muted-foreground">Tap untuk pilih foto</p>
        </div>
        <div v-else class="relative rounded-md overflow-hidden border border-border">
          <img :src="fotoPreview" class="w-full h-40 object-cover" />
          <button @click="clearFoto" class="absolute top-2 right-2 w-6 h-6 bg-background/80 rounded border border-border flex items-center justify-center">
            <AppIcon name="x" :size="12" />
          </button>
        </div>
        <input ref="fotoInputRef" type="file" accept="image/*" capture="environment" class="hidden" @change="onFotoChange" />
      </div>
      <div class="flex gap-2">
        <Button variant="outline" class="flex-1" @click="showPasangModal = false">Batal</Button>
        <Button class="flex-1 gap-1" :disabled="!formPasang.lokasi || !formPasang.teknisi || uploadingFoto" @click="submitPasang">
          <AppIcon v-if="uploadingFoto" name="loader" :size="13" class="animate-spin" />
          <AppIcon v-else name="tool" :size="13" />
          {{ uploadingFoto ? 'Upload...' : 'Konfirmasi' }}
        </Button>
      </div>
    </Sheet>

    <!-- Fitur 4: Confirm Dialogs -->
    <ConfirmDialog
      v-model="confirmState.show"
      :title="confirmState.title"
      :message="confirmState.message"
      :confirm-label="confirmState.label"
      @confirm="confirmState.action"
    />

    <!-- Fitur 5: Log Sheet -->
    <Sheet v-model="showLogModal">
      <h3 class="font-semibold">Riwayat Aktivitas</h3>
      <p class="text-xs text-muted-foreground">{{ logPO?.noSPB }} · {{ logPO?.namaKapal }}</p>
      <div v-if="!logPO?.log?.length" class="py-6 text-center text-sm text-muted-foreground">
        Belum ada riwayat
      </div>
      <div v-else class="space-y-3">
        <div v-for="(entry, i) in [...(logPO?.log || [])].reverse()" :key="i"
          class="flex gap-3">
          <div class="flex flex-col items-center">
            <div class="w-2 h-2 rounded-full bg-foreground mt-1 flex-shrink-0" />
            <div v-if="i < (logPO?.log?.length || 0) - 1" class="w-px flex-1 bg-border mt-1" />
          </div>
          <div class="pb-3 min-w-0">
            <p class="text-sm font-medium">{{ entry.aksi }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ entry.oleh }}</p>
            <p v-if="entry.detail" class="text-xs text-muted-foreground">{{ entry.detail }}</p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ formatWaktu(entry.waktu) }}</p>
          </div>
        </div>
      </div>
    </Sheet>
  </div>
</template>

<script setup lang="ts">
import type { PengajuanPO, StatusPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, loadingPO, updatePO, updateItemInstalasi, statusLabel } = useStore()
const { uploadFoto } = useStorage()
const role = computed(() => userProfile.value?.role ?? 'kapal')
const route = useRoute()
const highlightId = computed(() => route.query.highlight as string || '')
const activeTab = ref('semua')
const search = ref('')
const filterKapal = ref('')  // Fitur 3

const statusVariant = (status: StatusPO): any =>
  status === 'selesai' ? 'outline' : 'secondary'

// Fitur 3: unique kapal list
const kapalList = computed(() => {
  const set = new Set(poList.value.map(p => p.namaKapal).filter(Boolean) as string[])
  return Array.from(set)
})

onMounted(() => {
  if (highlightId.value) {
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
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(po =>
      (po.noSPB || '').toLowerCase().includes(q) ||
      (po.namaKapal || '').toLowerCase().includes(q) || po.items.some(i => i.nama.toLowerCase().includes(q))
    )
  }
  // Fitur 3: filter kapal
  if (filterKapal.value) list = list.filter(po => po.namaKapal === filterKapal.value)
  if (activeTab.value === 'semua') return list
  if (activeTab.value === 'proses') return list.filter(p => ['divalidasi','dikirim'].includes(p.status))
  if (activeTab.value === 'tiba') return list.filter(p => ['tiba','dikonfirmasi'].includes(p.status))
  if (activeTab.value === 'selesai') return list.filter(p => p.status === 'selesai')
  return list.filter(p => p.status === activeTab.value)
})

const selectedPO = ref<PengajuanPO | null>(null)
const showValidasiModal = ref(false), showKirimModal = ref(false), showPasangModal = ref(false)
const showLogModal = ref(false)
const logPO = ref<PengajuanPO | null>(null)
const formValidasi = ref({ lokasiDocking: '', catatan: '' })
const formKirim = ref({ noTracking: '', estimasiTiba: '' })  // Fitur 1
const formPasang = ref({ lokasi: '', teknisi: '', catatan: '' })  // Fitur 6
const pasangTarget = ref({ poId: '', itemIndex: 0, namaBarang: '', noSPB: '', namaKapal: '' })
const fotoInputRef = ref<HTMLInputElement | null>(null)
const fotoFile = ref<File | null>(null)
const fotoPreview = ref<string | null>(null)
const uploadingFoto = ref(false)

// Fitur 4: confirm dialog state
const confirmState = ref({
  show: false,
  title: '',
  message: '',
  label: '',
  action: () => {},
})

const askConfirm = (type: string, id: string) => {
  const configs: Record<string, { title: string; message: string; label: string; action: () => void }> = {
    terima: {
      title: 'Konfirmasi Penerimaan',
      message: 'Pastikan barang sudah diterima dan sesuai dengan SPB.',
      label: 'Ya, Konfirmasi',
      action: () => konfirmasiTerima(id),
    },
    tiba: {
      title: 'Tandai Tiba di Pelabuhan?',
      message: 'Status akan berubah ke "Tiba di Pelabuhan" dan kapal akan dinotifikasi.',
      label: 'Tandai Tiba',
      action: () => tandaiTiba(id),
    },
    closing: {
      title: 'Closing PO?',
      message: 'PO akan ditutup dan tidak bisa diubah lagi.',
      label: 'Closing',
      action: () => closingPO(id),
    },
  }
  const cfg = configs[type]
  if (!cfg) return
  confirmState.value = { show: true, ...cfg }
}

// Fitur 5: open log
const openLog = (po: PengajuanPO) => {
  logPO.value = po
  showLogModal.value = true
}

const formatWaktu = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

const triggerFotoInput = () => fotoInputRef.value?.click()
const onFotoChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  fotoFile.value = file
  fotoPreview.value = URL.createObjectURL(file)
}
const clearFoto = () => {
  fotoFile.value = null; fotoPreview.value = null
  if (fotoInputRef.value) fotoInputRef.value.value = ''
}

const openValidasiModal = (po: PengajuanPO) => {
  selectedPO.value = po
  formValidasi.value = { lokasiDocking: '', catatan: '' }
  showValidasiModal.value = true
}
const openKirimModal = (po: PengajuanPO) => {
  selectedPO.value = po
  formKirim.value = { noTracking: `TRK-${po.id.slice(-4).toUpperCase()}-SBY`, estimasiTiba: '' }
  showKirimModal.value = true
}
const openPasangModal = (poId: string, itemIndex: number, namaBarang: string) => {
  const po = poList.value.find(p => p.id === poId)
  pasangTarget.value = { poId, itemIndex, namaBarang, noSPB: po?.noSPB || '', namaKapal: po?.namaKapal || '' }
  formPasang.value = { lokasi: '', teknisi: '', catatan: '' }
  clearFoto()
  showPasangModal.value = true
}

const submitValidasi = async () => {
  if (!selectedPO.value) return
  await updatePO(selectedPO.value.id, {
    status: 'divalidasi',
    lokasiDocking: formValidasi.value.lokasiDocking,
    catatanPurchasing: formValidasi.value.catatan,
  } as any, { aksi: 'Divalidasi', oleh: userProfile.value?.nama || 'Purchasing', detail: `Docking: ${formValidasi.value.lokasiDocking}` })
  showValidasiModal.value = false
}
const submitKirim = async () => {
  if (!selectedPO.value) return
  await updatePO(selectedPO.value.id, {
    status: 'dikirim',
    noTracking: formKirim.value.noTracking,
    ...(formKirim.value.estimasiTiba ? { estimasiTiba: formKirim.value.estimasiTiba } : {}),
  } as any, { aksi: 'Dikirim', oleh: userProfile.value?.nama || 'Purchasing', detail: `Tracking: ${formKirim.value.noTracking}` })
  showKirimModal.value = false
}
const tandaiTiba = async (id: string) => {
  await updatePO(id, { status: 'tiba', tanggalTiba: new Date().toISOString().split('T')[0] } as any,
    { aksi: 'Tiba di pelabuhan', oleh: userProfile.value?.nama || 'Purchasing' })
}
const konfirmasiTerima = async (id: string) => {
  const po = poList.value.find(p => p.id === id)
  if (!po) return
  await updatePO(id, {
    status: 'dikonfirmasi',
    items: po.items.map(i => ({ ...i, statusInstalasi: 'belum' as const })),
    tanggalTiba: new Date().toISOString().split('T')[0],
  } as any, { aksi: 'Penerimaan dikonfirmasi', oleh: userProfile.value?.nama || 'Kapal' })
}
const submitPasang = async () => {
  uploadingFoto.value = true
  try {
    let fotoBuktiUrl: string | undefined
    if (fotoFile.value) fotoBuktiUrl = await uploadFoto(fotoFile.value, pasangTarget.value.poId, pasangTarget.value.itemIndex)
    await updateItemInstalasi(
      pasangTarget.value.poId,
      pasangTarget.value.itemIndex,
      { lokasiPasang: formPasang.value.lokasi, teknisi: formPasang.value.teknisi, fotoBukti: fotoBuktiUrl, catatan: formPasang.value.catatan },
      userProfile.value?.nama,
    )
    showPasangModal.value = false; clearFoto()
  } finally { uploadingFoto.value = false }
}
const closingPO = async (id: string) => {
  await updatePO(id, { status: 'selesai' } as any,
    { aksi: 'PO ditutup (closing)', oleh: userProfile.value?.nama || 'Purchasing' })
}
</script>
