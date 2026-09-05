<script setup lang="ts">
useHead({ title: '统计看板 · 管理后台' })
definePageMeta({ middleware: 'auth' })

const { apiFetch } = useApi()

interface DayStat { date: string; pv: number; uv: number }
interface Popular { slug: string; title: string; viewCount: number }

const { data: overview } = await useAsyncData('stats-overview', async () => {
  const res = await apiFetch<{ code: number; message: string; data: { days: DayStat[]; totalPv: number; totalUv: number } }>(
    '/api/stats/admin/overview?days=30'
  )
  return res.data
})
const { data: popular } = await useAsyncData('stats-popular', async () => {
  const res = await apiFetch<{ code: number; message: string; data: Popular[] }>('/api/stats/admin/popular?limit=10')
  return res.data
})

let chart: any = null

onMounted(async () => {
  try {
    const Chart = (await import(/* @vite-ignore */ 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js' as any)).default
    const days = overview.value?.days ?? []
    const ctx = document.getElementById('pvChart') as HTMLCanvasElement | null
    if (!ctx || !Chart) return
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days.map((d) => d.date.slice(5)),
        datasets: [
          { label: 'PV', data: days.map((d) => d.pv), borderColor: '#b45309', tension: 0.3 },
          { label: 'UV', data: days.map((d) => d.uv), borderColor: '#0f766e', tension: 0.3 }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    })
  } catch {
    // CDN 加载失败时隐藏图表面板，保留合计与热门列表
    const panel = document.getElementById('pv-panel')
    if (panel) panel.style.display = 'none'
  }
})

onBeforeUnmount(() => {
  chart?.destroy()
})
</script>

<template>
  <main class="admin-wrap">
    <AdminNav />
    <div class="admin-head">
      <h1 class="admin-title font-serif-warm">统计看板</h1>
      <div class="totals">
        <span class="total">PV 合计 {{ overview?.totalPv ?? 0 }}</span>
        <span class="total">UV 合计 {{ overview?.totalUv ?? 0 }}</span>
      </div>
    </div>

    <section id="pv-panel" class="panel">
      <h2 class="panel-title font-serif-warm">近 30 天访问</h2>
      <canvas id="pvChart" height="220" />
    </section>

    <section class="panel">
      <h2 class="panel-title font-serif-warm">热门文章 Top 10</h2>
      <ol class="popular">
        <li v-for="(p, i) in popular ?? []" :key="p.slug" class="pop-row">
          <span class="pop-rank">{{ i + 1 }}</span>
          <NuxtLink :to="`/blog/${p.slug}`" class="pop-title" target="_blank">{{ p.title }}</NuxtLink>
          <span class="pop-count">{{ p.viewCount }} 次</span>
        </li>
      </ol>
      <p v-if="(popular ?? []).length === 0" class="empty">暂无数据</p>
    </section>
  </main>
</template>

<style scoped>
.admin-wrap { max-width: 720px; margin: 0 auto; padding: 48px 24px; }
.admin-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.admin-title { font-size: 1.75rem; color: var(--blog-foreground); }
.totals { display: flex; gap: 16px; }
.total { font-size: 0.9rem; color: var(--blog-muted-foreground); }
.panel { margin-bottom: 32px; padding: 20px; border: 1px solid var(--blog-border); border-radius: var(--blog-radius-md); background: var(--blog-card); }
.panel-title { font-size: 1.1rem; color: var(--blog-foreground); margin-bottom: 16px; }
.popular { list-style: none; display: flex; flex-direction: column; gap: 10px; margin: 0; padding: 0; }
.pop-row { display: flex; align-items: center; gap: 12px; }
.pop-rank { width: 22px; height: 22px; border-radius: 50%; background: var(--blog-primary); color: #fff; font-size: 0.75rem; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.pop-title { color: var(--blog-foreground); text-decoration: none; font-size: 0.9rem; flex: 1; }
.pop-title:hover { color: var(--blog-primary); }
.pop-count { font-size: 0.8rem; color: var(--blog-muted-foreground); }
.empty { text-align: center; color: var(--blog-muted-foreground); padding: 24px 0; }
</style>
