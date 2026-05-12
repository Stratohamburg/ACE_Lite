<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useCollectionStore } from '../stores/collection'
import { useEconomyStore } from '../stores/economy'
import { useViewportStore } from '../stores/viewport'
import type { DrawerMode, Maid } from '../types'
import { getLoveStage, getUnlockSummary } from '../utils/maids'

const collectionStore = useCollectionStore()
const economyStore = useEconomyStore()
const viewportStore = useViewportStore()

const drawerHeights: Record<DrawerMode, number> = {
  collapsed: 118,
  half: 378,
  expanded: 710,
}

const currentHeight = ref(drawerHeights[collectionStore.drawerMode])
const dragging = ref(false)
const drawerNotice = ref<{ tone: 'success' | 'danger'; message: string } | null>(null)
const DRAG_THRESHOLD = 8
let startHeight = 0
let startY = 0
let dragDistance = 0
let suppressHandleClick = false

watch(
  () => collectionStore.drawerMode,
  (mode) => {
    if (!dragging.value) {
      currentHeight.value = drawerHeights[mode]
    }
  },
  { immediate: true },
)

const drawerStyle = computed(() => ({
  height: `${currentHeight.value}px`,
}))

const showBackdrop = computed(() => collectionStore.drawerMode !== 'collapsed')

const sortedMaids = computed(() => {
  return [...collectionStore.maids].sort((left, right) => Number(right.unlocked) - Number(left.unlocked))
})

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  startY = event.clientY
  startHeight = currentHeight.value
  dragDistance = 0
  suppressHandleClick = false

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value) {
    return
  }

  const logicalDelta = (startY - event.clientY) / viewportStore.scale
  dragDistance = Math.max(dragDistance, Math.abs(logicalDelta))
  const nextHeight = Math.min(drawerHeights.expanded, Math.max(drawerHeights.collapsed, startHeight + logicalDelta))
  currentHeight.value = nextHeight
}

function onPointerUp() {
  const wasTap = dragDistance <= DRAG_THRESHOLD
  suppressHandleClick = true
  dragging.value = false

  if (wasTap) {
    const nextMode: DrawerMode = collectionStore.drawerMode === 'collapsed' ? 'expanded' : 'collapsed'
    collectionStore.setDrawerMode(nextMode)
    currentHeight.value = drawerHeights[nextMode]
  } else {
    const mode = getNearestMode(currentHeight.value)
    collectionStore.setDrawerMode(mode)
    currentHeight.value = drawerHeights[mode]
  }

  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
}

function getNearestMode(height: number): DrawerMode {
  const entries = Object.entries(drawerHeights) as Array<[DrawerMode, number]>
  return entries.reduce((closest, current) => {
    return Math.abs(current[1] - height) < Math.abs(closest[1] - height) ? current : closest
  })[0]
}

function onHandleClick() {
  if (suppressHandleClick) {
    suppressHandleClick = false
    return
  }

  const nextMode: DrawerMode = collectionStore.drawerMode === 'collapsed' ? 'expanded' : 'collapsed'
  collectionStore.setDrawerMode(nextMode)
}

function collapseDrawer() {
  if (collectionStore.drawerMode === 'collapsed') {
    return
  }

  collectionStore.setDrawerMode('collapsed')
}

function openMaid(maid: Maid) {
  if (!maid.unlocked) {
    collectionStore.selectMaid(maid.id)
    return
  }

  collectionStore.openDetail(maid.id)
}

function selectLockedMaid(maid: Maid) {
  collectionStore.selectMaid(maid.id)
}

function getUnlockState(maid: Maid) {
  return economyStore.getMaidUnlockState(maid)
}

function unlockMaid(maid: Maid) {
  const result = collectionStore.unlockMaid(maid.id)
  drawerNotice.value = {
    tone: result.ok ? 'success' : 'danger',
    message: result.message,
  }

  if (result.ok) {
    collectionStore.openDetail(maid.id)
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
})
</script>

<template>
  <button
    v-if="showBackdrop"
    class="drawer-backdrop"
    type="button"
    aria-label="关闭女仆列表"
    @click="collapseDrawer"
  ></button>

  <section class="maid-drawer" :class="{ dragging }" :style="drawerStyle">
    <button class="drawer-handle" type="button" @pointerdown="onPointerDown($event)" @click="onHandleClick">
      <span class="drawer-knob"></span>
      <span>女仆列表</span>
    </button>

    <div v-if="drawerNotice" class="drawer-status-banner" :class="`is-${drawerNotice.tone}`">{{ drawerNotice.message }}</div>

    <div class="maid-grid">
      <template v-for="maid in sortedMaids" :key="maid.id">
        <button
          v-if="maid.unlocked"
          class="maid-card"
          type="button"
          :class="{ selected: collectionStore.selectedMaidId === maid.id }"
          :style="{ background: maid.accent, boxShadow: `0 16px 30px ${maid.accentSoft}` }"
          @click="openMaid(maid)"
        >
          <span class="maid-card-topline">{{ maid.rarity }}</span>
          <div class="maid-card-portrait">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <strong>{{ maid.name }}</strong>
          <small class="maid-role">{{ maid.role }}</small>
          <small>{{ getLoveStage(maid.affection) }}</small>
        </button>

        <article
          v-else
          class="maid-card locked"
          :class="{ selected: collectionStore.selectedMaidId === maid.id }"
          @click="selectLockedMaid(maid)"
        >
          <span class="maid-card-topline">LOCKED</span>
          <div class="maid-card-portrait">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.8;">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <strong>未知女仆</strong>
          <small>{{ getUnlockSummary(maid) }}</small>
          <div class="maid-card-action-row">
            <button class="maid-unlock-btn" type="button" :class="`is-${getUnlockState(maid).tone}`" :disabled="getUnlockState(maid).disabled" @click.stop="unlockMaid(maid)">
              {{ getUnlockState(maid).label }}
            </button>
            <small class="maid-unlock-hint" :class="`is-${getUnlockState(maid).tone}`">{{ getUnlockState(maid).hint }}</small>
          </div>
        </article>
      </template>
    </div>
  </section>
</template>