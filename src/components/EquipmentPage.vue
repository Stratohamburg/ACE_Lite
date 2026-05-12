<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useEconomyStore } from '../stores/economy'

const parts = ['武器', '头盔', '衣服', '鞋子', '饰品', '神石']
const activePart = ref('武器')
const economyStore = useEconomyStore()

const visibleEquipments = computed(() => economyStore.equipmentInventory.filter((item) => item.part === activePart.value))
const selectedEquipment = computed(() => {
  if (economyStore.selectedEquipment && economyStore.selectedEquipment.part === activePart.value) {
    return economyStore.selectedEquipment
  }

  return visibleEquipments.value[0] ?? null
})

watchEffect(() => {
  if (selectedEquipment.value && economyStore.selectedEquipment?.id !== selectedEquipment.value.id) {
    economyStore.selectEquipment(selectedEquipment.value.id)
  }
})

function selectPart(part: string) {
  activePart.value = part
  const first = economyStore.equipmentInventory.find((item) => item.part === part)
  if (first) {
    economyStore.selectEquipment(first.id)
  }
}

function selectEquipment(equipmentId: string) {
  economyStore.selectEquipment(equipmentId)
}

function strengthenEquipment() {
  const result = economyStore.strengthenSelectedEquipment()
  alert(result.message)
}

function dismantleEquipment() {
  const result = economyStore.dismantleSelectedEquipment()
  alert(result.message)
}

function getRarityLabel(rarity: 'normal' | 'rare' | 'epic') {
  if (rarity === 'epic') {
    return '史诗 (紫色)'
  }

  if (rarity === 'rare') {
    return '稀有 (蓝色)'
  }

  return '普通 (白色)'
}
</script>

<template>
  <div class="page-container">
    <header class="top-bar">
      <h2>装备</h2>
      <div class="actions">
        <span class="resource-pill">💰 {{ economyStore.goldLabel }}</span>
        <span class="resource-pill">🪨 {{ economyStore.enhancementStoneCount }}</span>
        <button class="filter-btn">筛选 / 排序</button>
      </div>
    </header>

    <div class="slotted-equipments">
      <div 
        class="slot" 
        v-for="part in parts" 
        :key="part"
        :class="{active: activePart === part}"
        @click="selectPart(part)"
      >
        <div class="icon-placeholder">🛡️</div>
        <span>{{ part }}</span>
      </div>
    </div>

    <div class="equip-detail">
      <div v-if="selectedEquipment" class="detail-header">
        <div class="equip-icon" :class="selectedEquipment.rarity">🗡️</div>
        <div class="equip-title">
          <div class="name">{{ selectedEquipment.name }} <span class="level">Lv.{{ selectedEquipment.level }}</span></div>
          <div class="rarity" :class="`${selectedEquipment.rarity}-text`">{{ getRarityLabel(selectedEquipment.rarity) }}</div>
        </div>
      </div>
      <div v-if="selectedEquipment" class="attr-box">
        <div class="attr">攻击力 <span>+{{ selectedEquipment.attack }}</span></div>
        <div class="attr">暴击率 <span>+{{ selectedEquipment.critRate }}%</span></div>
      </div>
      <div v-else class="empty-detail">当前部位暂无装备</div>
    </div>

    <div class="bottom-panel">
      <div class="left-actions">
        <button class="action-btn primary" :disabled="!selectedEquipment || !economyStore.canStrengthenSelectedEquipment()" @click="strengthenEquipment">强化</button>
        <span class="cost">消耗: {{ economyStore.equipmentStrengthenGoldCost }}金币 + {{ economyStore.equipmentStrengthenStoneCost }}强化石</span>
        <button class="action-btn secondary" :disabled="!selectedEquipment" @click="dismantleEquipment">一键分解</button>
      </div>
      <div class="inventory-grid">
        <button
          v-for="equipment in visibleEquipments"
          :key="equipment.id"
          class="inv-slot has-item"
          :class="[equipment.rarity, { active: selectedEquipment?.id === equipment.id }]"
          @click="selectEquipment(equipment.id)"
        >
          {{ equipment.part.slice(0, 1) }}
        </button>
        <div v-for="index in Math.max(12 - visibleEquipments.length, 0)" :key="`empty-${index}`" class="inv-slot"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { width: 100%; height: calc(100% - 64px); background-color: #0f0f1a; color: #fff; display: flex; flex-direction: column; overflow: hidden; }

.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #1a1a2e; }
.actions { display: flex; align-items: center; gap: 8px; }
.resource-pill { font-size: 12px; padding: 4px 8px; border-radius: 999px; background: rgba(0, 0, 0, 0.35); }
.top-bar h2 { margin: 0; font-size: 18px; }
.filter-btn { background: #2a2a3e; color: #fff; border: none; padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; }

.slotted-equipments { display: flex; justify-content: space-around; padding: 16px 8px; background: #1a1a2e; }
.slot { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0.5; transition: 0.3s; cursor: pointer;}
.slot.active { opacity: 1; transform: scale(1.1); }
.slot .icon-placeholder { width: 40px; height: 40px; background: #2a2a3e; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 20px; border: 1px solid #444; }
.slot span { font-size: 12px; }

.equip-detail { margin: 16px; padding: 16px; background: #1a1a2e; border: 1px solid #333; border-radius: 8px; }
.detail-header { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
.equip-icon { width: 50px; height: 50px; display: flex; justify-content: center; align-items: center; font-size: 24px; border-radius: 8px; background: #2a2a3e; border: 2px solid #888; }
.equip-icon.epic { border-color: #a020f0; background: rgba(160, 32, 240, 0.2); }
.equip-icon.rare { border-color: #4facfe; background: rgba(79, 172, 254, 0.2); }
.equip-icon.normal { border-color: #aaa; background: rgba(170, 170, 170, 0.2); }
.name { font-size: 16px; font-weight: bold; }
.level { color: #ffb6c1; font-size: 14px; }
.epic-text { color: #a020f0; font-size: 12px; margin-top: 4px; }
.rare-text { color: #4facfe; font-size: 12px; margin-top: 4px; }
.normal-text { color: #ddd; font-size: 12px; margin-top: 4px; }
.attr-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; }
.empty-detail { color: #888; font-size: 14px; text-align: center; padding: 24px 0; }
.attr { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.attr span { color: #4facfe; font-weight: bold; }

.bottom-panel { flex: 1; display: flex; border-top: 1px solid #333; overflow: hidden; }
.left-actions { width: 120px; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; padding: 16px 8px; gap: 12px; border-right: 1px solid #333; }
.action-btn { width: 100%; padding: 8px 0; border: none; border-radius: 16px; font-weight: bold; cursor: pointer;}
.action-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.action-btn.primary { background: #ffb6c1; color: #000; }
.action-btn.secondary { background: #3a3a5e; color: #fff; margin-top: auto; }
.cost { font-size: 12px; color: #888; }

.inventory-grid { flex: 1; padding: 16px; display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 48px; gap: 8px; overflow-y: auto; background: #0f0f1a; }
.inv-slot { background: #1a1a2e; border: 1px solid #333; border-radius: 6px; display: flex; justify-content: center; align-items: center; font-size: 14px; color: #888; }
.inventory-grid button { cursor: pointer; }
.inv-slot.has-item { border-width: 2px; color: #fff; font-weight: bold; }
.inv-slot.has-item.epic { border-color: #a020f0; background: rgba(160, 32, 240, 0.2); }
.inv-slot.has-item.rare { border-color: #4facfe; background: rgba(79, 172, 254, 0.2); }
.inv-slot.has-item.normal { border-color: #aaa; background: rgba(170, 170, 170, 0.2); }
.inv-slot.has-item.active { box-shadow: 0 0 0 2px rgba(255, 182, 193, 0.85) inset; }
</style>
