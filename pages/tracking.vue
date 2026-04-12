<template>
  <div class="p-4 space-y-5">
    <div>
      <h1 class="text-base font-semibold">Tracking</h1>
      <p class="text-xs text-muted-foreground mt-0.5">Pantau status pengiriman</p>
    </div>

    <div class="relative">
      <AppIcon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="search" class="pl-8 h-8 text-sm" placeholder="Cari no. PO, SPB, tracking..." />
    </div>

    <!-- Active -->
    <div v-if="inTransit.length > 0">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Dalam Pengiriman</p>
      <div class="space-y-3">
        <Card v-for="po in inTransit" :key="po.id" class="p-4 space-y-3">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-medium text-sm">{{ po.noSPB || 'Belum ada No. SPB' }}</p>
              <div class="flex flex-wrap items-center gap-x-2 mt-0.5 text-xs text-muted-foreground">
                <span v-if="po.namaKapal">{{ po.namaKapal }}</span>
                <span v-if="po.noTracking">{{ po.noTracking }}</span>
              </div>
            </div>
            <Badge :variant="po.status === 'tiba' ? 'default' : 'secondary'">{{ statusLabel(po.status) }}</Badge>
          </div>

          <div class="flex flex-wrap gap-1">
            <span v-for="item in po.items" :key="item.nama"
              class="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm">{{ item.nama }} ×{{ item.qty }}</span>
          </div>

          <div>
            <div class="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Surabaya</span>
              <span>{{ po.lokasiDocking || 'Tujuan' }}</span>
            </div>
            <div class="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div :class="['h-full bg-foreground rounded-full transition-all duration-700', po.status === 'dikirim' ? 'animate-pulse' : '']"
                :style="{ width: po.status === 'tiba' ? '100%' : '55%' }" />
            </div>
            <p class="text-xs text-muted-foreground text-center mt-1">
              {{ po.status === 'dikirim' ? 'Dalam perjalanan...' : 'Tiba di pelabuhan' }}
            </p>
          </div>

          <Button v-if="role === 'purchasing' && po.status === 'dikirim'" variant="outline" class="w-full gap-1.5" @click="tandaiTiba(po.id)">
            <AppIcon name="package" :size="14" /> Tandai Tiba di Pelabuhan
          </Button>
          <Button v-if="role === 'kapal' && po.status === 'tiba'" class="w-full gap-1.5" @click="konfirmasiTerima(po.id)">
            <AppIcon name="check" :size="14" /> Konfirmasi Penerimaan
          </Button>
        </Card>
      </div>
    </div>

    <Card v-else-if="!search" class="p-8 text-center">
      <AppIcon name="truck" :size="28" class="text-muted-foreground/30 mx-auto mb-2" />
      <p class="text-sm text-muted-foreground">Tidak ada pengiriman aktif</p>
    </Card>

    <!-- All PO -->
    <div>
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Semua PO</p>
      <div class="space-y-2">
        <Card v-for="po in filteredAll" :key="po.id" class="p-3 space-y-2">
          <div class="flex items-center gap-2">
            <div :class="['w-2 h-2 rounded-full flex-shrink-0', po.status === 'selesai' ? 'bg-foreground' : 'bg-muted-foreground/40']" />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-sm truncate">{{ po.noSPB || po.id.slice(0,10) }}</p>
              <div class="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                <span v-if="po.noSPB">{{ po.noSPB }}</span>
                <span v-if="po.namaKapal">{{ po.namaKapal }}</span>
                <span>{{ po.items.length }} barang · {{ po.tanggalPengajuan }}</span>
              </div>
            </div>
            <Badge :variant="po.status === 'selesai' ? 'outline' : 'secondary'" class="flex-shrink-0 text-xs">
              {{ statusLabel(po.status) }}
            </Badge>
          </div>

          <!-- Timeline dots -->
          <div class="flex items-center gap-1 pl-4">
            <div v-for="(step, i) in statusOrder" :key="step" class="flex items-center gap-1">
              <div :class="['w-1.5 h-1.5 rounded-full',
                statusOrder.indexOf(po.status) >= i ? 'bg-foreground' : 'bg-border']" />
              <div v-if="i < statusOrder.length - 1" :class="['w-3 h-px', statusOrder.indexOf(po.status) > i ? 'bg-foreground' : 'bg-border']" />
            </div>
          </div>

          <div v-if="po.status === 'dikonfirmasi' && po.items.some(i => i.statusInstalasi !== 'terpasang')"
            class="flex items-center gap-1.5 text-xs text-muted-foreground pl-4">
            <AppIcon name="alert" :size="12" />
            {{ po.items.filter(i => i.statusInstalasi !== 'terpasang').length }} barang belum dipasang
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, updatePO, statusLabel } = useStore()
const route = useRoute()
const search = ref((route.query.id as string) || '')
const role = computed(() => userProfile.value?.role ?? 'kapal')

const statusOrder: StatusPO[] = ['diajukan', 'divalidasi', 'dikirim', 'tiba', 'dikonfirmasi', 'selesai']
const inTransit = computed(() => poList.value.filter(p => ['dikirim', 'tiba'].includes(p.status)))
const filteredAll = computed(() => {
  if (!search.value) return poList.value
  const q = search.value.toLowerCase()
  return poList.value.filter(p =>
    (p.noSPB || '').toLowerCase().includes(q) ||
    p.id.toLowerCase().includes(q) || (p.noTracking || '').toLowerCase().includes(q) ||
    p.items.some(i => i.nama.toLowerCase().includes(q))
  )
})

const tandaiTiba = async (id: string) => await updatePO(id, { status: 'tiba', tanggalTiba: new Date().toISOString().split('T')[0] } as any)
const konfirmasiTerima = async (id: string) => {
  const po = poList.value.find(p => p.id === id)
  if (!po) return
  await updatePO(id, { status: 'dikonfirmasi', items: po.items.map(i => ({ ...i, statusInstalasi: 'belum' as const })) } as any)
}
</script>
