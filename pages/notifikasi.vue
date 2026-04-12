<template>
  <div class="p-4 space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between pt-1">
      <div>
        <h1 class="text-base font-semibold text-gray-800">Notifikasi</h1>
        <p class="text-xs text-gray-400 mt-0.5">{{ unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua sudah dibaca' }}</p>
      </div>
      <button v-if="unreadCount > 0" @click="markAllRead"
        class="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50">
        Tandai semua
      </button>
    </div>

    <!-- Empty -->
    <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
      <div class="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        <AppIcon name="bell" :size="24" class="text-gray-300" />
      </div>
      <p class="text-sm font-medium text-gray-400">Tidak ada notifikasi</p>
      <p class="text-xs text-gray-300 mt-1">Semua aktivitas akan muncul di sini</p>
    </div>

    <!-- List -->
    <div v-else class="space-y-2">
      <div v-for="notif in notifications" :key="notif.id"
        :class="['rounded-2xl overflow-hidden border transition-all',
          notif.type === 'reminder'
            ? 'border-orange-200 bg-orange-50'
            : !notif.dibaca
              ? 'border-blue-100 bg-blue-50/50'
              : 'border-gray-100 bg-white']">

        <div class="p-4 flex items-start gap-3">
          <!-- Icon -->
          <div :class="['w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
            notif.type === 'reminder' ? 'bg-orange-100' : !notif.dibaca ? 'bg-blue-100' : 'bg-gray-100']">
            <AppIcon
              :name="notif.type === 'reminder' ? 'alert' : 'bell'"
              :size="15"
              :class="notif.type === 'reminder' ? 'text-orange-500' : !notif.dibaca ? 'text-blue-500' : 'text-gray-400'" />
          </div>

          <div class="flex-1 min-w-0">
            <p :class="['text-sm leading-snug',
              notif.type === 'reminder' ? 'text-orange-800 font-medium' :
              !notif.dibaca ? 'text-gray-800 font-medium' : 'text-gray-600']">
              {{ notif.pesan }}
            </p>
            <p class="text-xs text-gray-400 mt-1">{{ notif.waktu }}</p>
          </div>

          <!-- Unread dot -->
          <div v-if="!notif.dibaca && notif.type !== 'reminder'"
            class="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5">
          </div>
        </div>

        <!-- Action untuk reminder -->
        <div v-if="notif.type === 'reminder' && notif.poId"
          class="px-4 pb-3 flex items-center gap-2">
          <NuxtLink
            :to="`/pengajuan?highlight=${notif.poId}`"
            @click="markOneRead(notif.id)"
            class="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-100 hover:bg-orange-200 px-3 py-1.5 rounded-lg transition-colors">
            <AppIcon name="list" :size="12" />
            Lihat Pengajuan
          </NuxtLink>
          <NuxtLink
            to="/laporan"
            @click="markOneRead(notif.id)"
            class="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors">
            <AppIcon name="chart" :size="12" />
            Laporan
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { notifications, unreadCount, markAllRead, markOneRead } = useStore()
</script>
