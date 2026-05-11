import type { MaidBonus, Maid } from '../types'

/**
 * 提取局外成长属性的定义。
 * 围绕“搜”、“打”、“撤”以及“背包功能”设计的女仆特长。
 */
export const BONUS_DICTIONARY: Record<string, Omit<MaidBonus, 'milestones'>> = {
  lucky_loot: {
    name: '拾荒直觉',
    description: '搜索容器时，获得高价值战利品的概率提升',
    unit: '%',
    growthValue: 0
  },
  death_delivery: {
    name: '死神速递',
    description: '撤离失败被击败时，背包内物品保留的概率增加',
    unit: '%',
    growthValue: 0
  },
  value_slots: {
    name: '暗格专家',
    description: '增加安全箱（保险箱）的初始容量',
    unit: '格',
    growthValue: 0
  },
  quick_loot: {
    name: '雷厉风行',
    description: '搜索容器和尸体所需的读条时间减少',
    unit: '%',
    growthValue: 0
  },
  loot_vision: {
    name: '鹰眼雷达',
    description: '进入新房间时，自动标记周围的高级战利品容器',
    unit: 'none',
    growthValue: 0
  },
  backpack_plus: {
    name: '负重训练',
    description: '增加战力背包系统最大负重量，减少超重惩罚',
    unit: 'kg',
    growthValue: 0
  }
}

/**
 * 根据女仆 ID 的哈希值确定性地生成符合局外养成系统的技能组合。
 */
export function generateMaidBonuses(maidId: string): MaidBonus[] {
  const hash = Array.from(maidId).reduce((acc, char) => acc + char.charCodeAt(0), 0)
  
  const keys = Object.keys(BONUS_DICTIONARY)
  // 为每个女仆随机（但确定）挑选 2 个专长
  const index1 = hash % keys.length
  const index2 = (hash * 3 + 7) % keys.length
  
  const selectedKeys = [keys[index1]]
  if (index1 !== index2) {
    selectedKeys.push(keys[index2])
  } else {
    selectedKeys.push(keys[(index1 + 1) % keys.length])
  }

  return selectedKeys.map((key, i) => {
    const template = BONUS_DICTIONARY[key]
    
    // 生成 milestones
    const milestones = [
      { chapterId: 'story_1', value: i === 0 ? 5 : 2 },
      { chapterId: 'story_4', value: i === 0 ? 10 : 5 },
      { chapterId: 'story_7', value: i === 0 ? 15 : 8 },
      { chapterId: 'story_10', value: i === 0 ? 25 : 12 }
    ]

    return {
      ...template,
      milestones
    }
  })
}

// 修改 applyDynamicBonuses 函数，给女仆赋予这套新技能
export function applyDynamicBonuses(maids: Maid[]) {
  maids.forEach(maid => {
    // 覆盖默认在 CSV 里读出来或者 Mock 的 bonus
    maid.bonuses = generateMaidBonuses(maid.id)
  })
}
