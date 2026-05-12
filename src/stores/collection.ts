import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockMaids } from '../data/mock'
import { generateMaidBonuses } from '../data/bonusConfig'
import type { DetailTab, DrawerMode, Maid } from '../types'
import { getLoveStage } from '../utils/maids'
import { useEconomyStore } from './economy'

function cloneMaids() {
  return mockMaids.map((maid) => ({
    ...maid,
    profile: { ...maid.profile },
    bonuses: generateMaidBonuses(maid.id),
    skills: maid.skills.map((skill) => ({ ...skill })),
    storyChapters: maid.storyChapters.map((chapter) => ({ ...chapter })),
  }))
}

export const useCollectionStore = defineStore('collection', () => {
  const economyStore = useEconomyStore()
  const maids = ref<Maid[]>(cloneMaids())
  const drawerMode = ref<DrawerMode>('collapsed')
  const detailVisible = ref(false)
  const activeDetailTab = ref<DetailTab>('attributes')
  const selectedMaidId = ref('maid_001')

  const selectedMaid = computed(() => maids.value.find((maid) => maid.id === selectedMaidId.value) ?? maids.value[0])
  const showcaseMaid = computed(() => maids.value.find((maid) => maid.isShowcase && maid.unlocked) ?? null)
  const teamMaids = computed(() => maids.value.filter((maid) => maid.isInTeam && maid.unlocked))
  const unlockedCount = computed(() => maids.value.filter((maid) => maid.unlocked).length)

  function setDrawerMode(mode: DrawerMode) {
    drawerMode.value = mode
  }

  function selectMaid(maidId: string) {
    selectedMaidId.value = maidId
  }

  function openDetail(maidId: string, tab: DetailTab = 'attributes') {
    const maid = maids.value.find((item) => item.id === maidId)

    if (!maid || !maid.unlocked) {
      selectedMaidId.value = maidId
      return
    }

    selectedMaidId.value = maidId
    activeDetailTab.value = tab
    detailVisible.value = true
    drawerMode.value = 'collapsed'
  }

  function closeDetail() {
    detailVisible.value = false
  }

  function setActiveDetailTab(tab: DetailTab) {
    activeDetailTab.value = tab
  }

  function giftSelected(amount = 20) {
    const maid = selectedMaid.value

    if (!maid || !maid.unlocked) {
      return false
    }

    if (amount > 1) {
      const result = economyStore.spendForGift(amount >= 20 ? 'premium' : 'normal')
      if (!result.ok) {
        alert(result.message)
        return false
      }
    }

    maid.affection += amount
    return true
  }

  function unlockMaid(maidId: string) {
    const maid = maids.value.find((item) => item.id === maidId)

    if (!maid) {
      return { ok: false, message: '目标女仆不存在' }
    }

    if (maid.unlocked) {
      return { ok: false, message: `${maid.name} 已解锁` }
    }

    const result = economyStore.spendForMaidUnlock(maid)
    if (!result.ok) {
      return result
    }

    maid.unlocked = true
    maid.unlockHint = '已解锁'
    selectedMaidId.value = maid.id

    return result
  }

  function setShowcase(maidId: string) {
    maids.value.forEach((maid) => {
      maid.isShowcase = maid.id === maidId && maid.unlocked
    })
    selectedMaidId.value = maidId
  }

  function setTeamSlot(maidId: string, inTeam: boolean) {
    const maid = maids.value.find((item) => item.id === maidId)
    if (!maid || !maid.unlocked) {
      return
    }

    if (inTeam && !maid.isInTeam && teamMaids.value.length >= 3) {
      alert('最多只能同时上阵 3 名女仆！')
      return
    }

    maid.isInTeam = inTeam
  }

  function toggleUnlocked(maidId: string) {
    const maid = maids.value.find((item) => item.id === maidId)
    if (!maid) {
      return
    }

    maid.unlocked = !maid.unlocked
    maid.unlockHint = maid.unlocked ? '已解锁' : '通关主线章节解锁'
    if (!maid.unlocked) {
      maid.isInTeam = false
      maid.isShowcase = false
      detailVisible.value = false
    }
  }

  const selectedLoveStage = computed(() => getLoveStage(selectedMaid.value?.affection ?? 0))

  return {
    maids,
    drawerMode,
    detailVisible,
    activeDetailTab,
    selectedMaidId,
    selectedMaid,
    showcaseMaid,
    teamMaids,
    unlockedCount,
    selectedLoveStage,
    setDrawerMode,
    selectMaid,
    openDetail,
    closeDetail,
    setActiveDetailTab,
    giftSelected,
    unlockMaid,
    setShowcase,
    setTeamSlot,
    toggleUnlocked,
  }
})