import type { LoveStage, Maid, MaidStoryChapter, ResolvedMaidBonus } from '../types'

export function getLoveStage(affection: number): LoveStage {
  if (affection >= 1200) {
    return '誓约'
  }

  if (affection >= 700) {
    return '恋慕'
  }

  if (affection >= 300) {
    return '亲密'
  }

  if (affection >= 100) {
    return '熟悉'
  }

  return '陌生'
}

export function getStageTarget(affection: number): number {
  if (affection < 100) {
    return 100
  }

  if (affection < 300) {
    return 300
  }

  if (affection < 700) {
    return 700
  }

  if (affection < 1200) {
    return 1200
  }

  return 1200
}

export function getDerivedBonuses(maid: Maid): ResolvedMaidBonus[] {
  return (maid.bonuses ?? []).map((bonus) => {
    let unlockedBaseValue = 0
    let isUnlocked = false
    let unlockHint = undefined

    for (const ms of bonus.milestones || []) {
      const targetChapter = maid.storyChapters.find((ch) => ch.id === ms.chapterId)
      if (targetChapter) {
        if (isStoryUnlocked(maid, targetChapter)) {
          unlockedBaseValue += ms.value
          isUnlocked = true
        } else if (!unlockHint) {
          if (isUnlocked) {
            unlockHint = `下一阶段：在 [${targetChapter.title}] 阶段中再获取 +${formatBonusValue(ms.value, bonus.unit)}`
          } else {
            unlockHint = `在 [${targetChapter.title}] 阶段中解锁`
          }
        }
      }
    }

    return {
      name: bonus.name,
      description: bonus.description,
      unit: bonus.unit,
      value: unlockedBaseValue,
      isUnlocked,
      unlockHint,
    }
  })
}

export function isStoryUnlocked(maid: Maid, chapter: MaidStoryChapter): boolean {
  return maid.unlocked && maid.affection >= chapter.unlockAffection
}

export function getUnlockSummary(maid: Maid): string {
  if (maid.unlocked) {
    return '已解锁'
  }

  return maid.unlockHint
}

export function formatBonusValue(value: number, unit: string): string {
  const normalized = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${normalized}${unit}`
}