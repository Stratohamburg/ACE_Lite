<script setup lang="ts">
import { ref } from 'vue'

const stage = ref('12-4')
const power = ref('12w')
</script>

<template>
  <div class="page-container">
    <header class="top-bar">
      <div class="user-info">
        <div class="avatar">👨‍🚀</div>
        <span>Lv.45</span>
      </div>
      <div class="stage-info">
        <h2>主线 {{ stage }}</h2>
      </div>
      <div class="power-info">战力: {{ power }}</div>
    </header>

    <div class="battle-stage">
      <div class="battle-entities">
        <div class="enemy-side">
          <div class="entity monster" v-for="i in 3" :key="i">👾</div>
        </div>
        <div class="vs-text">VS</div>
        <div class="ally-side">
          <div class="entity maid" v-for="i in 4" :key="i">🎀</div>
        </div>
      </div>
      <div class="battle-fx">（挂机战斗演出中...）</div>
    </div>

    <div class="idle-rewards">
      <div class="reward-title">当前挂机收益</div>
      <div class="reward-items">
        <span>💰 1234</span>
        <span>💎 5</span>
        <span>📦 12</span>
      </div>
      <button class="claim-btn">领取收益</button>
    </div>

    <div class="bottom-actions">
      <button class="action-btn">
        <span class="icon">⚡</span>
        <span>快速战斗</span>
      </button>
      <button class="action-btn primary">
        <span class="icon">👑</span>
        <span>挑战首领</span>
      </button>
      <button class="action-btn">
        <span class="icon">🛡️</span>
        <span>阵容配置</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.page-container { width: 100%; height: calc(100% - 64px); background-color: #0f0f1a; color: #fff; display: flex; flex-direction: column; overflow: hidden; }

.top-bar { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background-color: rgba(26,26,46,0.8); position: absolute; top:0; left:0; width: 100%; z-index: 10; box-sizing: border-box;}
.user-info { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.avatar { font-size: 24px; }
.stage-info h2 { margin: 0; font-size: 16px; color: #ffb6c1; }
.power-info { font-size: 12px; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 12px; }

.battle-stage { flex: 1; min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; position: relative; }
.battle-entities { display: flex; justify-content: space-between; align-items: center; width: 80%; }
.entity { font-size: 32px; animation: bounce 2s infinite alternate; }
.enemy-side, .ally-side { display: flex; gap: 10px; flex-wrap: wrap; width: 60px; justify-content: center; }
.enemy-side .entity { animation-delay: 0.5s; }
.vs-text { font-size: 24px; font-weight: bold; font-style: italic; color: #ffb6c1; text-shadow: 0 0 10px rgba(0,0,0,0.8); }
.battle-fx { position: absolute; bottom: 20px; font-size: 12px; color: rgba(255,255,255,0.7); }

@keyframes bounce { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }

.idle-rewards { background: #1a1a2e; padding: 16px; display: flex; flex-direction: column; align-items: center; border-radius: 16px 16px 0 0; margin-top: -16px; z-index: 5; }
.reward-title { font-size: 12px; color: #888; margin-bottom: 8px; }
.reward-items { display: flex; gap: 16px; font-size: 14px; font-weight: bold; margin-bottom: 12px; }
.claim-btn { background: #ffb6c1; color: #000; border: none; padding: 10px 40px; border-radius: 20px; font-weight: bold; width: 80%; cursor: pointer;}

.bottom-actions { display: flex; justify-content: space-around; padding: 12px 16px; background: #0f0f1a; border-top: 1px solid #333;}
.action-btn { background: #2a2a3e; color: #fff; border: none; padding: 10px; border-radius: 8px; flex: 1; margin: 0 4px; display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
.action-btn.primary { background: linear-gradient(135deg, #ffb6c1, #ff9a9e); color: #000; font-weight: bold; transform: scale(1.05); }
.action-btn .icon { font-size: 20px; }
.action-btn span:last-child { font-size: 12px; }
</style>
