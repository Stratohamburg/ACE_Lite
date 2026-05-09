import fs from 'fs'

const rawSrc = fs.readFileSync('src/data/mock.ts', 'utf-8')

// The file exports mockMaids. We can extract the JSON part.
const prefixRegex = /^import(?:\s|.)*?export\s+const\s+mockMaids[^=]*=\s*/
const prefixMatch = rawSrc.match(prefixRegex)

if (!prefixMatch) {
  console.log('Regex failed')
  process.exit(1)
}

const prefix = prefixMatch[0]
const rest = rawSrc.slice(prefix.length)

// We need to parse 'rest' as JSON or JS object. Since it was likely generated, it's mostly JSON + maybe some comments. But looking at the snippet, it's strictly JSON syntax or standard object syntax.
// Wait, if it has a trailing semicolon, we need to strip it before parse, or we can use `eval` securely since we control the source.
const dataStr = rest.replace(/;?\s*$/, '')
let maids;
try {
  // Try parsing as JSON first in case it's pure JSON
  let cleanStr = dataStr.replace(/,(\s*[\]}])/g, '$1') // remove trailing commas
  maids = JSON.parse(cleanStr)
} catch (e) {
  console.log("JSON parse failed, evaluating...")
  maids = eval('(' + dataStr + ')')
}

const bonusPool = [
  // 基础属性加成
  { name: '最大生命值', description: '提升队伍成员的最大生命值', unit: '%', isGrowth: true, scale: 2 },
  { name: '基础攻击力', description: '提升队伍成员的基础攻击力', unit: '%', isGrowth: true, scale: 2 },
  { name: '基础防御力', description: '提升队伍成员的基础防御力', unit: '%', isGrowth: true, scale: 1.5 },
  { name: '暴击率提升', description: '提升攻击时的暴击概率', unit: '%', isGrowth: false, scale: 0.5 },
  { name: '暴击伤害提升', description: '提升暴击时造成的伤害', unit: '%', isGrowth: true, scale: 3 },
  { name: '闪避率提升', description: '提升受到攻击时的闪避概率', unit: '%', isGrowth: false, scale: 0.5 },
  // 特殊效果
  { name: '绝境逢生', description: '生命值归零时，回复一定百分比的生命值（单局限1次）', unit: '%', isGrowth: true, scale: 5 },
  { name: '战意激增', description: '每击败一名敌人，攻击力临时提升', unit: '%', isGrowth: true, scale: 0.5 },
  { name: '首领特攻', description: '对精英和首领敌人造成的伤害增加', unit: '%', isGrowth: true, scale: 2.5 },
  // 背包
  { name: '背包扩容', description: '局内背包初始格子数增加', unit: '格', isGrowth: false, scale: 1, discrete: true },
  { name: '高价槽位', description: '局内背包的双倍结算格子数增加', unit: '格', isGrowth: false, scale: 1, discrete: true },
  { name: '死神快递', description: '探索阵亡时，可保留带回局外物资的百分比提升', unit: '%', isGrowth: true, scale: 5 },
  { name: '淘金热', description: '局内掉落的金币数量提升', unit: '%', isGrowth: true, scale: 3 },
]

// 随机打乱数组的 helper
function shuffle(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

maids.forEach(maid => {
  // 给每个角色随机取 3 个不同维度的 bonus
  const shuffledPool = shuffle([...bonusPool])
  const selectedBonuses = shuffledPool.slice(0, 3)

  maid.bonuses = selectedBonuses.map((bp, i) => {
    // 根据是成长还是固定值，分配阶段 milestones。
    // milestones 需要有 chapterId (story_1 到 story_10) 和 value。
    // 我们假设 3 个 bonus，分别主打不同阶段：
    // bonus 1: story_1, story_4, story_7, story_10
    // bonus 2: story_2, story_5, story_8
    // bonus 3: story_3, story_6, story_9

    let chapters = []
    if (i === 0) chapters = [1, 4, 7, 10]
    else if (i === 1) chapters = [2, 5, 8]
    else chapters = [3, 6, 9]

    const milestones = chapters.map(ch => {
      let val = bp.scale
      if (bp.discrete) {
        val = 1
      } else {
        // 后期给更多
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
      growthValue: bp.isGrowth && !bp.discrete ? parseFloat((bp.scale * 0.1).toFixed(2)) : 0,
      unit: bp.unit,
      milestones
    }
  })
})

const finalOutput = `import type { Maid } from '../types'

export const mockMaids: Maid[] = ${JSON.stringify(maids, null, 2)}
`

fs.writeFileSync('src/data/mock.ts', finalOutput, 'utf-8')
console.log('Bonuses refactored successfully.')