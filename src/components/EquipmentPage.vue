<script setup lang="ts">
import { ref } from 'vue'

const parts = ['武器', '头盔', '衣服', '鞋子', '饰品', '神石']
const activePart = ref('武器')

</script>

<template>
  <div class="page-container">
    <header class="top-bar">
      <h2>装备</h2>
      <div class="actions">
        <button class="filter-btn">筛选 / 排序</button>
      </div>
    </header>

    <div class="slotted-equipments">
      <div 
        class="slot" 
        v-for="part in parts" 
        :key="part"
        :class="{active: activePart === part}"
        @click="activePart = part"
      >
        <div class="icon-placeholder">🛡️</div>
        <span>{{ part }}</span>
      </div>
    </div>

    <div class="equip-detail">
      <div class="detail-header">
        <div class="equip-icon epic">🗡️</div>
        <div class="equip-title">
          <div class="name">【破败之刃】 <span class="level">Lv.20</span></div>
          <div class="rarity epic-text">史诗 (紫色)</div>
        </div>
      </div>
      <div class="attr-box">
        <div class="attr">攻击力 <span>+1200</span></div>
        <div class="attr">暴击率 <span>+5%</span></div>
      </div>
    </div>

    <div class="bottom-panel">
      <div class="left-actions">
        <button class="action-btn primary">强化</button>
        <span class="cost">消耗: 8000金币</span>
        <button class="action-btn secondary">一键分解</button>
      </div>
      <div class="inventory-grid">
        <div class="inv-slot has-item epic">衣</div>
        <div class="inv-slot has-item rare">武</div>
        <div class="inv-slot has-item normal">武</div>
        <div class="inv-slot has-item rare">头</div>
        <div class="inv-slot has-item epic">鞋</div>
        <div class="inv-slot has-item normal">饰</div>
        <div class="inv-slot has-item normal">饰</div>
        <div class="inv-slot has-item epic">衣</div>
        <div class="inv-slot"></div>
        <div class="inv-slot"></div>
        <div class="inv-slot"></div>
        <div class="inv-slot"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container { width: 100%; height: calc(100% - 64px); background-color: #0f0f1a; color: #fff; display: flex; flex-direction: column; overflow: hidden; }

.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #1a1a2e; }
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
.name { font-size: 16px; font-weight: bold; }
.level { color: #ffb6c1; font-size: 14px; }
.epic-text { color: #a020f0; font-size: 12px; margin-top: 4px; }
.attr-box { background: rgba(0,0,0,0.3); padding: 12px; border-radius: 4px; }
.attr { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; }
.attr span { color: #4facfe; font-weight: bold; }

.bottom-panel { flex: 1; display: flex; border-top: 1px solid #333; overflow: hidden; }
.left-actions { width: 120px; background: #1a1a2e; display: flex; flex-direction: column; align-items: center; padding: 16px 8px; gap: 12px; border-right: 1px solid #333; }
.action-btn { width: 100%; padding: 8px 0; border: none; border-radius: 16px; font-weight: bold; cursor: pointer;}
.action-btn.primary { background: #ffb6c1; color: #000; }
.action-btn.secondary { background: #3a3a5e; color: #fff; margin-top: auto; }
.cost { font-size: 12px; color: #888; }

.inventory-grid { flex: 1; padding: 16px; display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 48px; gap: 8px; overflow-y: auto; background: #0f0f1a; }
.inv-slot { background: #1a1a2e; border: 1px solid #333; border-radius: 6px; display: flex; justify-content: center; align-items: center; font-size: 14px; color: #888; }
.inv-slot.has-item { border-width: 2px; color: #fff; font-weight: bold; }
.inv-slot.has-item.epic { border-color: #a020f0; background: rgba(160, 32, 240, 0.2); }
.inv-slot.has-item.rare { border-color: #4facfe; background: rgba(79, 172, 254, 0.2); }
.inv-slot.has-item.normal { border-color: #aaa; background: rgba(170, 170, 170, 0.2); }
</style>
