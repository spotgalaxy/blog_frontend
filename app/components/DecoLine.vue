<script setup lang="ts">
withDefaults(defineProps<{ short?: boolean }>(), { short: false })
</script>

<template>
  <div class="deco" :class="{ short }">
    <span class="line" />
    <span class="dot" />
    <span class="line" />
  </div>
</template>

<style scoped>
.deco {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.line {
  height: 1px;
  width: 64px;
  background: var(--blog-border);
}
.short .line {
  width: 48px;
}
.dot {
  height: 4px;
  width: 4px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--blog-primary) 40%, transparent);
}
</style>
