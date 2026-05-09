import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { mockMaids } from '../data/mock'
import { generateMaidBonuses } from '../data/bonusConfig'
import type { DetailTab, DrawerMode, Maid } from '../types'
import { getLoveStage } from '../utils/maids'

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

  function upgradeSelected() {
    const maid = selectedMaid.value

    if (!maid || !maid.unlocked) {
      return
    }

    maid.level += 1
  }

  function giftSelected(amount = 20) {
    const maid = selectedMaid.value

    if (!maid || !maid.unlocked) {
      return
    }

    maid.affection += amount
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
    upgradeSelected,
    giftSelected,
    setShowcase,
    setTeamSlot,
    toggleUnlocked,
  }
})