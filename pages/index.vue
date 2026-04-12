<template>
  <div class="p-4 space-y-6">

    <!-- Header greeting -->
    <div class="pt-1">
      <p class="text-xs text-muted-foreground">Selamat datang,</p>
      <h1 class="text-xl font-semibold tracking-tight mt-0.5">{{ userProfile?.nama }}</h1>
      <p class="text-xs text-muted-foreground mt-0.5">{{ today }}</p>
    </div>

    <!-- Alert belum pasang -->
    <div v-if="role === 'purchasing' && stats.belumPasang > 0"
      class="rounded-lg border border-border bg-secondary p-3 flex items-start gap-3">
      <AppIcon name="alert" :size="15" class="text-foreground flex-shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium">{{ stats.belumPasang }} PO belum dipasang</p>
        <p class="text-xs text-muted-foreground mt-0.5">Barang sudah tiba tapi belum diinstalasi</p>
      </div>
      <NuxtLink to="/laporan">
        <Button variant="outline" size="sm">Lihat</Button>
      </NuxtLink>
    </div>

    <!-- Stats -->
    <div>
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Ringkasan</p>
      <div class="grid grid-cols-2 gap-2">
        <Card class="p-4">
          <p class="text-2xl font-bold">{{ stats.diajukan }}</p>
          <p class="text-xs text-muted-foreground mt-1">Menunggu Validasi</p>
        </Card>
        <Card class="p-4">
          <p class="text-2xl font-bold">{{ stats.dikirim }}</p>
          <p class="text-xs text-muted-foreground mt-1">Dalam Pengiriman</p>
        </Card>
        <Card class="p-4">
          <p class="text-2xl font-bold">{{ stats.tiba + stats.dikonfirmasi }}</p>
          <p class="text-xs text-muted-foreground mt-1">Tiba di Pelabuhan</p>
        </Card>
        <Card class="p-4">
          <p class="text-2xl font-bold">{{ stats.selesai }}</p>
          <p class="text-xs text-muted-foreground mt-1">Selesai</p>
        </Card>
      </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Aksi Cepat</p>
      <div class="space-y-1">
        <template v-if="role === 'kapal'">
          <NuxtLink to="/pengajuan/buat"
            class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent transition-colors press">
            <AppIcon name="file" :size="16" class="text-muted-foreground flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium">Buat Pengajuan PO</p>
              <p class="text-xs text-muted-foreground">Ajukan beberapa barang sekaligus</p>
            </div>
            <AppIcon name="chevronRight" :size="14" class="text-muted-foreground" />
          </NuxtLink>
          <NuxtLink to="/tracking"
            class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent transition-colors press">
            <AppIcon name="map" :size="16" class="text-muted-foreground flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium">Pantau Pengiriman</p>
              <p class="text-xs text-muted-foreground">Status barang real-time</p>
            </div>
            <AppIcon name="chevronRight" :size="14" class="text-muted-foreground" />
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/pengajuan"
            class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent transition-colors press">
            <AppIcon name="check" :size="16" class="text-muted-foreground flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium">Validasi Pengajuan</p>
              <p class="text-xs text-muted-foreground">{{ stats.diajukan }} PO menunggu</p>
            </div>
            <AppIcon name="chevronRight" :size="14" class="text-muted-foreground" />
          </NuxtLink>
          <NuxtLink to="/tracking"
            class="flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-accent transition-colors press">
            <AppIcon name="truck" :size="16" class="text-muted-foreground flex-shrink-0" />
            <div class="flex-1">
              <p class="text-sm font-medium">Update Pengiriman</p>
              <p class="text-xs text-muted-foreground">Input tracking & status tiba</p>
            </div>
            <AppIcon name="chevronRight" :size="14" class="text-muted-foreground" />
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Recent PO -->
    <div>
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">PO Terbaru</p>
      <div v-if="loadingPO" class="text-center py-8 text-sm text-muted-foreground">Memuat...</div>
      <div v-else class="space-y-2">
        <Card v-for="po in recentPO" :key="po.id" class="p-4 space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <p class="text-sm font-medium truncate">{{ po.noSPB || 'Pengajuan baru' }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ po.namaKapal }} · {{ po.items.length }} barang</p>
            </div>
            <Badge :variant="statusVariant(po.status)">{{ statusLabel(po.status) }}</Badge>
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="item in po.items.slice(0,3)" :key="item.nama"
              class="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-sm">{{ item.nama }}</span>
            <span v-if="po.items.length > 3" class="text-xs text-muted-foreground">+{{ po.items.length - 3 }}</span>
          </div>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { StatusPO } from '~/composables/useStore'

const { userProfile } = useAuth()
const { poList, loadingPO, stats, statusLabel } = useStore()
const role = computed(() => userProfile.value?.role ?? 'kapal')
const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const recentPO = computed(() => poList.value.slice(0, 4))

const statusVariant = (status: StatusPO): any => {
  if (status === 'selesai') return 'outline'
  if (status === 'diajukan') return 'secondary'
  return 'secondary'
}
</script>
