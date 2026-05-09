import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const BASE_WIDTH = 390
const BASE_HEIGHT = 844
const STAGE_PADDING = 48

export const useViewportStore = defineStore('viewport', () => {
  const stageWidth = ref(1200)
  const stageHeight = ref(900)

  const scale = computed(() => {
    const availableWidth = Math.max(stageWidth.value - STAGE_PADDING, 0)
    const availableHeight = Math.max(stageHeight.value - STAGE_PADDING, 0)
    return Math.min(availableWidth / BASE_WIDTH, availableHeight / BASE_HEIGHT)
  })

  const renderedWidth = computed(() => BASE_WIDTH * scale.value)
  const renderedHeight = computed(() => BASE_HEIGHT * scale.value)

  function setStageRect(width: number, height: number) {
    stageWidth.value = width
    stageHeight.value = height
  }

  return {
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
    stageWidth,
    stageHeight,
    scale,
    renderedWidth,
    renderedHeight,
    setStageRect,
  }
})