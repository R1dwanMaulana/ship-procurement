<template>
  <div class="p-4 space-y-4">
    <div class="flex items-center justify-between pt-1">
      <div>
        <h1 class="text-base font-semibold">Notifikasi</h1>
        <p class="text-xs text-muted-foreground">{{ unreadCount > 0 ? `${unreadCount} belum dibaca` : 'Semua dibaca' }}</p>
      </div>
      <Button v-if="unreadCount > 0" variant="ghost" size="sm" class="text-xs" @click="markAllRead">
        Tandai semua
      </Button>
    </div>

    <div v-if="notifications.length === 0" class="py-16 text-center">
      <AppIcon name="bell" :size="28" class="text-muted-foreground/30 mx-auto mb-2" />
      <p class="text-sm text-muted-foreground">Tidak ada notifikasi</p>
    </div>

    <div v-else class="space-y-1">
      <div v-for="notif in notifications" :key="notif.id"
        :class="['rounded-lg border transition-colors',
          !notif.dibaca ? 'border-border bg-secondary' : 'border-transparent bg-transparent']">
        <div class="px-3 py-3 flex items-start gap-3">
          <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
            :class="!notif.dibaca ? 'bg-foreground' : 'bg-transparent'" />
          <div class="flex-1 min-w-0">
            <p :class="['text-sm leading-snug', !notif.dibaca ? 'font-medium' : 'text-muted-foreground']">
              {{ notif.pesan }}
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">{{ notif.waktu }}</p>
          </div>
        </div>
        <!-- Reminder actions -->
        <div v-if="notif.type === 'reminder' && notif.poId" class="px-3 pb-3 flex gap-2 pl-7">
          <NuxtLink :to="`/pengajuan?highlight=${notif.poId}`" @click="markOneRead(notif.id)">
            <Button variant="outline" size="sm" class="gap-1 text-xs h-7">
              <AppIcon name="list" :size="11" /> Lihat Pengajuan
            </Button>
          </NuxtLink>
          <NuxtLink to="/laporan" @click="markOneRead(notif.id)">
            <Button variant="ghost" size="sm" class="gap-1 text-xs h-7 text-muted-foreground">
              <AppIcon name="chart" :size="11" /> Laporan
            </Button>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { notifications, unreadCount, markAllRead, markOneRead } = useStore()
</script>
