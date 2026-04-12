<template>
  <div class="p-4 space-y-5">
    <!-- Header -->
    <div :class="['rounded-2xl p-5 text-white', role === 'kapal' ? 'bg-blue-600' : 'bg-emerald-600']">
      <p class="text-sm opacity-80">Selamat datang,</p>
      <h1 class="text-xl font-bold mt-0.5">{{ userProfile?.nama }}</h1>
      <p class="text-xs opacity-70 mt-1">{{ today }}</p>
    </div>

    <!-- Alert belum pasang -->
    <div v-if="role === 'purchasing' && stats.belumPasang > 0" class="alert-danger">
      <div class="flex items-start gap-3">
        <AppIcon name="alert" :size="18" class="text-red-500 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="font-semibold text-red-700 text-sm">{{ stats.belumPasang }} PO belum dipasang</p>
          <p class="text-xs text-red-500 mt-0.5">Barang sudah tiba tapi belum diinstalasi</p>
        </div>
        <NuxtLink to="/laporan" class="text-xs font-semibold text-red-600 underline whitespace-nowrap">Lihat</NuxtLink>
      </div>
    </div>

    <!-- Stats -->
    <div>
      <p class="section-title">Ringkasan</p>
      <div class="grid grid-cols-2 gap-3">
        <div class="card-flat text-center py-4">
          <p class="text-3xl font-bold text-amber-500">{{ stats.diajukan }}</p>
          <p class="text-xs text-slate-500 mt-1">Menunggu Validasi</p>
        </div>
        <div class="card-flat text-center py-4">
          <p class="text-3xl font-bold text-violet-500">{{ stats.dikirim }}</p>
          <p class="text-xs text-slate-500 mt-1">Dalam Pengiriman</p>
        </div>
        <div class="card-flat text-center py-4">
          <p class="text-3xl font-bold text-orange-500">{{ stats.tiba + stats.dikonfirmasi }}</p>
          <p class="text-xs text-slate-500 mt-1">Tiba di Pelabuhan</p>
        </div>
        <div class="card-flat text-center py-4">
          <p class="text-3xl font-bold text-emerald-500">{{ stats.selesai }}</p>
          <p class="text-xs text-slate-500 mt-1">Selesai</p>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div>
      <p class="section-title">Aksi Cepat</p>
      <div class="space-y-2">
        <template v-if="role === 'kapal'">
          <NuxtLink to="/pengajuan/buat" class="card flex items-center gap-3 active:bg-slate-50">
            <div class="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
              <AppIcon name="file" :size="18" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm text-slate-800">Buat Pengajuan PO</p>
              <p class="text-xs text-slate-400">Ajukan beberapa barang sekaligus</p>
            </div>
            <AppIcon name="chevronRight" :size="16" class="text-slate-300" />
          </NuxtLink>
          <NuxtLink to="/tracking" class="card flex items-center gap-3 active:bg-slate-50">
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0">
              <AppIcon name="map" :size="18" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm text-slate-800">Pantau Pengiriman</p>
              <p class="text-xs text-slate-400">Status barang real-time</p>
            </div>
            <AppIcon name="chevronRight" :size="16" class="text-slate-300" />
          </NuxtLink>
        </template>
        <template v-else>
          <NuxtLink to="/pengajuan" class="card flex items-center gap-3 active:bg-slate-50">
            <div class="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 flex-shrink-0">
              <AppIcon name="check" :size="18" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm text-slate-800">Validasi Pengajuan</p>
              <p class="text-xs text-slate-400">{{ stats.diajukan }} PO menunggu</p>
            </div>
            <AppIcon name="chevronRight" :size="16" class="text-slate-300" />
          </NuxtLink>
          <NuxtLink to="/tracking" class="card flex items-center gap-3 active:bg-slate-50">
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 flex-shrink-0">
              <AppIcon name="truck" :size="18" />
            </div>
            <div class="flex-1">
              <p class="font-semibold text-sm text-slate-800">Update Pengiriman</p>
              <p class="text-xs text-slate-400">Input tracking & status tiba</p>
            </div>
            <AppIcon name="chevronRight" :size="16" class="text-slate-300" />
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- Recent PO -->
    <div>
      <p class="section-title">PO Terbaru</p>
      <div v-if="loadingPO" class="text-center py-8 text-slate-400 text-sm">Memuat...</div>
      <div v-else class="space-y-2">
        <div v-for="po in recentPO" :key="po.id" class="card space-y-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="font-semibold text-sm text-slate-800">{{ po.noPO || po.noSPB || 'Pengajuan baru' }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ po.namaKapal }} · {{ po.items.length }} barang</p>
            </div>
            <span :class="['status-pill', statusColor(po.status)]">{{ statusLabel(po.status) }}</span>
          </div>
          <div class="flex flex-wrap gap-1">
            <span v-for="item in po.items.slice(0,3)" :key="item.nama"
              class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">{{ item.nama }}</span>
            <span v-if="po.items.length > 3" class="text-xs text-slate-400 px-2 py-0.5">+{{ po.items.length - 3 }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { userProfile } = useAuth()
const { poList, loadingPO, stats, statusLabel, statusColor } = useStore()
const role = computed(() => userProfile.value?.role ?? 'kapal')
const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const recentPO = computed(() => poList.value.slice(0, 4))
</script>
