import type { MaidBonus } from '../types'

export interface BonusTemplate {
  name: string
  description: string
  unit: string
  isGrowth: boolean
  scale: number
  discrete?: boolean
}

export const BONUS_DICTIONARY: Record<string, BonusTemplate> = {
  max_hp: { name: '最大生命值', description: '提升队伍成员的最大生命值', unit: '%', isGrowth: true, scale: 2 },
  atk_base: { name: '基础攻击力', description: '提升队伍成员的基础攻击力', unit: '%', isGrowth: true, scale: 2 },
  def_base: { name: '基础防御力', description: '提升队伍成员的基础防御力', unit: '%', isGrowth: true, scale: 1.5 },
  crit_rate: { name: '暴击率提升', description: '提升攻击时的暴击概率', unit: '%', isGrowth: false, scale: 0.5 },
  crit_dmg: { name: '暴击伤害提升', description: '提升暴击时造成的伤害', unit: '%', isGrowth: true, scale: 3 },
  dodge_rate: { name: '闪避率提升', description: '提升受到攻击时的闪避概率', unit: '%', isGrowth: false, scale: 0.5 },
  revive: { name: '绝境逢生', description: '生命值归零时，回复一定百分比的生命值（单局限1次）', unit: '%', isGrowth: true, scale: 5 },
  battle_frenzy: { name: '战意激增', description: '每击败一名敌人，攻击力临时提升', unit: '%', isGrowth: true, scale: 0.5 },
  boss_killer: { name: '首领特攻', description: '对精英和首领敌人造成的伤害增加', unit: '%', isGrowth: true, scale: 2.5 },
  backpack_size: { name: '背包扩容', description: '局内背包初始格子数增加', unit: '格', isGrowth: false, scale: 1, discrete: true },
  backpack_double: { name: '高价槽位', description: '局内背包的双倍结算格子数增加', unit: '格', isGrowth: false, scale: 1, discrete: true },
  death_delivery: { name: '死神快递', description: '探索阵亡时，可保留带回局外物资的百分比提升', unit: '%', isGrowth: true, scale: 5 },
  gold_rush: { name: '淘金热', description: '局内掉落的金币数量提升', unit: '%', isGrowth: true, scale: 3 }
}

import maidsCsv from '../../configs/maids.csv?raw'

// 解析 CSV 配置到 MAPPING 表中
export const MAID_BONUS_MAPPING: Record<string, string[]> = {}

// configs/maids.csv format: id,name,profession,rarity,element,base_hp,base_atk,base_def,description,bonus_1,bonus_2,bonus_3
const lines = maidsCsv.trim().split('\n')
const headers = lines[0].trim().split(',')
const b1Idx = headers.indexOf('bonus_1')
const b2Idx = headers.indexOf('bonus_2')
const b3Idx = headers.indexOf('bonus_3')
const idIdx = headers.indexOf('id')

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim()
  if (!line) continue
  
  const cols = line.split(',')
  // The description column might contain commas (but here we just slice from right because bonus is at the end, or use simple split if no quotes are used)
  // Let's assume standard trailing cols
  const len = cols.length
  const bonus3 = cols[len - 1]
  const bonus2 = cols[len - 2]
  const bonus1 = cols[len - 3]
  
  // The id is always the first col (1001, etc.). In mock data it is "maid_001".
  const maidIdNumber = cols[idIdx].trim()
  const maidId = `maid_${String(Number(maidIdNumber) - 1000).padStart(3, '0')}` // map 1001 to maid_001

  MAID_BONUS_MAPPING[maidId] = [bonus1, bonus2, bonus3]
}

// 供系统读取配置并生成对应女仆的具体加成数据
export function generateMaidBonuses(maidId: string): MaidBonus[] {
  const bonusIds = MAID_BONUS_MAPPING[maidId] || ['max_hp', 'atk_base', 'def_base']
  
  return bonusIds.map((bonusId, i) => {
    const bp = BONUS_DICTIONARY[bonusId]
    if (!bp) {
      throw new Error(`未知加成ID: ${bonusId}`)
    }

    let chapters: number[] = []
    if (i === 0) chapters = [1, 4, 7, 10]
    else if (i === 1) chapters = [2, 5, 8]
    else chapters = [3, 6, 9]

    const milestones = chapters.map(ch => {
      let val = bp.scale
      if (bp.discrete) {
        val = 1
      } else {
        val = bp.scale * (1 + (ch * 0.2))
        val = Math.round(val * 10) / 10
      }
      return {
        chapterId: `story_${ch}`,
        value: val
      }
    })

    return {
      name: bp.name,
      description: bp.description,
      growthValue: bp.isGrowth && !bp.discrete ? Number((bp.scale * 0.1).toFixed(2)) : 0,
      unit: bp.unit,
      milestones
    }
  })
}