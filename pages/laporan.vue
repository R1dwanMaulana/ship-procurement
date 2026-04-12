<template>
  <div class="p-4 space-y-4">

    <div class="flex items-center justify-between pt-1">
      <div>
        <h1 class="text-base font-semibold">Laporan</h1>
        <p class="text-xs text-muted-foreground">{{ filteredPO.length }} dari {{ poList.length }} PO</p>
      </div>
      <div class="flex gap-1.5">
        <Button variant="outline" size="sm" class="gap-1 text-xs" @click="doExportCSV">
          <AppIcon name="download" :size="12" /> CSV
        </Button>
        <Button variant="outline" size="sm" class="gap-1 text-xs" @click="doExportPDF">
          <AppIcon name="file" :size="12" /> PDF
        </Button>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="space-y-2">
      <div class="relative">
        <AppIcon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input v-model="search" class="pl-8 h-8 text-sm" placeholder="Cari PO, SPB, kapal, barang..." />
      </div>
      <div class="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        <select v-model="filterStatus"
          class="flex-shrink-0 h-7 text-xs border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Semua Status</option>
          <option value="diajukan">Diajukan</option>
          <option value="divalidasi">Divalidasi</option>
          <option value="dikirim">Dikirim</option>
          <option value="tiba">Tiba</option>
          <option value="dikonfirmasi">Dikonfirmasi</option>
          <option value="selesai">Selesai</option>
        </select>
        <select v-model="filterKapal"
          class="flex-shrink-0 h-7 text-xs border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Semua Kapal</option>
          <option v-for="k in kapalList" :key="k" :value="k">{{ k }}</option>
        </select>
        <select v-model="filterInstalasi"
          class="flex-shrink-0 h-7 text-xs border border-input rounded-md px-2 bg-background focus:outline-none focus:ring-1 focus:ring-ring">
          <option value="">Semua Instalasi</option>
          <option value="belum">Ada Belum Pasang</option>
          <option value="selesai">Semua Terpasang</option>
        </select>
        <Button v-if="hasFilter" variant="ghost" size="sm" class="flex-shrink-0 h-7 gap-1 text-xs" @click="resetFilter">
          <AppIcon name="x" :size="11" /> Reset
        </Button>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-4 gap-2">
      <Card v-for="s in statCards" :key="s.label" class="p-3 text-center">
        <p class="text-lg font-bold">{{ s.value }}</p>
        <p class="text-xs text-muted-foreground mt-0.5">{{ s.label }}</p>
      </Card>
    </div>

    <!-- Reminder -->
    <div v-if="belumPasangPO.length > 0" class="rounded-md border border-border bg-secondary p-3 space-y-2">
      <div class="flex items-center gap-2">
        <AppIcon name="alert" :size="14" class="text-foreground flex-shrink-0" />
        <p class="text-sm font-medium">{{ belumPasangPO.length }} PO belum dipasang</p>
      </div>
      <div class="space-y-1.5">
        <div v-for="po in belumPasangPO" :key="po.id" class="text-xs text-muted-foreground pl-5 space-y-0.5">
          <p class="font-medium text-foreground">{{ po.noSPB }} · {{ po.namaKapal }}</p>
          <p v-for="item in po.items.filter(i => i.statusInstalasi !== 'terpasang')" :key="item.nama">
            — {{ item.nama }} ×{{ item.qty }}
          </p>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-if="filteredPO.length === 0" class="py-12 text-center">
      <AppIcon name="search" :size="28" class="text-muted-foreground/30 mx-auto mb-2" />
      <p class="text-sm text-muted-foreground">Tidak ada hasil</p>
      <button @click="resetFilter" class="text-xs text-foreground underline mt-1">Reset filter</button>
    </div>

    <!-- PO List -->
    <div class="space-y-3">
      <Card v-for="po in filteredPO" :key="po.id" class="p-4 space-y-3">
        <div class="flex items-start justify-between gap-2">
          <div>
            <p class="font-medium text-sm">{{ po.noSPB || 'Belum ada No. SPB' }}</p>
            <div class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground mt-0.5">
              <span v-if="po.namaKapal">{{ po.namaKapal }}</span>
            </div>
          </div>
          <Badge :variant="po.status === 'selesai' ? 'outline' : 'secondary'" class="text-xs">{{ statusLabel(po.status) }}</Badge>
        </div>

        <!-- Info -->
        <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div><span class="text-foreground font-medium">Pengajuan</span> · {{ po.tanggalPengajuan }}</div>
          <div v-if="po.lokasiDocking"><span class="text-foreground font-medium">Docking</span> · {{ po.lokasiDocking }}</div>
          <div v-if="po.noTracking"><span class="text-foreground font-medium">Tracking</span> · {{ po.noTracking }}</div>
          <div v-if="po.tanggalTiba"><span class="text-foreground font-medium">Tiba</span> · {{ po.tanggalTiba }}</div>
        </div>

        <!-- Progress -->
        <div v-if="po.status === 'dikonfirmasi' || po.status === 'selesai'">
          <div class="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Instalasi</span>
            <span>{{ po.items.filter(i => i.statusInstalasi === 'terpasang').length }}/{{ po.items.length }}</span>
          </div>
          <div class="h-1 bg-secondary rounded-full overflow-hidden">
            <div class="h-full bg-foreground rounded-full transition-all"
              :style="{ width: `${(po.items.filter(i => i.statusInstalasi === 'terpasang').length / po.items.length) * 100}%` }" />
          </div>
        </div>

        <!-- Items -->
        <div class="space-y-1.5">
          <div v-for="(item, idx) in po.items" :key="idx"
            class="flex items-start gap-2 py-1.5 border-t border-border first:border-t-0">
            <div :class="['w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5',
              item.statusInstalasi === 'terpasang' ? 'bg-foreground border-foreground' : 'border-border']">
              <AppIcon v-if="item.statusInstalasi === 'terpasang'" name="check" :size="9" class="text-background" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p :class="['text-sm', item.statusInstalasi === 'terpasang' ? 'line-through text-muted-foreground' : 'font-medium']">
                  {{ item.nama }}
                </p>
                <span class="text-xs text-muted-foreground">×{{ item.qty }}</span>
              </div>
              <p class="text-xs text-muted-foreground">{{ item.spesifikasi }}</p>
              <div v-if="item.statusInstalasi === 'terpasang'" class="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                <span v-if="item.lokasiPasang" class="flex items-center gap-1"><AppIcon name="pin" :size="10" />{{ item.lokasiPasang }}</span>
                <span v-if="item.teknisi" class="flex items-center gap-1"><AppIcon name="user" :size="10" />{{ item.teknisi }}</span>
                <span v-if="item.tanggalDipasang" class="flex items-center gap-1"><AppIcon name="calendar" :size="10" />{{ item.tanggalDipasang }}</span>
              </div>
              <div v-if="item.fotoBukti" class="mt-1.5">
                <a :href="item.fotoBukti" target="_blank">
                  <img :src="item.fotoBukti" class="h-16 w-auto rounded border border-border object-cover" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div v-if="po.catatanPurchasing" class="rounded-md bg-secondary px-3 py-2 text-xs text-muted-foreground">
          {{ po.catatanPurchasing }}
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusPO } from '~/composables/useStore'

const { poList, stats, statusLabel } = useStore()
const { exportCSV, exportPDF } = useExport()

const search = ref(''), filterStatus = ref<StatusPO | ''>(''), filterKapal = ref(''), filterInstalasi = ref('')
const hasFilter = computed(() => search.value || filterStatus.value || filterKapal.value || filterInstalasi.value)
const resetFilter = () => { search.value = ''; filterStatus.value = ''; filterKapal.value = ''; filterInstalasi.value = '' }
const kapalList = computed(() => [...new Set(poList.value.map(p => p.namaKapal).filter(Boolean))] as string[])

const statCards = computed(() => [
  { label: 'Total', value: poList.value.length },
  { label: 'Selesai', value: stats.value.selesai },
  { label: 'Proses', value: stats.value.dikirim + stats.value.diajukan },
  { label: 'Belum', value: stats.value.belumPasang },
])

const filteredPO = computed(() => {
  let list = poList.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(po =>
      (po.noSPB || '').toLowerCase().includes(q) ||
      (po.namaKapal || '').toLowerCase().includes(q) || (po.noTracking || '').toLowerCase().includes(q) ||
      po.items.some(i => i.nama.toLowerCase().includes(q))
    )
  }
  if (filterStatus.value) list = list.filter(po => po.status === filterStatus.value)
  if (filterKapal.value) list = list.filter(po => po.namaKapal === filterKapal.value)
  if (filterInstalasi.value === 'belum') list = list.filter(po => po.items.some(i => i.statusInstalasi !== 'terpasang'))
  else if (filterInstalasi.value === 'selesai') list = list.filter(po => po.items.every(i => i.statusInstalasi === 'terpasang'))
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
