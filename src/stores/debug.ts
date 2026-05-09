import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DetailTab, DrawerMode } from '../types'

export const useDebugStore = defineStore('debug', () => {
  const enabled = ref(true)
  const useMock = ref(true)
  const showPhoneFrame = ref(true)
  const showSafeArea = ref(false)
  const lastAction = ref('初始化完成')

  function setDrawerMode(mode: DrawerMode) {
    lastAction.value = `调试切换抽屉状态: ${mode}`
  }

  function setTab(tab: DetailTab) {
    lastAction.value = `调试切换页签: ${tab}`
  }

  function toggleMock() {
    useMock.value = !useMock.value
    lastAction.value = `接口模式切换为: ${useMock.value ? 'Mock' : 'Real API'}`
  }

  function togglePhoneFrame() {
    showPhoneFrame.value = !showPhoneFrame.value
    lastAction.value = `手机边框: ${showPhoneFrame.value ? '显示' : '隐藏'}`
  }

  function toggleSafeArea() {
    showSafeArea.value = !showSafeArea.value
    lastAction.value = `安全区参考线: ${showSafeArea.value ? '显示' : '隐藏'}`
  }

  function logAction(message: string) {
    lastAction.value = message
  }

  return {
    enabled,
    useMock,
    showPhoneFrame,
    showSafeArea,
    lastAction,
    setDrawerMode,
    setTab,
    toggleMock,
    togglePhoneFrame,
    toggleSafeArea,
    logAction,
  }
})