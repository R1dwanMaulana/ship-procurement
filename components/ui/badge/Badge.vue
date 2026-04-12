<template>
  <span :class="cn(badgeVariants({ variant }), props.class)">
    <slot />
  </span>
</template>

<script setup lang="ts">
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:     'border-transparent bg-primary text-primary-foreground',
        secondary:   'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline:     'text-foreground border-border',
        // status variants — subtle, monochrome
        pending:     'border-transparent bg-secondary text-secondary-foreground',
        active:      'border-transparent bg-primary text-primary-foreground',
        done:        'border border-border text-muted-foreground',
      },
    },
    defaultVariants: { variant: 'secondary' },
  }
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = withDefaults(defineProps<{
  variant?: BadgeVariants['variant']
  class?: string
}>(), { variant: 'secondary' })
</script>
