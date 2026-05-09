<script setup lang="ts">
import { ref } from 'vue'

const activeSubTab = ref('attrs') // attrs, skills, talents

const level = ref(45)
const power = ref(125000)
</script>

<template>
  <div class="page-container">
    <header class="top-bar">
      <h2>升级</h2>
      <div class="resources">
        <span class="res">💰 50.2k</span>
        <span class="res">💎 1500</span>
      </div>
    </header>

    <div class="level-info">
      <div class="level-text">
        <span>主角等级: Lv {{ level }}</span>
        <span>战力: {{ power.toLocaleString() }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 65%;"></div>
      </div>
    </div>

    <div class="avatar-display">
      <!-- 站位：主角立绘或模型 -->
      <div class="avatar-placeholder">🧍 主角立绘/模型</div>
    </div>

    <div class="upgrade-panel">
      <div class="side-tabs">
        <button :class="{active: activeSubTab === 'attrs'}" @click="activeSubTab = 'attrs'">属性强化</button>
        <button :class="{active: activeSubTab === 'skills'}" @click="activeSubTab = 'skills'">技能树</button>
        <button :class="{active: activeSubTab === 'talents'}" @click="activeSubTab = 'talents'">全局天赋</button>
      </div>
      
      <div class="panel-content">
        <template v-if="activeSubTab === 'attrs'">
          <div class="attr-row"><span>攻击力</span> <span>1500 ➔ <span class="next-val">1650</span></span></div>
          <div class="attr-row"><span>生命值</span> <span>8000 ➔ <span class="next-val">8800</span></span></div>
          <div class="attr-row"><span>防御力</span> <span>400 ➔ <span class="next-val">450</span></span></div>
          
          <div class="action-row">
            <span class="cost">消耗: 💰 2000</span>
            <button class="upgrade-btn">升级</button>
          </div>
        </template>
        <template v-else-if="activeSubTab === 'skills'">
          <div class="placeholder-text">技能树系统待定</div>
        </template>
        <template v-else>
          <div class="placeholder-text">全局挂机收益加成</div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%; height: calc(100% - 64px); background-color: #0f0f1a; color: #fff; display: flex; flex-direction: column; overflow: hidden;
}

.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: #1a1a2e; }
.top-bar h2 { margin: 0; font-size: 18px; }
.resources .res { margin-left: 10px; font-size: 14px; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 12px; }

.level-info { padding: 12px 16px; background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%); }
.level-text { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-bottom: 8px; }
.progress-bar { width: 100%; height: 8px; background: #000; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background: #ffb6c1; transition: width 0.3s; }

.avatar-display { flex: 1; display: flex; justify-content: center; align-items: center; background: radial-gradient(circle, #2a2a3e 0%, #0f0f1a 70%); }
.avatar-placeholder { font-size: 20px; color: #888; }

.upgrade-panel {height: 200px; display: flex; background: #1a1a2e; border-top: 1px solid #333; }
.side-tabs { display: flex; flex-direction: column; width: 100px; background: #0f0f1a; }
.side-tabs button { padding: 16px 0; background: none; border: none; color: #888; border-right: 2px solid transparent; cursor: pointer; }
.side-tabs button.active { color: #fff; background: #1a1a2e; border-right: 2px solid #ffb6c1; font-weight: bold; }

.panel-content { flex: 1; padding: 16px; display: flex; flex-direction: column; justify-content: space-between; }
.attr-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 12px; border-bottom: 1px dashed #333; padding-bottom: 4px;}
.next-val { color: #4facfe; font-weight: bold; }

.action-row { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
.cost { font-size: 12px; color: #aaa; }
.upgrade-btn { background: #ffb6c1; color: #000; border: none; padding: 8px 24px; border-radius: 16px; font-weight: bold; cursor: pointer; }
.placeholder-text { text-align: center; color: #888; margin-top: 20px; }
</style>
