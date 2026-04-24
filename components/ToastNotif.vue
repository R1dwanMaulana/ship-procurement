<template>
  <Teleport to="body">
    <div class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-[100] px-3 pt-safe pointer-events-none"
      style="padding-top: max(env(safe-area-inset-top, 0px), 12px)">
      <TransitionGroup name="toast" tag="div" class="space-y-2">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-sm px-4 py-3 shadow-lg"
          @click="dismiss(toast.id)"
        >
          <!-- Icon -->
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', iconBg(toast.type)]">
            <AppIcon :name="iconName(toast.type)" :size="15" :class="iconColor(toast.type)" />
          </div>
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold leading-tight">{{ toast.title }}</p>
            <p v-if="toast.body" class="text-xs text-muted-foreground mt-0.5 leading-snug">{{ toast.body }}</p>
          </div>
          <!-- Close -->
          <button class="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
            <AppIcon name="x" :size="14" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '~/composables/useToast'

const { toasts, dismiss } = useToast()

const iconName = (type?: string) => {
  if (type === 'success') return 'check'
  if (type === 'error') return 'alert'
  if (type === 'warning') return 'alert'
  return 'bell'
}

const iconBg = (type?: string) => {
  if (type === 'success') return 'bg-emerald-100 dark:bg-emerald-900/40'
  if (type === 'error') return 'bg-red-100 dark:bg-red-900/40'
  if (type === 'warning') return 'bg-amber-100 dark:bg-amber-900/40'
  return 'bg-secondary'
}

const iconColor = (type?: string) => {
  if (type === 'success') return 'text-emerald-600 dark:text-emerald-400'
  if (type === 'error') return 'text-red-600 dark:text-red-400'
  if (type === 'warning') return 'text-amber-600 dark:text-amber-400'
  return 'text-foreground'
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.25s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-100%) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-100%) scale(0.95);
}
.toast-move {
  transition: transform 0.3s ease;
}
</style>
