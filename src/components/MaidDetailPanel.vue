<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { useEconomyStore } from '../stores/economy'
import { formatBonusValue, getDerivedBonuses, getLoveStage, isStoryUnlocked } from '../utils/maids'

const collectionStore = useCollectionStore()
const economyStore = useEconomyStore()

const profilePopupVisible = ref(false)

function togglePopup() {
  profilePopupVisible.value = !profilePopupVisible.value
}

const maid = computed(() => collectionStore.selectedMaid)
const bonuses = computed(() => getDerivedBonuses(maid.value))
const normalGiftCost = computed(() => economyStore.getGiftCost('normal'))
const premiumGiftCost = computed(() => economyStore.getGiftCost('premium'))
const canSendNormalGift = computed(() => economyStore.canAffordGift('normal'))
const canSendPremiumGift = computed(() => economyStore.canAffordGift('premium'))

const currentChapterId = computed(() => {
  const unlocked = maid.value.storyChapters.filter(c => isStoryUnlocked(maid.value, c))
  return unlocked.length > 0 ? unlocked[unlocked.length - 1].id : null
})

const currentChapterIndex = computed(() => maid.value.storyChapters.findIndex((chapter) => chapter.id === currentChapterId.value))
const currentChapter = computed(() => maid.value.storyChapters[currentChapterIndex.value] ?? null)
const nextChapter = computed(() => {
  if (currentChapterIndex.value < 0) {
    return null
  }

  return maid.value.storyChapters[currentChapterIndex.value + 1] ?? null
})
const currentStageFloor = computed(() => currentChapter.value?.unlockAffection ?? 0)
const currentStageCeiling = computed(() => nextChapter.value?.unlockAffection ?? currentStageFloor.value)
const currentStageProgressPercent = computed(() => {
  if (!nextChapter.value) {
    return 100
  }

  const segment = currentStageCeiling.value - currentStageFloor.value
  if (segment <= 0) {
    return 100
  }

  const progress = (maid.value.affection - currentStageFloor.value) / segment
  return Math.min(Math.max(progress * 100, 0), 100)
})
const currentStageProgressLabelOffset = computed(() => Math.min(Math.max(currentStageProgressPercent.value, 8), 92))
const currentStageProgressLabel = computed(() => {
  if (!nextChapter.value) {
    return '已抵达最终阶段'
  }

  return `${maid.value.affection} / ${currentStageCeiling.value}`
})
const currentStageProgressHint = computed(() => {
  if (!nextChapter.value) {
    return '当前阶段已全部完成'
  }

  const remaining = Math.max(currentStageCeiling.value - maid.value.affection, 0)
  return `距下一阶段还差 ${remaining} 好感`
})

const expandedChapterId = ref<string | null>(null)

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
const greetAffectionBonus = 1
const normalGiftAffectionBonus = 10
const premiumGiftAffectionBonus = 20

const currentNormalGift = ref(normalGiftsPool[Math.floor(Math.random() * normalGiftsPool.length)])
const currentPremiumGift = ref(premiumGiftsPool[Math.floor(Math.random() * premiumGiftsPool.length)])

const greetedMaids = ref<Record<string, boolean>>({})

const hasGreetedToday = computed(() => !!greetedMaids.value[maid.value.id])

function getItemIcon(itemId: string) {
  const icons: Record<string, string> = {
    normalGift: '🎁',
    premiumGift: '💝',
  }

  return icons[itemId] ?? '📦'
}

function greet() {
  if (!hasGreetedToday.value) {
    const applied = collectionStore.giftSelected(greetAffectionBonus)
    if (applied) {
      greetedMaids.value[maid.value.id] = true
    }
  }
}

function sendNormalGift() {
  const applied = collectionStore.giftSelected(normalGiftAffectionBonus)
  if (applied) {
    currentNormalGift.value = normalGiftsPool[Math.floor(Math.random() * normalGiftsPool.length)]
  }
}

function sendPremiumGift() {
  const applied = collectionStore.giftSelected(premiumGiftAffectionBonus)
  if (applied) {
    currentPremiumGift.value = premiumGiftsPool[Math.floor(Math.random() * premiumGiftsPool.length)]
  }
}
</script>

<template>
  <transition name="detail-slide">
    <aside v-if="collectionStore.detailVisible" class="detail-panel">
      <div class="detail-backdrop" @click="collectionStore.closeDetail()"></div>

      <div class="detail-sheet">
        <header class="detail-header">
          <button class="close-button" type="button" @click="collectionStore.closeDetail()">关闭</button>
          <button 
            type="button" 
            style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 12px; font-size: 13px; cursor: pointer;"
            @click="togglePopup()"
          >
            {{ profilePopupVisible ? '收起资料 ▼' : '基础资料 ▶' }}
          </button>
          <span class="detail-badge" style="justify-self: end;">{{ maid.rarity }} · {{ maid.role }}</span>
        </header>

        <!-- 滑出的基础资料面板 -->
        <transition name="story-expand">
          <div v-show="profilePopupVisible" class="profile-popup" style="background: #2a2a2a; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); border-radius: 12px; margin-bottom: 8px;">
            <dl class="stat-list compact" style="margin: 0; font-size: 13px;">
              <div style="margin-bottom: 4px;"><dt>生日</dt><dd>{{ maid.profile.birthday }}</dd></div>
              <div style="margin-bottom: 4px;"><dt>身高</dt><dd>{{ maid.profile.height }} cm</dd></div>
              <div style="margin-bottom: 4px;"><dt>体重</dt><dd>{{ maid.profile.weight }} kg</dd></div>
              <div style="margin-bottom: 4px;"><dt>血型</dt><dd>{{ maid.profile.bloodType }}</dd></div>
              <div style="margin-bottom: 4px;"><dt>爱好</dt><dd>{{ maid.profile.hobby }}</dd></div>
              <div><dt>讨厌</dt><dd>{{ maid.profile.dislike }}</dd></div>
            </dl>
          </div>
        </transition>

        <section class="detail-hero" :style="{ background: maid.accent }">
          <svg class="detail-portrait-icon" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.85;">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <div class="detail-meta">
            <h2 style="margin: 0; font-size: 24px; line-height: 1; text-align: right; color: rgba(255,255,255,0.95);">{{ maid.name }}</h2>
            <span style="font-size: 13px;">{{ getLoveStage(maid.affection) }}</span>
            <button 
              @click="collectionStore.setTeamSlot(maid.id, !maid.isInTeam)"
              style="margin-top: 6px; padding: 3px 10px; border-radius: 10px; font-size: 11px; cursor: pointer; transition: all 0.2s;"
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

        <section class="detail-content timeline-mode">
          <!-- 垂直时间线容器 -->
          <div class="timeline-container">
            <template v-for="chapter in maid.storyChapters" :key="chapter.id">
              
              <!-- 过去阶段：带有一点点弱化背景的单行节点 -->
              <div v-if="isStoryUnlocked(maid, chapter) && chapter.id !== currentChapterId" class="timeline-node past-node">
                <div class="timeline-track">
                  <div class="timeline-dot" :style="{ background: maid.accent, borderColor: maid.accent, opacity: 1 }"></div>
                  <div class="timeline-line" :style="{ width: '6px', borderLeftWidth: '0', background: maid.accent, borderRadius: '999px', opacity: 1 }"></div>
                </div>
                <!-- 纯净的“名称 + 加成文字”组成的单行列表 -->
                <div style="flex-grow: 1; margin-bottom: 10px;">
                  <div class="past-row" @click="toggleChapter(chapter.id)" style="cursor: pointer; padding: 10px 12px; background: rgba(255,255,255,0.06); border-radius: 8px; display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <span style="font-size: 10px; color: rgba(255,255,255,0.5);">{{ expandedChapterId === chapter.id ? '▼' : '▶' }}</span>
                      <strong style="color: rgba(255,255,255,0.7); font-size: 13px;">{{ chapter.title }}</strong>
                    </div>
                    <div class="chapter-bonuses" style="opacity: 0.8;" v-if="getChapterBonuses(chapter.id).length > 0">
                      <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" class="bonus-tag" style="background: transparent; border: 1px solid rgba(255,182,193,0.3); margin: 0 0 0 4px; padding: 1px 5px; font-size: 10px;">
                        {{ b.description }} <span v-if="b.unit !== 'none'">+{{ formatBonusValue(b.value, b.unit) }}</span>
                      </span>
                    </div>
                  </div>
                  <!-- 正文下拉 -->
                  <transition name="story-expand">
                    <div v-show="expandedChapterId === chapter.id" class="chapter-body" style="border-top: none; padding: 6px 12px 4px 12px; margin: 0; background: rgba(0,0,0,0.15); border-radius: 0 0 8px 8px; margin-top: -6px;">
                      <p style="font-size: 12px; opacity: 0.8; margin-bottom: 6px;">{{ chapter.content }}</p>
                    </div>
                  </transition>
                </div>
              </div>

              <!-- 当前阶段：高亮展示当前故事 -->
              <div v-else-if="chapter.id === currentChapterId" class="timeline-node current-node">
                <div class="timeline-track">
                  <div class="timeline-dot" :style="{ background: maid.accent, boxShadow: `0 0 12px ${maid.accent}`, width: '16px', height: '16px', marginTop: '6px', border: '2px solid #fff' }"></div>
                  <div class="timeline-line"></div>
                  <div v-if="nextChapter" class="timeline-progress-rail" :aria-label="`当前阶段好感进度 ${currentStageProgressLabel}`">
                    <div class="timeline-progress-fill" :style="{ height: `${currentStageProgressPercent}%`, background: maid.accent, boxShadow: `0 0 10px ${maid.accent}` }"></div>
                  </div>
                  <div v-if="nextChapter" class="timeline-progress-label" :style="{ top: `${currentStageProgressLabelOffset}%` }">{{ currentStageProgressLabel }}</div>
                </div>
                <article class="panel-card timeline-card" style="border: 1px solid rgba(255,255,255,0.25); background: rgba(255,255,255,0.1); margin-bottom: 12px; padding: 10px;">
                  <div class="chapter-header" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start;">
                     <div>
                       <!-- 直接显示阶段名称本身 -->
                       <h3 style="margin: 0 0 6px 0; font-size: 18px; color: #fff;">{{ chapter.title }}</h3>
                       <!-- 跟随加成效果说明 -->
                       <div class="chapter-bonuses" v-if="getChapterBonuses(chapter.id).length > 0">
                         <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" class="bonus-tag" style="font-size: 11px; padding: 2px 6px; margin-top: 0; margin-bottom: 6px;">
                           {{ b.description }} <span v-if="b.unit !== 'none'">+{{ formatBonusValue(b.value, b.unit) }}</span>
                         </span>
                       </div>
                     </div>
                     <button type="button" @click="toggleChapter(chapter.id)" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; color: rgba(255,255,255,0.8); font-size: 11px; padding: 4px 10px; cursor: pointer;">
                        {{ expandedChapterId === chapter.id ? '收起故事 ▼' : '阅读故事 ▶' }}
                     </button>
                  </div>
                  <!-- 正文容器 -->
                  <transition name="story-expand">
                    <div v-show="expandedChapterId === chapter.id" class="chapter-body" style="border-top: none; padding-top: 0; margin-top: 0;">
                      <p style="font-size: 13px; opacity: 0.95; margin-bottom: 0;">{{ chapter.content }}</p>
                    </div>
                  </transition>
                </article>
              </div>

              <!-- 后续阶段：锁定状态掩码卡片 -->
              <div v-else class="timeline-node future-node">
                <div class="timeline-track">
                  <div class="timeline-dot" style="background: transparent; border: 2px solid #555;"></div>
                  <div class="timeline-line"></div>
                </div>
                <article class="panel-card timeline-card" style="opacity: 0.6; filter: grayscale(1); background: rgba(0,0,0,0.3); min-height: 60px; margin-bottom: 12px; padding: 10px; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                  <div style="text-align: center; margin-bottom: 4px;">
                    <span class="lock-icon" style="font-size: 16px; display: block; margin-bottom: 2px; opacity: 1;">🔒 {{ chapter.title }}</span>
                    <small style="color: rgba(255,255,255,0.6); font-size: 11px;">需好感度 <strong>{{ chapter.unlockAffection }}</strong></small>
                  </div>
                  <div class="chapter-bonuses" v-if="getChapterBonuses(chapter.id).length > 0">
                    <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" class="bonus-tag" style="font-size: 11px; padding: 2px 6px; border: 1px solid rgba(255,255,255,0.3); background: transparent; color: #ccc;">
                      {{ b.description }} <span v-if="b.unit !== 'none'">+{{ formatBonusValue(b.value, b.unit) }}</span>
                    </span>
                  </div>
                </article>
              </div>

            </template>
          </div>
        </section>

        <div class="detail-action-stack">
          <section class="detail-affection-bar">
            <div class="detail-affection-actions">
              <button class="secondary-button detail-affection-button" type="button" @click="greet" :disabled="hasGreetedToday" :style="{ opacity: hasGreetedToday ? 0.5 : 1 }">
                <span class="detail-affection-button-main">{{ hasGreetedToday ? '今日已问好' : '问好' }}</span>
                <span class="detail-affection-button-sub">每日 1 次 · 好感 +{{ greetAffectionBonus }}</span>
              </button>
              <button class="secondary-button detail-affection-button" type="button" :disabled="!canSendNormalGift" @click="sendNormalGift">
                <span class="detail-affection-button-main">
                  <span aria-hidden="true">{{ getItemIcon(normalGiftCost.itemId) }}</span>
                  <span>{{ currentNormalGift }}</span>
                </span>
                <span class="detail-affection-button-sub">所需 {{ normalGiftCost.amount }} · 好感 +{{ normalGiftAffectionBonus }}</span>
                <span class="detail-affection-button-owned">持有 {{ normalGiftCost.owned }}</span>
              </button>
              <button class="primary-button detail-affection-button" type="button" :disabled="!canSendPremiumGift" @click="sendPremiumGift">
                <span class="detail-affection-button-main">
                  <span aria-hidden="true">{{ getItemIcon(premiumGiftCost.itemId) }}</span>
                  <span>{{ currentPremiumGift }}</span>
                </span>
                <span class="detail-affection-button-sub">所需 {{ premiumGiftCost.amount }} · 好感 +{{ premiumGiftAffectionBonus }}</span>
                <span class="detail-affection-button-owned">持有 {{ premiumGiftCost.owned }}</span>
              </button>
            </div>

            <div class="detail-affection-hints">
              <span>{{ currentNormalGift }} 库存实时校验</span>
              <span>{{ currentPremiumGift }} 库存实时校验</span>
            </div>
          </section>
        </div>
      </div>
    </aside>
  </transition>
</template>