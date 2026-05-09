<script setup lang="ts">
import { useNavStore, type TabId } from '../stores/nav'

const navStore = useNavStore()

const tabs: { id: TabId, label: string, icon: string }[] = [
  { id: 'shop', label: '商店', icon: '🛒' },
  { id: 'upgrade', label: '升级', icon: '⭐' },
  { id: 'adventure', label: '冒险', icon: '⚔️' },
  { id: 'equipment', label: '装备', icon: '🛡️' },
  { id: 'maid', label: '女仆', icon: '🎀' } // 当前玩法
]
</script>

<template>
  <div class="bottom-nav-bar">
    <button 
      v-for="tab in tabs" 
      :key="tab.id"
      class="nav-btn"
      :class="{ active: navStore.currentTab === tab.id }"
      @click="navStore.switchTab(tab.id)"
    >
      <span class="nav-icon">{{ tab.icon }}</span>
      <span class="nav-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.bottom-nav-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 64px;
  background-color: #1a1a2e;
  border-top: 1px solid #333;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.5);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.nav-btn {
  flex: 1;
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #888;
  cursor: pointer;
  height: 100%;
  transition: all 0.2s ease;
  padding: 0;
}

.nav-btn.active {
  color: #ffb6c1; /* Theme pink */
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 2px;
  transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.nav-btn.active .nav-icon {
  transform: scale(1.2);
}

.nav-label {
  font-size: 12px;
  font-weight: bold;
}
</style>
