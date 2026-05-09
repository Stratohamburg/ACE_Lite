<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useDebugStore } from '../stores/debug'
import { useViewportStore } from '../stores/viewport'
import { useNavStore } from '../stores/nav'
import MaidCollectionPage from './MaidCollectionPage.vue'
import ShopPage from './ShopPage.vue'
import UpgradePage from './UpgradePage.vue'
import AdventurePage from './AdventurePage.vue'
import EquipmentPage from './EquipmentPage.vue'
import BottomNavBar from './BottomNavBar.vue'

const stageRef = ref<HTMLElement | null>(null)
const viewportStore = useViewportStore()
const debugStore = useDebugStore()
const navStore = useNavStore()
let observer: ResizeObserver | null = null

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (!entry) {
      return
    }

    viewportStore.setStageRect(entry.contentRect.width, entry.contentRect.height)
  })

  if (stageRef.value) {
    observer.observe(stageRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})

const shellStyle = computed(() => ({
  width: `${viewportStore.renderedWidth}px`,
  height: `${viewportStore.renderedHeight}px`,
}))

const viewportStyle = computed(() => ({
  width: `${viewportStore.baseWidth}px`,
  height: `${viewportStore.baseHeight}px`,
  transform: `scale(${viewportStore.scale})`,
  transformOrigin: 'top left',
}))
</script>

<template>
  <section ref="stageRef" class="viewport-stage">
    <div class="aurora-backdrop"></div>
    <div class="device-shell" :class="{ frameless: !debugStore.showPhoneFrame }" :style="shellStyle">
      <div class="device-viewport" :style="viewportStyle">
        <div v-if="debugStore.showSafeArea" class="safe-area-overlay"></div>
        
        <!-- 主内容区域，根据当前选中的页签切换对应的系统入口 -->
        <ShopPage v-show="navStore.currentTab === 'shop'" />
        <UpgradePage v-show="navStore.currentTab === 'upgrade'" />
        <AdventurePage v-show="navStore.currentTab === 'adventure'" />
        <EquipmentPage v-show="navStore.currentTab === 'equipment'" />
        <MaidCollectionPage v-show="navStore.currentTab === 'maid'" />
        
        <!-- 全局底部导航栏 -->
        <BottomNavBar />
      </div>
    </div>
  </section>
</template>