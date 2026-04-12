<template>
  <div :class="cn('shrink-0 bg-border', orientation === 'vertical' ? 'h-full w-px' : 'h-px w-full', props.class)" />
</template>
<script setup lang="ts">
import { cn } from '~/lib/utils'
const props = defineProps<{ orientation?: 'horizontal' | 'vertical'; class?: string }>()
</script>
