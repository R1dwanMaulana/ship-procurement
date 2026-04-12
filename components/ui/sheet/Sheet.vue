<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex flex-col justify-end">
        <div class="absolute inset-0 bg-black/50" @click="$emit('update:modelValue', false)" />
        <div
          :class="cn('relative bg-background rounded-t-xl w-full max-w-md mx-auto border border-border shadow-lg', props.class)"
          @click.stop>
          <div class="flex justify-center pt-3 pb-2">
            <div class="w-8 h-1 bg-muted-foreground/20 rounded-full" />
          </div>
          <div class="overflow-y-auto max-h-[85vh] px-4 pb-8 space-y-4">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'
const props = defineProps<{ modelValue: boolean; class?: string }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<style scoped>
.sheet-enter-active { transition: opacity 0.2s ease; }
.sheet-leave-active { transition: opacity 0.15s ease; }
.sheet-enter-active .relative { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-leave-active .relative { transition: transform 0.2s ease-in; }
.sheet-enter-from { opacity: 0; }
.sheet-enter-from .relative { transform: translateY(100%); }
.sheet-leave-to { opacity: 0; }
.sheet-leave-to .relative { transform: translateY(100%); }
</style>
