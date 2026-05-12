<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { GameConfigs } from '../data/configLoader'

const activeSubTab = ref('gacha')

const generatedCount = ref(0)
const showResult = ref(false)
const gachaResults = ref<any[]>([])
const isAnimating = ref(false)

const skillsPool = {
  white: ['基础战术内存', '标准护甲图纸', '初级射击辅助', '常规行动日志', '通用恢复模块', '初级索敌芯片'],
  yellow: ['高级战术核心', '稀有防弹材质', '特种医疗序列', '精锐突击插件'],
  red: ['【起源】机能过载', '【终焉】绝对壁垒', '【星界】量子计算芯']
}

// 抽取一个胶囊的逻辑
const generateCapsuleData = () => {
  generatedCount.value++
  let rarityColor = 'white'
  
  if (generatedCount.value % 36 === 0) {
    rarityColor = 'red'
  } else if (generatedCount.value % 18 === 0) {
    rarityColor = 'yellow'
  } else {
    const rand = Math.random() * 100
    // 期望概率 30次出红(约3.33%), 15次出黄(约6.66%)
    if (rand < 3.33) rarityColor = 'red'
    else if (rand < 10) rarityColor = 'yellow'
    else rarityColor = 'white'
  }

  let pool = skillsPool.white
  if (rarityColor === 'red') pool = skillsPool.red
  else if (rarityColor === 'yellow') pool = skillsPool.yellow

  const selectedName = pool[Math.floor(Math.random() * pool.length)]

  return {
    name: selectedName,
    rarityText: rarityColor === 'red' ? '极品' : rarityColor === 'yellow' ? '稀有' : '普通',
    color: rarityColor,
    icon: rarityColor === 'red' ? '💿' : rarityColor === 'yellow' ? '📀' : '⚙️'
  }
}

const gachaQueue = ref<any[]>([])

const popNextNormal = () => {
  if (gachaQueue.value.length === 0) {
    gachaQueue.value.push(generateCapsuleData())
  }
  return gachaQueue.value.shift()
}

// 贩卖机内部的胶囊状态管理
const machineCapsules = ref(Array.from({length: 16}, (_, i) => ({ 
  id: i, 
  hidden: false, 
  restocking: false,
  data: { name: '', rarityText: '', color: 'white', icon: '' }
})))

const checkAndBaitCapsules = (indicesToCheck: number[]) => {
  const getScore = (c: string) => c === 'red' ? 2 : c === 'yellow' ? 1 : 0
  let currentScore = machineCapsules.value.reduce((sum, cap) => sum + getScore(cap.data.color), 0)
  
  let safety = 0
  // 保证卡池内总是有至少1红 或 2黄的视效展示（总价值>=2）
  while (currentScore < 2 && safety < 50) {
    safety++
    let swapIdx = indicesToCheck.find(idx => machineCapsules.value[idx].data.color === 'white')
    if (swapIdx === undefined) swapIdx = machineCapsules.value.findIndex(cap => cap.data.color === 'white')
    if (swapIdx === -1) break

    let futureIdx = gachaQueue.value.findIndex(c => getScore(c.color) > 0)
    while (futureIdx === -1) {
       gachaQueue.value.push(generateCapsuleData())
       futureIdx = gachaQueue.value.findIndex(c => getScore(c.color) > 0)
    }

    const futureItem = gachaQueue.value.splice(futureIdx, 1)[0]
    const currentItem = machineCapsules.value[swapIdx].data
    
    machineCapsules.value[swapIdx].data = futureItem
    gachaQueue.value.unshift(currentItem)
    
    currentScore += getScore(futureItem.color) - getScore(currentItem.color)
  }
}

// 初始写入
for (let i = 0; i < 16; i++) machineCapsules.value[i].data = popNextNormal()
checkAndBaitCapsules(Array.from({length: 16}, (_, i) => i))

const capsuleEls = ref<HTMLElement[]>([])
const machineRef = ref<HTMLElement | null>(null)
const exitRef = ref<HTMLElement | null>(null)

// 动态计算的掉落队列
const activeDrops = ref<{id: number, style: any, color: string}[]>([])
const droppedIndices = ref<number[]>([])

const doGacha = async (times: number) => {
  if (isAnimating.value) return
  isAnimating.value = true
  
  gachaResults.value = []
  activeDrops.value = []
  droppedIndices.value = []
  
  // -- 1. 寻找可抽取的胶囊 --
  let availableIdxs = machineCapsules.value.map((c, i) => c.hidden ? -1 : i).filter(i => i !== -1)
  // 如果机器里没那么多胶囊了，强行补货以防万一
  if (availableIdxs.length < times) {
    machineCapsules.value.forEach(c => { 
      if (c.hidden) {
        c.data = popNextNormal()
      }
      c.hidden = false; 
      c.restocking = false 
    })
    checkAndBaitCapsules(machineCapsules.value.map((_, i) => i))
    availableIdxs = machineCapsules.value.map((_, i) => i)
  }

  // 随机打乱下标，取前 times 个作为本次要掉下来的坑位
  let sequenceIdxs = availableIdxs.sort(() => Math.random() - 0.5).slice(0, times)
  droppedIndices.value = sequenceIdxs

  for (let i = 0; i < times; i++) {
    const dropIdx = sequenceIdxs[i]
    // 提前计算好抽取结果
    const capData = machineCapsules.value[dropIdx].data
    gachaResults.value.push(capData)

    // 设置阶梯延迟，每过200ms掉落一颗
    setTimeout(() => {
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
      activeDrops.value.push({ id: Math.random(), style, color: capData.color })
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
  
  // 更新新胶囊数据并触发钓鱼逻辑
  droppedIndices.value.forEach(idx => {
    machineCapsules.value[idx].data = popNextNormal()
  })
  checkAndBaitCapsules(droppedIndices.value)

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
      <button :class="{active: activeSubTab === 'gacha'}" @click="activeSubTab = 'gacha'">技能贩卖机</button>
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
            :class="drop.color"
            :style="drop.style"
          >?</div>

          <div class="machine-banner">【当前卡池：限定极品技能 - 概率UP!】</div>
          <div class="machine-viewport">
            <div 
              class="capsule" 
              v-for="(cap, i) in machineCapsules" 
              :key="cap.id"
              ref="capsuleEls"
              :class="[cap.data.color, { 'invisible': cap.hidden, 'restocking': cap.restocking }]"
            >?</div>
          </div>
          <div class="machine-exit">
            <div class="exit-hole" ref="exitRef"></div>
          </div>
          <div class="gacha-pity">保底: 18抽必出稀有(黄)，36抽必出极品(红)</div>
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
        <h3 class="result-title">获取技能</h3>
        <div class="result-grid">
          <div class="result-item" v-for="(skill, index) in gachaResults" :key="index" :class="skill.color">
            <div class="rarity-badge">{{ skill.rarityText }}</div>
            <div class="maid-icon">{{ skill.icon }}</div>
            <div class="maid-name">{{ skill.name }}</div>
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
.capsule { width: 36px; height: 36px; border-radius: 50%; color: #000; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 16px; }
.capsule.red { background: linear-gradient(135deg, #ff4d4f, #ff7875); color: #fff; box-shadow: 0 0 8px rgba(255,77,79,0.8); }
.capsule.yellow { background: linear-gradient(135deg, #ffd700, #ffec3d); }
.capsule.white { background: linear-gradient(135deg, #e0e0e0, #f5f5f5); }

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
.result-item.red { border-color: #ff4d4f; box-shadow: 0 0 10px rgba(255,77,79,0.5); }
.result-item.yellow { border-color: #ffd700; box-shadow: 0 0 8px rgba(255,215,0,0.5); }
.result-item.white { border-color: #e0e0e0; }

.rarity-badge {
  position: absolute; top: 0; left: 0; font-size: 10px; font-weight: bold;
  padding: 2px 4px; background: rgba(0,0,0,0.6); border-bottom-right-radius: 4px;
}
.result-item.red .rarity-badge { color: #ff4d4f; }
.result-item.yellow .rarity-badge { color: #ffd700; }
.result-item.white .rarity-badge { color: #e0e0e0; }

.maid-icon { font-size: 24px; margin: 8px 0; }
.maid-name { font-size: 10px; text-align: center; font-weight: bold; white-space: nowrap; }

.confirm-btn {
  background: #ffb6c1; color: #000; border: none; padding: 10px 40px; border-radius: 20px;
  font-weight: bold; cursor: pointer;
}
</style>
