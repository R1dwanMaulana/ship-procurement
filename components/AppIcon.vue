<template>
  <span
    class="inline-flex items-center justify-center flex-shrink-0"
    :style="{ width: size + 'px', height: size + 'px' }"
    v-html="icons[name]"
  />
</template>

<script setup lang="ts">
import { useIcons } from '~/composables/useIcons'

const icons = useIcons()

const props = withDefaults(
  defineProps<{ name: keyof ReturnType<typeof useIcons>; size?: number }>(),
  { size: 18 }
)
</script>
