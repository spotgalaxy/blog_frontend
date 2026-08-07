<script setup lang="ts">
const route = useRoute()

const isActive = (href: string) =>
  href === '/' ? route.path === '/' : route.path.startsWith(href)

/* ===== 移动端抽屉菜单 ===== */
const menuOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)

watch(menuOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
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
        <!-- 移动端汉堡按钮 -->
        <button
          type="button"
          class="menu-btn"
          :aria-expanded="String(menuOpen)"
          aria-label="打开导航菜单"
          @click="menuOpen = !menuOpen"
        >
          <span class="menu-line" :class="{ open: menuOpen }" />
          <span class="menu-line" :class="{ open: menuOpen }" />
        </button>
      </div>
    </nav>

    <!-- 移动端抽屉菜单：Teleport 到 body，脱离 header 的 backdrop-filter 包含块影响 -->
    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="menuOpen" class="mobile-menu">
          <ul class="mobile-links">
            <li v-for="(item, i) in site.nav" :key="item.href">
              <NuxtLink
                :to="item.href"
                class="mobile-link font-serif-warm"
                :class="{ active: isActive(item.href) }"
                :style="{ transitionDelay: menuOpen ? `${60 + i * 40}ms` : '0ms' }"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>

<style scoped>
/* ===== 头部导航 ===== */
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  /* 兜底：不支持 color-mix/backdrop-filter 的浏览器用实色背景 */
  background: var(--blog-background);
  border-bottom: 1px solid var(--blog-border);
}
/* 渐进增强：现代浏览器启用半透明毛玻璃 */
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .site-header {
    background: color-mix(in srgb, var(--blog-background) 75%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border-bottom-color: color-mix(in srgb, var(--blog-border) 50%, transparent);
  }
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
  padding: 6px 0 2px;
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

/* ===== 汉堡按钮（默认隐藏，小屏显示） ===== */
.menu-btn {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 40px;
  height: 40px;
  margin-right: -8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--blog-foreground);
}
.menu-line {
  display: block;
  width: 18px;
  height: 1.5px;
  background: currentColor;
  transition:
    transform 0.25s ease,
    opacity 0.25s ease;
}
.menu-line.open:first-child {
  transform: translateY(3.25px) rotate(45deg);
}
.menu-line.open:last-child {
  transform: translateY(-3.25px) rotate(-45deg);
}

/* ===== 移动端抽屉菜单 ===== */
.mobile-menu {
  display: none;
}

@media (max-width: 640px) {
  .nav-links {
    display: none;
  }
  .menu-btn {
    display: inline-flex;
  }
  .mobile-menu {
    display: block;
    position: fixed;
    /* 用 inset 而非 top+bottom，避免 backdrop-filter 包含块导致的定位塌陷 */
    inset: 56px 0 0 0;
    z-index: 60;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    /* 兜底实色背景，保证老浏览器下不透字 */
    background: var(--blog-background);
    border-top: 1px solid var(--blog-border);
  }
  @supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
    .mobile-menu {
      background: color-mix(in srgb, var(--blog-background) 92%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-top-color: color-mix(in srgb, var(--blog-border) 50%, transparent);
    }
  }
  .mobile-links {
    display: flex;
    flex-direction: column;
    padding: 24px;
    gap: 4px;
  }
  .mobile-link {
    display: block;
    padding: 14px 8px;
    font-size: 1.125rem;
    letter-spacing: 0.05em;
    color: var(--blog-muted-foreground);
    border-bottom: 1px dotted var(--blog-border);
    transition:
      color 0.2s ease,
      opacity 0.3s ease,
      transform 0.3s ease;
  }
  .mobile-links li:last-child .mobile-link {
    border-bottom: none;
  }
  .mobile-link.active {
    color: var(--blog-primary);
    font-weight: 500;
  }
}

/* 抽屉整体淡入 + 链接逐项滑入 */
.drawer-enter-active {
  transition: opacity 0.25s ease;
}
.drawer-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .mobile-link {
  opacity: 0;
  transform: translateY(10px);
}
.drawer-enter-active .mobile-link {
  opacity: 1;
  transform: translateY(0);
}
</style>
