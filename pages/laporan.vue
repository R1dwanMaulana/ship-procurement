<template>
  <div class="p-4 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between pt-1">
      <div>
        <h1 class="text-base font-semibold text-gray-800">Laporan</h1>
        <p class="text-xs text-gray-400 mt-0.5">{{ filteredPO.length }} dari {{ poList.length }} PO</p>
      </div>
      <!-- Export buttons -->
      <div class="flex gap-1.5">
        <button @click="doExportCSV"
          class="flex items-center gap-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
          <AppIcon name="download" :size="13" /> CSV
        </button>
        <button @click="doExportPDF"
          class="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
          <AppIcon name="file" :size="13" /> PDF
        </button>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="space-y-2">
      <!-- Search -->
      <div class="relative">
        <AppIcon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" class="field-input pl-9 text-sm"
          placeholder="Cari no. PO, SPB, nama kapal, barang..." />
      </div>

      <!-- Filter row -->
      <div class="flex gap-2 overflow-x-auto pb-0.5">
        <!-- Status filter -->
        <select v-model="filterStatus"
          class="flex-shrink-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-blue-400">
          <option value="">Semua Status</option>
          <option value="diajukan">Diajukan</option>
          <option value="divalidasi">Divalidasi</option>
          <option value="dikirim">Dikirim</option>
          <option value="tiba">Tiba</option>
          <option value="dikonfirmasi">Dikonfirmasi</option>
          <option value="selesai">Selesai</option>
        </select>

        <!-- Kapal filter -->
        <select v-model="filterKapal"
          class="flex-shrink-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-blue-400">
          <option value="">Semua Kapal</option>
          <option v-for="kapal in kapalList" :key="kapal" :value="kapal">{{ kapal }}</option>
        </select>

        <!-- Instalasi filter -->
        <select v-model="filterInstalasi"
          class="flex-shrink-0 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-blue-400">
          <option value="">Semua Instalasi</option>
          <option value="belum">Ada Belum Pasang</option>
          <option value="selesai">Semua Terpasang</option>
        </select>

        <!-- Reset -->
        <button v-if="hasFilter" @click="resetFilter"
          class="flex-shrink-0 flex items-center gap-1 text-xs text-red-500 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
          <AppIcon name="x" :size="12" /> Reset
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-2">
      <div class="bg-white rounded-xl border border-slate-200 p-3 text-center">
        <p class="text-xl font-bold text-slate-800">{{ poList.length }}</p>
        <p class="text-xs text-slate-400 mt-0.5">Total</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-3 text-center">
        <p class="text-xl font-bold text-emerald-500">{{ stats.selesai }}</p>
        <p class="text-xs text-slate-400 mt-0.5">Selesai</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-3 text-center">
        <p class="text-xl font-bold text-blue-500">{{ stats.dikirim + stats.diajukan }}</p>
        <p class="text-xs text-slate-400 mt-0.5">Proses</p>
      </div>
      <div class="bg-white rounded-xl border border-slate-200 p-3 text-center">
        <p class="text-xl font-bold text-red-500">{{ stats.belumPasang }}</p>
        <p class="text-xs text-slate-400 mt-0.5">Belum</p>
      </div>
    </div>

    <!-- Reminder -->
    <div v-if="belumPasangPO.length > 0" class="alert-danger space-y-3">
      <div class="flex items-start gap-2">
        <AppIcon name="alert" :size="15" class="text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p class="font-semibold text-red-700 text-sm">{{ belumPasangPO.length }} PO belum dipasang</p>
          <p class="text-xs text-red-400 mt-0.5">Barang sudah tiba tapi belum diinstalasi</p>
        </div>
      </div>
      <div class="space-y-2">
        <div v-for="po in belumPasangPO" :key="po.id" class="bg-red-100 rounded-xl p-3 space-y-1.5">
          <div class="flex items-center justify-between flex-wrap gap-1">
            <div>
              <p class="font-semibold text-red-800 text-sm">{{ po.noPO || po.noSPB || '-' }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="po.noSPB" class="text-xs text-amber-700 font-medium">{{ po.noSPB }}</span>
                <span v-if="po.namaKapal" class="text-xs text-blue-700 font-medium">{{ po.namaKapal }}</span>
              </div>
            </div>
            <span class="text-xs text-red-500">Tiba: {{ po.tanggalTiba }}</span>
          </div>
          <div class="space-y-1">
            <div v-for="item in po.items.filter(i => i.statusInstalasi !== 'terpasang')" :key="item.nama"
              class="flex items-center gap-2 text-xs text-red-700">
              <AppIcon name="x" :size="11" class="text-red-400" />
              <span class="font-medium">{{ item.nama }}</span>
              <span class="text-red-400">×{{ item.qty }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredPO.length === 0" class="text-center py-12">
      <AppIcon name="search" :size="36" class="text-slate-200 mx-auto mb-3" />
      <p class="text-sm text-slate-400">Tidak ada hasil</p>
      <button @click="resetFilter" class="text-xs text-blue-500 mt-2 underline">Reset filter</button>
    </div>

    <!-- PO List -->
    <div class="space-y-3">
      <div v-for="po in filteredPO" :key="po.id" class="card space-y-3">

        <!-- Header -->
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-semibold text-slate-800 text-sm">{{ po.noPO || 'Belum ada No. PO' }}</p>
            <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1">
              <span v-if="po.noSPB" class="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <AppIcon name="file" :size="11" /> {{ po.noSPB }}
              </span>
              <span v-if="po.namaKapal" class="flex items-center gap-1 text-xs text-blue-600 font-medium">
                <AppIcon name="ship" :size="11" /> {{ po.namaKapal }}
              </span>
            </div>
          </div>
          <span :class="['status-pill', statusColor(po.status)]">{{ statusLabel(po.status) }}</span>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-1.5 text-xs">
          <div class="bg-slate-50 rounded-lg p-2">
            <p class="text-slate-400">Pengajuan</p>
            <p class="font-medium text-slate-700 mt-0.5">{{ po.tanggalPengajuan }}</p>
          </div>
          <div v-if="po.lokasiDocking" class="bg-slate-50 rounded-lg p-2">
            <p class="text-slate-400">Docking</p>
            <p class="font-medium text-slate-700 mt-0.5">{{ po.lokasiDocking }}</p>
          </div>
          <div v-if="po.noTracking" class="bg-slate-50 rounded-lg p-2">
            <p class="text-slate-400">Tracking</p>
            <p class="font-medium text-slate-700 mt-0.5">{{ po.noTracking }}</p>
          </div>
          <div v-if="po.tanggalTiba" class="bg-slate-50 rounded-lg p-2">
            <p class="text-slate-400">Tiba</p>
            <p class="font-medium text-slate-700 mt-0.5">{{ po.tanggalTiba }}</p>
          </div>
        </div>

        <!-- Progress instalasi -->
        <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'">
          <div class="flex justify-between text-xs text-slate-400 mb-1">
            <span>Instalasi</span>
            <span>{{ po.items.filter(i => i.statusInstalasi === 'terpasang').length }}/{{ po.items.length }}</span>
          </div>
          <div class="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-emerald-500 rounded-full transition-all"
              :style="{ width: `${(po.items.filter(i => i.statusInstalasi === 'terpasang').length / po.items.length) * 100}%` }">
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="space-y-2">
          <div v-for="(item, idx) in po.items" :key="idx"
            :class="['rounded-xl p-3 space-y-1.5 border',
              item.statusInstalasi === 'terpasang' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-transparent']">
            <div class="flex items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <div :class="['w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0',
                  item.statusInstalasi === 'terpasang' ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300']">
                  <AppIcon v-if="item.statusInstalasi === 'terpasang'" name="check" :size="10" />
                </div>
                <p :class="['font-medium text-sm', item.statusInstalasi === 'terpasang' ? 'text-slate-500 line-through' : 'text-slate-800']">
                  {{ item.nama }}
                </p>
              </div>
              <span :class="['text-xs px-2 py-0.5 rounded-full font-medium', urgensiColor(item.urgensi)]">{{ item.urgensi }}</span>
            </div>
            <p class="text-xs text-slate-400 pl-6">Qty: {{ item.qty }} · {{ item.spesifikasi }}</p>
            <div v-if="item.statusInstalasi === 'terpasang'" class="pl-6 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-emerald-600">
              <span v-if="item.lokasiPasang" class="flex items-center gap-1"><AppIcon name="pin" :size="10" />{{ item.lokasiPasang }}</span>
              <span v-if="item.teknisi" class="flex items-center gap-1"><AppIcon name="user" :size="10" />{{ item.teknisi }}</span>
              <span v-if="item.tanggalDipasang" class="flex items-center gap-1"><AppIcon name="calendar" :size="10" />{{ item.tanggalDipasang }}</span>
            </div>
            <!-- Foto bukti -->
            <div v-if="item.fotoBukti" class="pl-6 mt-1">
              <a :href="item.fotoBukti" target="_blank">
                <img :src="item.fotoBukti" class="w-full h-28 object-cover rounded-lg border border-emerald-200" />
                <p class="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <AppIcon name="camera" :size="10" /> Foto bukti pemasangan
                </p>
              </a>
            </div>
          </div>
        </div>

        <div v-if="po.catatanPurchasing" class="alert-info flex items-start gap-2 py-2.5">
          <AppIcon name="info" :size="13" class="text-blue-500 flex-shrink-0 mt-0.5" />
          <p class="text-xs text-blue-700">{{ po.catatanPurchasing }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, stats, statusLabel, statusColor, urgensiColor } = useStore()
const { exportCSV, exportPDF } = useExport()

const role = computed(() => userProfile.value?.role ?? 'kapal')

// Filter state
const search = ref('')
const filterStatus = ref<StatusPO | ''>('')
const filterKapal = ref('')
const filterInstalasi = ref('')

const hasFilter = computed(() => search.value || filterStatus.value || filterKapal.value || filterInstalasi.value)
const resetFilter = () => { search.value = ''; filterStatus.value = ''; filterKapal.value = ''; filterInstalasi.value = '' }

// Unique kapal list
const kapalList = computed(() => [...new Set(poList.value.map(p => p.namaKapal).filter(Boolean))] as string[])

// Filtered list
const filteredPO = computed(() => {
  let list = poList.value

  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(po =>
      (po.noPO || '').toLowerCase().includes(q) ||
      (po.noSPB || '').toLowerCase().includes(q) ||
      (po.namaKapal || '').toLowerCase().includes(q) ||
      (po.noTracking || '').toLowerCase().includes(q) ||
      po.items.some(i => i.nama.toLowerCase().includes(q))
    )
  }

  if (filterStatus.value) {
    list = list.filter(po => po.status === filterStatus.value)
  }

  if (filterKapal.value) {
    list = list.filter(po => po.namaKapal === filterKapal.value)
  }

  if (filterInstalasi.value === 'belum') {
    list = list.filter(po => po.items.some(i => i.statusInstalasi !== 'terpasang'))
  } else if (filterInstalasi.value === 'selesai') {
    list = list.filter(po => po.items.every(i => i.statusInstalasi === 'terpasang'))
  }

  return list
})

const belumPasangPO = computed(() =>
  poList.value.filter(po => po.status === 'dikonfirmasi' && po.items.some(i => i.statusInstalasi !== 'terpasang'))
)

const filterLabel = computed(() => {
  const parts = []
  if (filterKapal.value) parts.push(filterKapal.value)
  if (filterStatus.value) parts.push(filterStatus.value)
  if (search.value) parts.push(`"${search.value}"`)
  return parts.length ? parts.join(', ') : 'Semua PO'
})

const doExportCSV = () => exportCSV(filteredPO.value, 'laporan-po')
const doExportPDF = () => exportPDF(filteredPO.value, filterLabel.value)
</script>
