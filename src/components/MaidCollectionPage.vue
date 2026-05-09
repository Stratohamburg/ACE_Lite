<script setup lang="ts">
import { computed } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { getLoveStage, getDerivedBonuses, formatBonusValue } from '../utils/maids'
import MaidDrawer from './MaidDrawer.vue'
import MaidDetailPanel from './MaidDetailPanel.vue'

const collectionStore = useCollectionStore()

const featuredMaid = computed(() => collectionStore.showcaseMaid ?? collectionStore.teamMaids[0] ?? collectionStore.maids[0])
const sideTeamMaids = computed(() => collectionStore.teamMaids.filter((maid) => maid.id !== featuredMaid.value?.id).slice(0, 2))

const activeBonuses = computed(() => {
  const summary: Record<string, { value: number, unit: string, name: string }> = {}
  collectionStore.teamMaids.forEach(maid => {
    const bonuses = getDerivedBonuses(maid)
    bonuses.forEach(b => {
      if (b.isUnlocked) {
        if (!summary[b.name]) {
          summary[b.name] = { value: 0, unit: b.unit, name: b.name }
        }
        summary[b.name].value += b.value
      }
    })
  })
  return Object.values(summary)
})

function openFeatured() {
  if (!featuredMaid.value) {
    return
  }

  collectionStore.openDetail(featuredMaid.value.id)
}
</script>

<template>
  <main class="page-container maid-page">
    <div class="page-noise"></div>

    <header class="top-bar">
      <h2>女仆藏品馆</h2>
      <div class="resources">
        <span class="res gold">💰 12.5k</span>
        <span class="res diamond">💎 1500</span>
      </div>
    </header>

    <section class="hero-stage">
      <div class="team-showcase">
        <button
          v-for="maid in collectionStore.teamMaids"
          :key="maid.id"
          class="team-portrait"
          type="button"
          :class="{ 'is-featured': featuredMaid.id === maid.id }"
          :style="{ background: maid.accent, boxShadow: featuredMaid.id === maid.id ? `0 10px 30px ${maid.accentSoft}` : 'none' }"
          @click="collectionStore.openDetail(maid.id)"
        >
          <span class="portrait-rarity">{{ maid.rarity }}</span>
          <svg class="portrait-icon" xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px; opacity: 0.85;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span class="portrait-name">{{ maid.name }}</span>
          <span class="portrait-role" style="font-size: 10px; opacity: 0.8;">{{ maid.role }}</span>
        </button>
      </div>
      <p class="hero-hint">点击角色：语音互动 / 打开详情</p>
    </section>

    <section class="bonus-summary">
      <h3 class="bonus-summary-title">已激活加成汇总</h3>
      <div v-if="activeBonuses.length === 0" class="bonus-summary-empty">
        暂无生效加成
      </div>
      <div v-else class="bonus-summary-list">
        <div v-for="bonus in activeBonuses" :key="bonus.name" class="bonus-item">
          <span class="bonus-name">{{ bonus.name }}</span>
          <span class="bonus-val">+{{ formatBonusValue(bonus.value, bonus.unit) }}</span>
        </div>
      </div>
    </section>

    <MaidDrawer />
    <MaidDetailPanel />
  </main>
</template>

<style scoped>
.page-container {
  width: 100%;
  height: calc(100% - 64px) !important;
  position: relative;
  overflow: hidden;
}

.bonus-summary {
  position: relative;
  z-index: 2;
  margin: 16px 16px 0;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(8px);
}

.bonus-summary-title {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.bonus-summary-empty {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  text-align: center;
  padding: 12px 0;
}

.bonus-summary-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
}

.bonus-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.bonus-name {
  color: rgba(255, 255, 255, 0.7);
}

.bonus-val {
  color: #ffb86b;
  font-weight: bold;
}
</style>