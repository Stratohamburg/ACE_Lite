<script setup lang="ts">
import { computed } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { useDebugStore } from '../stores/debug'
import { useEconomyStore } from '../stores/economy'
import { useViewportStore } from '../stores/viewport'
import type { DetailTab, DrawerMode } from '../types'

const collectionStore = useCollectionStore()
const debugStore = useDebugStore()
const economyStore = useEconomyStore()
const viewportStore = useViewportStore()

const drawerModes: DrawerMode[] = ['collapsed', 'half', 'expanded']
const tabs: Array<{ value: DetailTab; label: string }> = [
  { value: 'attributes', label: '属性' },
  { value: 'affection', label: '爱情' },
  { value: 'story', label: '故事' },
]

const selectedId = computed({
  get: () => collectionStore.selectedMaidId,
  set: (value: string) => {
    collectionStore.selectMaid(value)
  },
})

function applyDrawerMode(mode: DrawerMode) {
  collectionStore.setDrawerMode(mode)
  debugStore.setDrawerMode(mode)
}

function applyTab(tab: DetailTab) {
  collectionStore.setActiveDetailTab(tab)
  if (collectionStore.selectedMaid?.unlocked) {
    collectionStore.openDetail(collectionStore.selectedMaid.id, tab)
  }
  debugStore.setTab(tab)
}

function toggleSelectedUnlocked() {
  if (!collectionStore.selectedMaid) {
    return
  }

  collectionStore.toggleUnlocked(collectionStore.selectedMaid.id)
  debugStore.logAction(`切换解锁状态: ${collectionStore.selectedMaid.name}`)
}

function grantGold() {
  economyStore.grantGold(10000)
  debugStore.logAction('调试发放资源: 金币 +10000')
}

function grantDiamonds() {
  economyStore.grantDiamonds(1000)
  debugStore.logAction('调试发放资源: 钻石 +1000')
}

function grantGachaTokens() {
  economyStore.grantItem('gachaToken', 10)
  debugStore.logAction('调试发放物资: 抽卡代币 +10')
}

function grantEnhancementStones() {
  economyStore.grantItem('enhancementStone', 20)
  debugStore.logAction('调试发放物资: 强化石 +20')
}

function grantNormalGifts() {
  economyStore.grantItem('normalGift', 5)
  debugStore.logAction('调试发放物资: 普通礼盒 +5')
}

function grantPremiumGifts() {
  economyStore.grantItem('premiumGift', 3)
  debugStore.logAction('调试发放物资: 高级礼盒 +3')
}
</script>

<template>
  <aside v-if="debugStore.enabled" class="debug-sidebar">
    <header class="debug-header">
      <p class="debug-kicker">Debug Menu</p>
      <h1>ACE Maid Test</h1>
      <span class="debug-badge">Landscape Shell</span>
    </header>

    <section class="debug-section">
      <h2>接口模式</h2>
      <button class="toggle-button" type="button" @click="debugStore.toggleMock()">
        {{ debugStore.useMock ? '当前: Mock 数据' : '当前: Real API' }}
      </button>
    </section>

    <section class="debug-section">
      <h2>当前角色</h2>
      <select v-model="selectedId" class="debug-select">
        <option v-for="maid in collectionStore.maids" :key="maid.id" :value="maid.id">
          {{ maid.name }} / {{ maid.unlocked ? '已解锁' : '未解锁' }}
        </option>
      </select>

      <div class="debug-row two-columns">
        <button class="secondary-button" type="button" @click="toggleSelectedUnlocked()">切换解锁</button>
        <button
          class="secondary-button"
          type="button"
          :disabled="!collectionStore.selectedMaid?.unlocked"
          @click="collectionStore.setShowcase(collectionStore.selectedMaid.id)"
        >
          设为看板
        </button>
      </div>
    </section>

    <section class="debug-section">
      <h2>抽屉状态</h2>
      <div class="pill-row">
        <button
          v-for="mode in drawerModes"
          :key="mode"
          type="button"
          class="pill-button"
          :class="{ active: collectionStore.drawerMode === mode }"
          @click="applyDrawerMode(mode)"
        >
          {{ mode }}
        </button>
      </div>
    </section>

    <section class="debug-section">
      <h2>详情页签</h2>
      <div class="pill-row">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          type="button"
          class="pill-button"
          :class="{ active: collectionStore.activeDetailTab === tab.value }"
          @click="applyTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </section>

    <section class="debug-section">
      <h2>快捷操作</h2>
      <div class="debug-row">
        <button class="secondary-button" type="button" @click="collectionStore.giftSelected()">送礼 +20</button>
      </div>
      <div class="debug-row two-columns">
        <button
          class="secondary-button"
          type="button"
          :disabled="!collectionStore.selectedMaid?.unlocked"
          @click="collectionStore.openDetail(collectionStore.selectedMaid.id)"
        >
          打开详情
        </button>
        <button class="secondary-button" type="button" @click="collectionStore.closeDetail()">关闭详情</button>
      </div>
    </section>

    <section class="debug-section">
      <h2>资源调试</h2>
      <div class="debug-row two-columns">
        <button class="secondary-button" type="button" @click="grantGold">金币 +10000</button>
        <button class="secondary-button" type="button" @click="grantDiamonds">钻石 +1000</button>
      </div>
      <div class="debug-row two-columns">
        <button class="secondary-button" type="button" @click="grantGachaTokens">代币 +10</button>
        <button class="secondary-button" type="button" @click="grantEnhancementStones">强化石 +20</button>
      </div>
      <div class="debug-row two-columns">
        <button class="secondary-button" type="button" @click="grantNormalGifts">普礼 +5</button>
        <button class="secondary-button" type="button" @click="grantPremiumGifts">高礼 +3</button>
      </div>
      <dl class="debug-metrics">
        <div>
          <dt>Gold</dt>
          <dd>{{ economyStore.goldLabel }}</dd>
        </div>
        <div>
          <dt>Diamond</dt>
          <dd>{{ economyStore.diamondLabel }}</dd>
        </div>
        <div>
          <dt>Token</dt>
          <dd>{{ economyStore.gachaTokenCount }}</dd>
        </div>
        <div>
          <dt>Stone</dt>
          <dd>{{ economyStore.enhancementStoneCount }}</dd>
        </div>
        <div>
          <dt>Gift</dt>
          <dd>{{ economyStore.normalGiftCount }}</dd>
        </div>
        <div>
          <dt>Premium</dt>
          <dd>{{ economyStore.premiumGiftCount }}</dd>
        </div>
      </dl>
    </section>

    <section class="debug-section">
      <h2>视口调试</h2>
      <div class="debug-row two-columns">
        <button class="secondary-button" type="button" @click="debugStore.togglePhoneFrame()">边框开关</button>
        <button class="secondary-button" type="button" @click="debugStore.toggleSafeArea()">安全区开关</button>
      </div>
      <dl class="debug-metrics">
        <div>
          <dt>Scale</dt>
          <dd>{{ viewportStore.scale.toFixed(2) }}</dd>
        </div>
        <div>
          <dt>Stage</dt>
          <dd>{{ Math.round(viewportStore.stageWidth) }} × {{ Math.round(viewportStore.stageHeight) }}</dd>
        </div>
        <div>
          <dt>Unlocked</dt>
          <dd>{{ collectionStore.unlockedCount }} / {{ collectionStore.maids.length }}</dd>
        </div>
      </dl>
    </section>

    <section class="debug-section debug-log">
      <h2>最后操作</h2>
      <p>{{ debugStore.lastAction }}</p>
    </section>
  </aside>
</template>