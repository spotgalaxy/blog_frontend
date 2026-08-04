<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
await navigateTo('/admin/posts', { replace: true })
</script>

<template>
  <div />
</template>
