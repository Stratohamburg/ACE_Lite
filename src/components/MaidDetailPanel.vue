<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { formatBonusValue, getDerivedBonuses, getLoveStage, getNextLevelBonuses, getStageTarget, isStoryUnlocked } from '../utils/maids'
import type { DetailTab } from '../types'

const collectionStore = useCollectionStore()
const tabs: Array<{ value: DetailTab; label: string }> = [
  { value: 'attributes', label: '属性' },
  { value: 'upgrade', label: '训练' },
  { value: 'affection', label: '亲密' },
  { value: 'story', label: '阶段' },
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
                  <dd v-if="bonus.isUnlocked">{{ bonus.description }} +{{ formatBonusValue(bonus.value, bonus.unit) }}</dd>
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

        <section v-else-if="collectionStore.activeDetailTab === 'upgrade'" class="detail-content">
          <article class="panel-card">
            <h4>当前训练等级：{{ maid.level }}</h4>
          </article>

          <article class="panel-card mt-2">
            <h4>提升训练等级，将会解锁：</h4>
            <ul class="skill-list" style="margin-top: 8px;">
               <li v-for="chapter in maid.storyChapters.filter(c => c.unlockLevel === maid.level + 1)" :key="chapter.id">
                 <strong>开启新阶段：{{ chapter.title }}</strong>
               </li>
               <li v-if="maid.storyChapters.filter(c => c.unlockLevel === maid.level + 1).length === 0">
                 <em>提升等级可强化当前已解锁的能力</em>
               </li>
            </ul>
            <div style="margin-top: 16px;">
              <button class="primary-button wide" type="button" @click="collectionStore.upgradeSelected()">消耗「特训指南」进行训练</button>
            </div>
          </article>
        </section>

        <section v-else-if="collectionStore.activeDetailTab === 'affection'" class="detail-content">
          <article class="panel-card">
            <h4>亲密状态</h4>
            <p>{{ getLoveStage(maid.affection) }} · 当前亲密度 {{ maid.affection }} / {{ affectionTarget }}</p>
            <div class="affection-track">
              <div class="affection-fill" :style="{ width: `${affectionPercent}%`, background: maid.accent }"></div>
            </div>
            <div class="gift-actions" style="display: flex; flex-direction: column; gap: 8px;">
              <button class="secondary-button wide" type="button" @click="greet" :disabled="hasGreetedToday" :style="{ opacity: hasGreetedToday ? 0.5 : 1, cursor: hasGreetedToday ? 'not-allowed' : 'pointer' }">
                {{ hasGreetedToday ? '今天已问好' : '问好 +1' }}
              </button>
              <button class="secondary-button wide" type="button" @click="sendNormalGift">送普通礼物：{{ currentNormalGift }} +10</button>
              <button class="primary-button wide" type="button" @click="sendPremiumGift">送高级礼物：{{ currentPremiumGift }} +20</button>
            </div>
          </article>
        </section>

        <section v-else class="detail-content">
          <article class="panel-card">
            <h4>履历阶段记录</h4>
            <ul class="story-list">
              <li v-for="chapter in maid.storyChapters" :key="chapter.id" :class="{ unlocked: isStoryUnlocked(maid, chapter) }">
                <div class="chapter-header" :class="{ 'cursor-pointer': isStoryUnlocked(maid, chapter) }" @click="isStoryUnlocked(maid, chapter) && toggleChapter(chapter.id)">
                  <div class="chapter-header-main" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong style="margin-bottom: 0px;">{{ chapter.title }}</strong>
                    <div v-if="getChapterBonuses(chapter.id).length > 0" :style="{ opacity: isStoryUnlocked(maid, chapter) ? 1 : 0.5, filter: isStoryUnlocked(maid, chapter) ? 'none' : 'grayscale(1)' }">
                      <span v-for="b in getChapterBonuses(chapter.id)" :key="b.name" style="font-size: 12px; color: #ffb6c1;">
                        {{ b.description }} (+{{ formatBonusValue(b.value, b.unit) }})
                      </span>
                    </div>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <small>
                      {{ isStoryUnlocked(maid, chapter) ? '已解锁' : `需 Lv.${chapter.unlockLevel} 且 好感度 ${chapter.unlockAffection}` }}
                    </small>
                    <small>
                      <span v-if="isStoryUnlocked(maid, chapter)" class="expand-icon">{{ expandedChapterId === chapter.id ? '▼' : '▶' }}</span>
                      <span v-else class="expand-icon lock-icon">🔒</span>
                    </small>
                  </div>
                </div>
                <div class="chapter-body" v-show="expandedChapterId === chapter.id">
                  <p>{{ chapter.content }}</p>
                </div>
              </li>
            </ul>
          </article>
        </section>
      </div>
    </aside>
  </transition>
</template>