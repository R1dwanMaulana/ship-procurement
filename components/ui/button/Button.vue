<template>
  <component
    :is="as || 'button'"
    :class="cn(buttonVariants({ variant, size }), props.class)"
    v-bind="$attrs"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { buttonVariants, type ButtonVariants } from './variants'
import { cn } from '~/lib/utils'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  as?: string
  class?: string
}>(), {
  variant: 'default',
  size: 'default',
})
</script>
