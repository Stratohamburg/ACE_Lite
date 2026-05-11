<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { formatBonusValue, getDerivedBonuses, getLoveStage, getNextLevelBonuses, getStageTarget, isStoryUnlocked } from '../utils/maids'
import type { DetailTab } from '../types'

const collectionStore = useCollectionStore()
const tabs: Array<{ value: DetailTab; label: string }> = [
  { value: 'attributes', label: '档案' },
  { value: 'story', label: '养成记录' },
]

const maid = computed(() => collectionStore.selectedMaid)
const bonuses = computed(() => getDerivedBonuses(maid.value))
const nextBonuses = computed(() => getNextLevelBonuses(maid.value))
const bonusPreview = computed(() => {
  return bonuses.value.map((bonus, index) => ({
    ...bonus,
    nextValue: nextBonuses.value[index]?.value ?? bonus.value,
  }))
})
const affectionTarget = computed(() => getStageTarget(maid.value.affection))
const affectionPercent = computed(() => Math.min((maid.value.affection / affectionTarget.value) * 100, 100))

const currentChapterId = computed(() => {
  const unlocked = maid.value.storyChapters.filter(c => isStoryUnlocked(maid.value, c))
  return unlocked.length > 0 ? unlocked[unlocked.length - 1].id : null
})

const expandedChapterId = ref<string | null>(null)

function selectTab(tab: DetailTab) {
  collectionStore.setActiveDetailTab(tab)
}

function toggleChapter(id: string) {
  expandedChapterId.value = expandedChapterId.value === id ? null : id
}

function getChapterBonuses(chapterId: string) {
  const results = []
  for (const b of maid.value.bonuses || []) {
    const ms = b.milestones?.find(m => m.chapterId === chapterId)
    if (ms) {
      results.push({
        name: b.name,
        description: b.description,
        value: ms.value,
        unit: b.unit
      })
    }
  }
  return results
}

const normalGiftsPool = ['精致的点心', '流行小说', '复古怀表', '晨露鲜花', '手调奶茶', '毛绒玩具']
const premiumGiftsPool = ['限量版八音盒', '古代遗物', '定制高定服装', '珠宝胸针', '绝版典藏诗集']

const currentNormalGift = ref(normalGiftsPool[Math.floor(Math.random() * normalGiftsPool.length)])
const currentPremiumGift = ref(premiumGiftsPool[Math.floor(Math.random() * premiumGiftsPool.length)])

const greetedMaids = ref<Record<string, boolean>>({})

const hasGreetedToday = computed(() => !!greetedMaids.value[maid.value.id])

function greet() {
  if (!hasGreetedToday.value) {
    collectionStore.giftSelected(1)
    greetedMaids.value[maid.value.id] = true
  }
}

function sendNormalGift() {
  collectionStore.giftSelected(10)
  currentNormalGift.value = normalGiftsPool[Math.floor(Math.random() * normalGiftsPool.length)]
}

function sendPremiumGift() {
  collectionStore.giftSelected(20)
  currentPremiumGift.value = premiumGiftsPool[Math.floor(Math.random() * premiumGiftsPool.length)]
}
</script>

<template>
  <transition name="detail-slide">
    <aside v-if="collectionStore.detailVisible" class="detail-panel">
      <div class="detail-backdrop" @click="collectionStore.closeDetail()"></div>

      <div class="detail-sheet">
        <header class="detail-header">
          <button class="close-button" type="button" @click="collectionStore.closeDetail()">关闭</button>
          <span class="detail-badge">{{ maid.rarity }} · {{ maid.role }}</span>
        </header>

        <section class="detail-hero" :style="{ background: maid.accent }">
          <svg class="detail-portrait-icon" xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.85;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <div class="detail-meta">
            <h2 style="margin: 0; font-size: 28px; line-height: 1; text-align: right; color: rgba(255,255,255,0.95);">{{ maid.name }}</h2>
            <span>Lv.{{ maid.level }}</span>
            <span>{{ getLoveStage(maid.affection) }}</span>
            <button 
              @click="collectionStore.setTeamSlot(maid.id, !maid.isInTeam)"
              style="margin-top: 8px; padding: 4px 12px; border-radius: 12px; font-size: 12px; cursor: pointer; transition: all 0.2s;"
              :style="{ 
                border: maid.isInTeam ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.3)', 
                background: maid.isInTeam ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', 
                color: '#fff',
                fontWeight: maid.isInTeam ? 'bold' : 'normal'
              }"
            >
              {{ maid.isInTeam ? '✓ 已上阵 (点击下阵)' : '+ 设为上阵' }}
            </button>
          </div>
        </section>

        <nav class="detail-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            :class="{ active: collectionStore.activeDetailTab === tab.value }"
            @click="selectTab(tab.value)"
          >
            {{ tab.label }}
          </button>
        </nav>

        <section v-if="collectionStore.activeDetailTab === 'attributes'" class="detail-content attributes-grid">
          <article class="panel-card">
            <h4>基础资料</h4>
            <dl class="stat-list compact">
              <div><dt>生日</dt><dd>{{ maid.profile.birthday }}</dd></div>
              <div><dt>身高</dt><dd>{{ maid.profile.height }} cm</dd></div>
              <div><dt>体重</dt><dd>{{ maid.profile.weight }} kg</dd></div>
              <div><dt>血型</dt><dd>{{ maid.profile.bloodType }}</dd></div>
              <div><dt>爱好</dt><dd>{{ maid.profile.hobby }}</dd></div>
              <div><dt>讨厌</dt><dd>{{ maid.profile.dislike }}</dd></div>
            </dl>
          </article>

          <article class="panel-card">
            <h4>功能加成</h4>
            <dl class="stat-list">
              <div v-for="bonus in bonuses" :key="bonus.name" :class="{ 'is-locked': !bonus.isUnlocked }" style="flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between; width: 100%;">
                  <dt>
                    {{ bonus.name }}
                    <span v-if="!bonus.isUnlocked" class="lock-icon" title="未解锁">🔒</span>
                  </dt>
                  <dd v-if="bonus.isUnlocked">
                    {{ bonus.description }} <span v-if="bonus.unit !== 'none'">+{{ formatBonusValue(bonus.value, bonus.unit) }}</span>
                  </dd>
                </div>
                <div v-if="bonus.unlockHint" style="font-size: 11px; color: #ffb6c1; text-align: right; opacity: 0.8;">
                  {{ bonus.unlockHint }}
                </div>
              </div>
            </dl>
          </article>

          <article class="panel-card full-span">
            <h4>女仆特长</h4>
            <ul class="skill-list">
              <li v-for="skill in maid.skills" :key="skill.name">
                <strong>{{ skill.name }}</strong>
                <p>{{ skill.description }}</p>
              </li>
            </ul>
          </article>
        </section>

        <!-- 原升级、亲密页签已被整合至 timeline-mode 中 -->

        <section v-else class="detail-content timeline-mode">
          <!-- 垂直时间线容器 -->
          <div class="timeline-container">
            <template v-for="chapter in maid.storyChapters" :key="chapter.id">
              
              <!-- 过去阶段：带有一点点弱化背景的单行节点 -->
              <div v-if="isStoryUnlocked(maid, chapter) && chapter.id !== currentChapterId" class="timeline-node past-node">
                <div class="timeline-track">
                  <div class="timeline-dot" :style="{ background: '#888', borderColor: '#888' }"></div>
                  <div class="timeline-line"></div>
                </div>
                <!-- 纯净的“名称 + 加成文字”组成的单行列表 -->
                <div class="past-row" style="flex-grow: 1; padding: 12px 14px; margin-bottom: 16px; background: rgba(255,255,255,0.06); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                  <strong style="color: rgba(255,255,255,0.7); font-size: 14px;">{{ chapter.title }}</strong>
                  <div class="chapter-bonuses" style="opacity: 0.8;" v-if="getChapterBonuses(chapter.id).length > 0">
                    <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" class="bonus-tag" style="background: transparent; border: 1px solid rgba(255,182,193,0.3); margin: 0 0 0 6px;">
                      {{ b.description }} <span v-if="b.unit !== 'none'">+{{ formatBonusValue(b.value, b.unit) }}</span>
                    </span>
                  </div>
                </div>
              </div>

              <!-- 当前阶段：高亮展开并内嵌互动功能 -->
              <div v-else-if="chapter.id === currentChapterId" class="timeline-node current-node">
                <div class="timeline-track">
                  <div class="timeline-dot" :style="{ background: maid.accent, boxShadow: `0 0 10px ${maid.accent}` }"></div>
                  <div class="timeline-line"></div>
                </div>
                <article class="panel-card timeline-card" style="border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.1); margin-bottom: 16px;">
                  <div class="chapter-header" style="margin-bottom: 12px;">
                     <!-- 直接显示阶段名称本身 -->
                     <h3 style="margin: 0 0 8px 0; font-size: 20px; color: #fff;">{{ chapter.title }}</h3>
                     <!-- 跟随加成效果说明 -->
                     <div class="chapter-bonuses" v-if="getChapterBonuses(chapter.id).length > 0">
                       <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" class="bonus-tag" style="font-size: 12px; padding: 4px 8px; margin-top: 0; margin-bottom: 8px;">
                         {{ b.description }} <span v-if="b.unit !== 'none'">+{{ formatBonusValue(b.value, b.unit) }}</span>
                       </span>
                     </div>
                  </div>
                  <!-- 正文容器 -->
                  <div class="chapter-body" style="border-top: none; padding-top: 0; margin-top: 0;">
                    <p style="font-size: 14px; opacity: 0.95; margin-bottom: 0;">{{ chapter.content }}</p>
                  </div>

                  <!-- 无缝衔接的互动区 -->
                  <div class="current-interactions" style="margin-top: 20px; padding-top: 16px; border-top: 1px dashed rgba(255,255,255,0.2);">
                    
                    <!-- 升级操作区 -->
                    <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
                       <div>
                         <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px;">当前训练等级</div>
                         <strong style="font-size: 18px;">Lv.{{ maid.level }}</strong>
                       </div>
                       <button class="primary-button" style="padding: 8px 20px; font-size: 14px;" type="button" @click="collectionStore.upgradeSelected()">
                         + 上升阶段
                       </button>
                    </div>

                    <!-- 好感度进度区 -->
                    <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
                      <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                        <span>羁绊状态: <strong>{{ getLoveStage(maid.affection) }}</strong></span>
                        <span style="font-family: monospace;">{{ maid.affection }} / {{ affectionTarget }}</span>
                      </div>
                      <div class="affection-track" style="margin-bottom: 16px;">
                        <div class="affection-fill" :style="{ width: `${affectionPercent}%`, background: maid.accent }"></div>
                      </div>
                      <div class="gift-actions" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <button class="secondary-button" style="font-size: 12px;" type="button" @click="greet" :disabled="hasGreetedToday" :style="{ opacity: hasGreetedToday ? 0.5 : 1 }">
                          {{ hasGreetedToday ? '今日已问候' : '问好 (+1)' }}
                        </button>
                        <button class="secondary-button" style="font-size: 12px;" type="button" @click="sendNormalGift">送普通礼物 (+10)</button>
                        <button class="primary-button" style="grid-column: span 2; font-size: 13px;" type="button" @click="sendPremiumGift">赠送高级礼物 (+20)</button>
                      </div>
                    </div>

                  </div>
                </article>
              </div>

              <!-- 后续阶段：锁定状态掩码卡片 -->
              <div v-else class="timeline-node future-node">
                <div class="timeline-track">
                  <div class="timeline-dot" style="background: transparent; border: 2px solid #555;"></div>
                  <div class="timeline-line"></div>
                </div>
                <article class="panel-card timeline-card" style="opacity: 0.6; filter: grayscale(1); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; min-height: 80px; margin-bottom: 16px;">
                  <div style="text-align: center;">
                    <span class="lock-icon" style="font-size: 24px; display: block; margin-bottom: 6px; opacity: 1;">🔒</span>
                    <small style="color: rgba(255,255,255,0.6);">需 <strong>Lv.{{ chapter.unlockLevel }}</strong> 且 好感度 <strong>{{ chapter.unlockAffection }}</strong></small>
                  </div>
                </article>
              </div>

            </template>
          </div>
        </section>
      </div>
    </aside>
  </transition>
</template>