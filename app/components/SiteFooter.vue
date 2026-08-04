<script setup lang="ts">
const yearCn = formatYearCn(new Date().getFullYear())
</script>

<template>
  <footer class="site-footer">
    <div class="footer-inner">
      <p class="copyright font-serif-warm">
        &copy; {{ yearCn }} {{ site.name }} · 用心书写
      </p>
      <div class="footer-links">
        <template v-for="(s, i) in site.socials" :key="s.label">
          <a :href="s.href" class="footer-link font-serif-warm">{{ s.label }}</a>
          <span v-if="i < site.socials.length - 1" class="sep">·</span>
        </template>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid color-mix(in srgb, var(--blog-border) 60%, transparent);
  background: color-mix(in srgb, var(--blog-background) 50%, transparent);
}

.footer-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.copyright {
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  color: var(--blog-muted-foreground);
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 16px;
}

.footer-link {
  font-size: 0.75rem;
  color: var(--blog-muted-foreground);
  transition: color 0.2s ease;
}
.footer-link:hover {
  color: var(--blog-foreground);
}

.sep {
  color: var(--blog-border);
  font-size: 0.75rem;
}
</style>
