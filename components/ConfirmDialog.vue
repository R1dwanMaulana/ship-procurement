<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-center justify-center px-4">
        <div class="absolute inset-0 bg-black/50" @click="$emit('update:modelValue', false)" />
        <div class="relative bg-background border border-border rounded-xl shadow-lg w-full max-w-xs p-5 space-y-4">
          <div class="space-y-1">
            <p class="font-semibold text-sm">{{ title }}</p>
            <p class="text-xs text-muted-foreground">{{ message }}</p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" size="sm" @click="$emit('update:modelValue', false)">
              Batal
            </Button>
            <Button :variant="danger ? 'destructive' : 'default'" class="flex-1" size="sm" @click="confirm">
              {{ confirmLabel || 'Konfirmasi' }}
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: []
}>()

const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
