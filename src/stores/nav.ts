import { defineStore } from 'pinia'
import { ref } from 'vue'

export type TabId = 'shop' | 'upgrade' | 'adventure' | 'equipment' | 'maid'

export const useNavStore = defineStore('nav', () => {
  const currentTab = ref<TabId>('maid') // 默认停留在女仆界面

  function switchTab(tab: TabId) {
    currentTab.value = tab
  }

  return {
    currentTab,
    switchTab
  }
})
