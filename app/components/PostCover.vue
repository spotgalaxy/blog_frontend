<script setup lang="ts">
/**
 * 文章封面渲染:图片地址 / 纯色值通用。
 * - 图片:底层模糊图 + 上层清晰图用 mask 渐变,形成"模糊→清晰"过渡
 *   (direction="right" 从左往右变清晰;direction="bottom" 从上往下变模糊)
 * - 纯色:单层色块 + 同方向渐变,观感等效
 * - 尺寸/比例/圆角由父级通过 class 控制;封面为空或加载失败时整体不渲染
 */
const props = withDefaults(
  defineProps<{
    cover: string | null
    alt?: string
    direction?: 'right' | 'bottom'
  }>(),
  { alt: '', direction: 'right' }
)

const isColor = computed(() => isColorValue(props.cover))
const failed = ref(false)
</script>

<template>
  <div
    v-if="cover && !failed"
    class="post-cover"
    :class="[`dir-${direction}`, { 'is-color': isColor }]"
  >
    <template v-if="!isColor">
      <img class="pc-blur" :src="cover" alt="" aria-hidden="true" />
      <img class="pc-sharp" :src="cover" :alt="alt" loading="lazy" @error="failed = true" />
    </template>
    <div v-else class="pc-color" :style="{ background: cover }" />
  </div>
</template>

<style scoped>
.post-cover {
  position: relative;
  overflow: hidden;
}
.pc-blur,
.pc-sharp,
.pc-color {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
/* 模糊底层:轻微放大遮住模糊产生的透明毛边 */
.pc-blur {
  filter: blur(14px);
  transform: scale(1.2);
}

/* ===== 清晰层 mask:控制模糊→清晰的过渡方向 ===== */
/* 列表:左侧露出模糊层,向右逐渐清晰 */
.dir-right .pc-sharp {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 65%);
  mask-image: linear-gradient(to right, transparent 0%, #000 65%);
}
/* 详情:顶部清晰,向下逐渐露出模糊层 */
.dir-bottom .pc-sharp {
  -webkit-mask-image: linear-gradient(to bottom, #000 35%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 35%, transparent 100%);
}

/* ===== 纯色层:与图片同方向的渐变观感 ===== */
.dir-right .pc-color {
  -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 70%);
  mask-image: linear-gradient(to right, transparent 0%, #000 70%);
}
/* 底部方向由容器整体渐隐处理,纯色层保持实色 */

/* ===== 详情方向:容器底部整体向下渐隐,融入页面背景 ===== */
.dir-bottom {
  -webkit-mask-image: linear-gradient(to bottom, #000 70%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 70%, transparent 100%);
}
</style>
