<template>
  <div class="p-4 space-y-5">
    <div>
      <h1 class="text-lg font-semibold text-slate-800">Tracking Pengiriman</h1>
      <p class="text-xs text-slate-400 mt-0.5">Pantau status real-time</p>
    </div>

    <div class="relative">
      <AppIcon name="search" :size="16" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input v-model="search" class="field-input pl-10" placeholder="Cari no. PO, SPB, atau tracking..." />
    </div>

    <!-- Active Shipments -->
    <div v-if="inTransit.length > 0">
      <p class="section-title">Dalam Pengiriman</p>
      <div class="space-y-3">
        <div v-for="po in inTransit" :key="po.id" class="card space-y-4">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-slate-800">{{ po.noPO || 'Belum ada No. PO' }}</p>
              <div class="flex flex-wrap items-center gap-x-2 mt-0.5">
                <span v-if="po.noSPB" class="text-xs text-amber-600 font-medium">{{ po.noSPB }}</span>
                <span v-if="po.namaKapal" class="text-xs text-blue-600 font-medium">{{ po.namaKapal }}</span>
                <span class="text-xs text-slate-400">{{ po.noTracking }}</span>
              </div>
            </div>
            <span :class="['status-pill', statusColor(po.status)]">{{ statusLabel(po.status) }}</span>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span v-for="item in po.items" :key="item.nama"
              class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{{ item.nama }} ×{{ item.qty }}</span>
          </div>

          <div>
            <div class="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>Surabaya</span>
              <span>{{ po.lokasiDocking || 'Tujuan' }}</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div :class="['h-full rounded-full transition-all duration-700', progressColor(po.status)]"
                :style="{ width: progressWidth(po.status) }"></div>
            </div>
            <p class="text-xs text-center mt-1.5 font-medium"
              :class="po.status === 'tiba' ? 'text-emerald-600' : 'text-blue-500'">
              {{ progressLabel(po.status) }}
            </p>
          </div>

          <button v-if="role === 'purchasing' && po.status === 'dikirim'" @click="tandaiTiba(po.id)" class="btn btn-warning w-full">
            <AppIcon name="package" :size="16" /> Tandai Tiba di Pelabuhan
          </button>
          <button v-if="role === 'kapal' && po.status === 'tiba'" @click="konfirmasiTerima(po.id)" class="btn btn-primary w-full">
            <AppIcon name="check" :size="16" /> Konfirmasi Penerimaan
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!search" class="card text-center py-10">
      <AppIcon name="truck" :size="36" class="text-slate-200 mx-auto mb-2" />
      <p class="text-sm text-slate-400">Tidak ada pengiriman aktif</p>
    </div>

    <!-- All PO -->
    <div>
      <p class="section-title">Semua PO</p>
      <div class="space-y-2">
        <div v-for="po in filteredAll" :key="po.id" class="card space-y-3">
          <div class="flex items-center gap-3">
            <div :class="['w-2.5 h-2.5 rounded-full flex-shrink-0', dotColor(po.status)]"></div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm text-slate-800 truncate">{{ po.noPO || po.noSPB || po.id.slice(0,10) }}</p>
              <div class="flex flex-wrap items-center gap-x-2 mt-0.5">
                <span v-if="po.noSPB" class="text-xs text-amber-600">{{ po.noSPB }}</span>
                <span v-if="po.namaKapal" class="text-xs text-blue-600">{{ po.namaKapal }}</span>
                <span class="text-xs text-slate-400">{{ po.items.length }} barang · {{ po.tanggalPengajuan }}</span>
              </div>
            </div>
            <span :class="['status-pill flex-shrink-0', statusColor(po.status)]">{{ statusLabel(po.status) }}</span>
          </div>

          <!-- Timeline -->
          <div class="flex items-center gap-1 overflow-x-auto pb-0.5">
            <div v-for="(step, i) in timelineSteps" :key="i" class="flex items-center gap-1 flex-shrink-0">
              <div :class="['w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold',
                isStepDone(po.status, step.status) ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400']">
                <AppIcon v-if="isStepDone(po.status, step.status)" name="check" :size="12" />
                <span v-else class="text-xs">{{ i + 1 }}</span>
              </div>
              <div v-if="i < timelineSteps.length - 1"
                :class="['w-4 h-0.5 rounded-full', isStepDone(po.status, step.status) ? 'bg-emerald-400' : 'bg-slate-200']">
              </div>
            </div>
          </div>

          <div v-if="po.status === 'dikonfirmasi' && po.items.some(i => i.statusInstalasi !== 'terpasang')"
            class="alert-warning flex items-center gap-2 py-2.5">
            <AppIcon name="alert" :size="14" class="text-amber-500 flex-shrink-0" />
            <p class="text-xs text-amber-700 font-medium">
              {{ po.items.filter(i => i.statusInstalasi !== 'terpasang').length }} barang belum dipasang
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, updatePO, statusLabel, statusColor } = useStore()
const route = useRoute()
const search = ref((route.query.id as string) || '')
const role = computed(() => userProfile.value?.role ?? 'kapal')

const statusOrder: StatusPO[] = ['diajukan', 'divalidasi', 'dikirim', 'tiba', 'dikonfirmasi', 'selesai']
const timelineSteps = statusOrder.map(s => ({ status: s }))
const isStepDone = (current: StatusPO, step: StatusPO) => statusOrder.indexOf(current) >= statusOrder.indexOf(step)

const inTransit = computed(() => poList.value.filter(p => ['dikirim', 'tiba'].includes(p.status)))
const filteredAll = computed(() => {
  if (!search.value) return poList.value
  const q = search.value.toLowerCase()
  return poList.value.filter(p =>
    (p.noPO || '').toLowerCase().includes(q) || (p.noSPB || '').toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) || (p.noTracking || '').toLowerCase().includes(q) ||
    p.items.some(i => i.nama.toLowerCase().includes(q))
  )
})

const progressWidth = (s: StatusPO) => ({ dikirim: '55%', tiba: '100%' } as any)[s] || '0%'
const progressColor = (s: StatusPO) => s === 'tiba' ? 'bg-emerald-500' : 'bg-blue-500 animate-pulse'
const progressLabel = (s: StatusPO) => s === 'dikirim' ? 'Dalam perjalanan...' : s === 'tiba' ? 'Tiba di pelabuhan!' : ''
const dotColor = (s: StatusPO) => {
  if (s === 'selesai') return 'bg-emerald-500'
  if (['dikirim','tiba','dikonfirmasi'].includes(s)) return 'bg-blue-500'
  if (s === 'diajukan') return 'bg-amber-400'
  return 'bg-slate-300'
}

const tandaiTiba = async (id: string) => await updatePO(id, { status: 'tiba', tanggalTiba: new Date().toISOString().split('T')[0] } as any)
const konfirmasiTerima = async (id: string) => {
  const po = poList.value.find(p => p.id === id)
  if (!po) return
  await updatePO(id, { status: 'dikonfirmasi', items: po.items.map(i => ({ ...i, statusInstalasi: 'belum' as const })) } as any)
}
</script>
