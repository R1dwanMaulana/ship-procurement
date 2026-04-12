<template>
  <input
    :value="modelValue"
    :class="cn(
      'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'transition-colors',
      props.class
    )"
    v-bind="$attrs"
    @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>

<script setup lang="ts">
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  modelValue?: string | number
  class?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
