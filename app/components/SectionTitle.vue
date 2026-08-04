<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <h2 class="magazine-section-title section-title">
    <span class="underline-deco">{{ title }}</span>
  </h2>
</template>

<style scoped>
.section-title {
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  color: var(--blog-foreground);
}
@media (min-width: 768px) {
  .section-title {
    font-size: 1.5rem;
  }
}
</style>
