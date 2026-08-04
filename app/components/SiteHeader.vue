<script setup lang="ts">
const route = useRoute()

const isActive = (href: string) =>
  href === '/' ? route.path === '/' : route.path.startsWith(href)
</script>

<template>
  <header class="site-header">
    <nav class="site-nav">
      <NuxtLink to="/" class="logo font-serif-warm">{{ site.name }}</NuxtLink>
      <div class="nav-right">
        <ul class="nav-links">
          <li v-for="item in site.nav" :key="item.href">
            <NuxtLink
              :to="item.href"
              class="nav-link font-serif-warm"
              :class="{ active: isActive(item.href) }"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
        <ThemeToggle />
      </div>
    </nav>
  </header>
</template>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  background: color-mix(in srgb, var(--blog-background) 75%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid color-mix(in srgb, var(--blog-border) 50%, transparent);
}

.site-nav {
  max-width: var(--blog-content-wide);
  margin: 0 auto;
  padding: 0 24px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--blog-foreground);
  transition: color 0.2s ease;
}
.logo:hover {
  color: var(--blog-primary);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 28px;
}

.nav-link {
  font-size: 0.875rem;
  letter-spacing: 0.05em;
  color: var(--blog-muted-foreground);
  transition: color 0.2s ease;
  padding-bottom: 2px;
  border-bottom: 1px solid transparent;
}
.nav-link:hover {
  color: var(--blog-foreground);
}
.nav-link.active {
  color: var(--blog-primary);
  font-weight: 500;
  border-bottom-color: var(--blog-primary);
}

@media (max-width: 640px) {
  .nav-links {
    gap: 18px;
  }
}
</style>
