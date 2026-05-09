<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { GameConfigs } from '../data/configLoader'

const activeSubTab = ref('gacha')

const gachaCount = ref(0)
const showResult = ref(false)
const gachaResults = ref<any[]>([])
const isAnimating = ref(false)

// 贩卖机内部的胶囊状态管理
const machineCapsules = ref(Array.from({length: 16}, (_, i) => ({ id: i, hidden: false, restocking: false })))
const capsuleEls = ref<HTMLElement[]>([])
const machineRef = ref<HTMLElement | null>(null)
const exitRef = ref<HTMLElement | null>(null)

// 动态计算的掉落队列
const activeDrops = ref<{id: number, style: any}[]>([])
const droppedIndices = ref<number[]>([])

const doGacha = async (times: number) => {
  if (isAnimating.value) return
  isAnimating.value = true
  
  gachaCount.value += times
  gachaResults.value = []
  activeDrops.value = []
  droppedIndices.value = []
  
  // -- 1. 计算抽卡结果 --
  const pool = GameConfigs.gachaPool.filter(p => p.pool_id === 1)
  const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0)

  for (let i = 0; i < times; i++) {
    let forcedSSR = false
    if ((gachaCount.value - times + i + 1) % 15 === 0) {
      forcedSSR = true
    }
    
    let selectedMaidId = pool[0].maid_id
    if (forcedSSR) {
      const ssrPool = pool.filter(p => {
        const maid = GameConfigs.maids.find(m => m.id === p.maid_id)
        return maid?.rarity === 'SSR'
      })
      if (ssrPool.length > 0) {
        selectedMaidId = ssrPool[Math.floor(Math.random() * ssrPool.length)].maid_id
      }
    } else {
      let rand = Math.random() * totalWeight
      for (const item of pool) {
        if (rand < item.weight) {
          selectedMaidId = item.maid_id
          break
        }
        rand -= item.weight
      }
    }
    
    const drawnMaid = GameConfigs.maids.find(m => m.id === selectedMaidId)
    if (drawnMaid) {
      gachaResults.value.push(drawnMaid)
    }
  }
  
  // -- 2. 依次分配物理掉落演出 --
  // 如果机器里没那么多胶囊了，为了十连特效，直接强制全部可见
  let availableIdxs = machineCapsules.value.map((c, i) => c.hidden ? -1 : i).filter(i => i !== -1)
  if (availableIdxs.length < times) {
    machineCapsules.value.forEach(c => { c.hidden = false; c.restocking = false })
    availableIdxs = machineCapsules.value.map((_, i) => i)
  }

  // 随机打乱下标，取前 n 个作为本次要掉下来的坑位
  let sequenceIdxs = availableIdxs.sort(() => Math.random() - 0.5).slice(0, times)
  droppedIndices.value = sequenceIdxs

  for (let i = 0; i < times; i++) {
    // 设置阶梯延迟，每过200ms掉落一颗
    setTimeout(() => {
      const dropIdx = sequenceIdxs[i]
      let style: any = {}
      
      if (machineRef.value && exitRef.value && capsuleEls.value[dropIdx]) {
        const mRect = machineRef.value.getBoundingClientRect()
        const cRect = capsuleEls.value[dropIdx].getBoundingClientRect()
        const eRect = exitRef.value.getBoundingClientRect()
        
        // 抵消 PhoneViewport 的 scale 影响
        const scale = mRect.width / machineRef.value.offsetWidth

        const startX = (cRect.left - mRect.left) / scale
        const startY = (cRect.top - mRect.top) / scale
        const endX = ((eRect.left - mRect.left) + eRect.width / 2 - cRect.width / 2) / scale
        const endY = ((eRect.top - mRect.top) + eRect.height / 2 - cRect.height / 2) / scale

        style = {
          top: startY + 'px',
          left: startX + 'px',
          '--dist-x': (endX - startX) + 'px',
          '--dist-y': (endY - startY) + 'px'
        }
      }
      
      // 生成一个实体并隐藏原橱窗里的胶囊
      activeDrops.value.push({ id: Math.random(), style })
      machineCapsules.value[dropIdx].hidden = true

    }, i * 200)
  }
  
  // -- 3. 计算全部动画结束的时间点 --
  const totalAnimTime = (times - 1) * 200 + 1500
  setTimeout(() => {
    isAnimating.value = false
    showResult.value = true
    activeDrops.value = [] // 清理屏幕掉落元素
  }, totalAnimTime)
}

const closeResult = () => {
  showResult.value = false
  // 对所有掉出去的胶囊排队播回弹补位动画
  droppedIndices.value.forEach((idx, i) => {
    setTimeout(() => {
      machineCapsules.value[idx].restocking = true
      machineCapsules.value[idx].hidden = false
      setTimeout(() => {
        if (machineCapsules.value[idx]) machineCapsules.value[idx].restocking = false
      }, 500)
    }, i * 100)
  })
}
</script>

<template>
  <div class="page-container shop-page">
    <header class="top-bar">
      <h2>商店</h2>
      <div class="resources">
        <span class="res gold">💰 12.5k</span>
        <span class="res diamond">💎 1500</span>
      </div>
    </header>

    <div class="sub-tabs">
      <button :class="{active: activeSubTab === 'gacha'}" @click="activeSubTab = 'gacha'">女仆贩卖机</button>
      <button :class="{active: activeSubTab === 'daily'}" @click="activeSubTab = 'daily'">每日精选</button>
      <button :class="{active: activeSubTab === 'items'}" @click="activeSubTab = 'items'">道具商城</button>
      <button :class="{active: activeSubTab === 'gift'}" @click="activeSubTab = 'gift'">礼包中心</button>
    </div>

    <div class="content">
      <template v-if="activeSubTab === 'gacha'">
        <div class="gacha-machine" ref="machineRef">
          <!-- 正在掉落的抽卡胶囊集合 -->
          <div 
            v-for="drop in activeDrops" 
            :key="drop.id" 
            class="capsule animated-drop" 
            :style="drop.style"
          >🎁</div>

          <div class="machine-banner">【当前卡池：限定机械女仆 - 概率UP!】</div>
          <div class="machine-viewport">
            <div 
              class="capsule" 
              v-for="(cap, i) in machineCapsules" 
              :key="cap.id"
              ref="capsuleEls"
              :class="{ 'invisible': cap.hidden, 'restocking': cap.restocking }"
            >?</div>
          </div>
          <div class="machine-exit">
            <div class="exit-hole" ref="exitRef"></div>
          </div>
          <div class="gacha-pity">保底提示: 再抽 {{ Math.max(0, 15 - (gachaCount % 15)) }} 次必得SSR级女仆</div>
          <div class="gacha-actions">
            <button class="gacha-btn single" :class="{disabled: isAnimating}" @click="doGacha(1)">
              <div class="title">投币 1次</div>
              <div class="cost">💎 150</div>
            </button>
            <button class="gacha-btn ten" :class="{disabled: isAnimating}" @click="doGacha(10)">
              <div class="title">投币 10次</div>
              <div class="cost">💎 1500</div>
            </button>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="item-grid">
          <div class="item-card" v-for="item in GameConfigs.shopItems.filter(i => i.tab_name === (activeSubTab === 'daily' ? '每日精选' : activeSubTab === 'items' ? '道具商城' : '礼包中心'))" :key="item.id">
            <div class="item-icon">📦</div>
            <div class="item-name">{{ item.item_name }}</div>
            <div class="item-limit" v-if="item.buy_limit < 99">限购: {{ item.buy_limit }}次</div>
            <button class="buy-btn">{{ item.price_type }}: {{ item.price_value }}</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 抽卡结果弹窗 -->
    <div class="gacha-overlay" v-if="showResult" @click="closeResult">
      <div class="gacha-result-panel" @click.stop>
        <h3 class="result-title">抽取结果</h3>
        <div class="result-grid">
          <div class="result-item" v-for="(maid, index) in gachaResults" :key="index" :class="maid.rarity.toLowerCase()">
            <div class="rarity-badge">{{ maid.rarity }}</div>
            <div class="maid-icon">🎀</div>
            <div class="maid-name">{{ maid.name }}</div>
          </div>
        </div>
        <button class="confirm-btn" @click="closeResult">确定</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-container {
  width: 100%;
  height: calc(100% - 64px); /* reserve space for bottom nav */
  background-color: #0f0f1a;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: #1a1a2e;
}

.top-bar h2 { margin: 0; font-size: 18px; }

.resources .res { margin-left: 10px; font-size: 14px; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 12px; }

.sub-tabs {
  display: flex;
  overflow-x: auto;
  background-color: #1a1a2e;
  border-bottom: 2px solid #2a2a3e;
}
.sub-tabs::-webkit-scrollbar { display: none; }
.sub-tabs button {
  flex: 0 0 auto;
  padding: 12px 16px;
  background: none;
  border: none;
  color: #aaa;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.sub-tabs button.active { color: #ffb6c1; border-bottom: 2px solid #ffb6c1; }

.content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.gacha-machine {
  background: #1e1e2f;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 2px solid #444;
  position: relative;
}

.animated-drop {
  position: absolute;
  z-index: 10;
  animation: dropCapsule 1s ease-in forwards;
  font-size: 20px;
}

@keyframes dropCapsule {
  0% { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; }
  100% { transform: translate(var(--dist-x), var(--dist-y)) rotate(360deg) scale(0.5); opacity: 0; }
}

.machine-banner { font-size: 14px; font-weight: bold; color: #ffb6c1; margin-bottom: 16px; z-index: 2; }

.machine-viewport {
  width: 100%; 
  height: 300px; 
  background: rgba(0,0,0,0.5); 
  border: 2px solid #666; 
  border-radius: 8px;
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  row-gap: 32px;
  column-gap: 16px;
  justify-items: center; 
  align-content: center; 
  padding: 16px;
}
.capsule { width: 36px; height: 36px; background: linear-gradient(135deg, #ff9a9e, #fecfef); border-radius: 50%; color: #000; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; }
.capsule.invisible { opacity: 0; visibility: hidden; }
.capsule.restocking { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

@keyframes popIn {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.machine-exit { width: 100px; height: 30px; border-bottom: 4px solid #333; margin: 10px 0; position: relative; }
.exit-hole { width: 60px; height: 20px; background: #000; margin: 0 auto; border-radius: 4px; }

.gacha-pity { font-size: 12px; color: #aaa; margin-bottom: 16px; }

.gacha-actions { display: flex; gap: 16px; width: 100%; }
.gacha-btn { flex: 1; padding: 12px 0; border-radius: 8px; border: none; cursor: pointer; font-weight: bold; transition: all 0.2s; }
.gacha-btn.single { background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%); color: #fff; }
.gacha-btn.ten { background: linear-gradient(to right, #fa709a 0%, #fee140 100%); color: #000; }
.gacha-btn:active:not(.disabled) { opacity: 0.8; transform: scale(0.95); }
.gacha-btn.disabled { filter: grayscale(80%); cursor: not-allowed; opacity: 0.7; }
.gacha-btn .cost { font-size: 12px; margin-top: 4px; font-weight: normal; }

.item-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.item-card { background: #1a1a2e; border-radius: 8px; padding: 16px; display: flex; flex-direction: column; align-items: center; }
.item-icon { font-size: 32px; margin-bottom: 8px; }
.item-name { font-size: 14px; font-weight: bold; margin-bottom: 4px; text-align: center; }
.item-limit { font-size: 12px; color: #888; margin-bottom: 12px; }
.buy-btn { background: #3a3a5e; color: #fff; border: none; padding: 6px 12px; border-radius: 12px; width: 100%; font-size: 12px; cursor: pointer; }

/* 抽卡结果弹窗样式 */
.gacha-overlay {
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.8); z-index: 100;
  display: flex; justify-content: center; align-items: center;
}
.gacha-result-panel {
  background: #1a1a2e; width: 90%; max-width: 320px; border-radius: 16px;
  padding: 20px; border: 2px solid #444; display: flex; flex-direction: column; align-items: center;
}
.result-title { margin: 0 0 16px 0; color: #ffb6c1; }

/* 根据数量调整网格，单抽居中，十连网格 */
.result-grid {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-bottom: 20px;
}
.result-item {
  width: 64px; background: #2a2a3e; border: 2px solid #555; border-radius: 8px;
  display: flex; flex-direction: column; align-items: center; padding: 8px 4px;
  position: relative; overflow: hidden;
}
.result-item.ssr { border-color: #ffd700; box-shadow: 0 0 10px rgba(255,215,0,0.5); }
.result-item.sr { border-color: #a020f0; box-shadow: 0 0 8px rgba(160,32,240,0.5); }
.result-item.r { border-color: #4facfe; }

.rarity-badge {
  position: absolute; top: 0; left: 0; font-size: 10px; font-weight: bold;
  padding: 2px 4px; background: rgba(0,0,0,0.6); border-bottom-right-radius: 4px;
}
.result-item.ssr .rarity-badge { color: #ffd700; }
.result-item.sr .rarity-badge { color: #da70d6; }
.result-item.r .rarity-badge { color: #4facfe; }

.maid-icon { font-size: 24px; margin: 8px 0; }
.maid-name { font-size: 10px; text-align: center; font-weight: bold; white-space: nowrap; }

.confirm-btn {
  background: #ffb6c1; color: #000; border: none; padding: 10px 40px; border-radius: 20px;
  font-weight: bold; cursor: pointer;
}
</style>
