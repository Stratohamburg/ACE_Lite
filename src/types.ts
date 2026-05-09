export type Rarity = 'R' | 'SR' | 'SSR'
export type DrawerMode = 'collapsed' | 'half' | 'expanded'
export type DetailTab = 'attributes' | 'upgrade' | 'affection' | 'story'
export type LoveStage = '陌生' | '熟悉' | '亲密' | '恋慕' | '誓约'

export interface MaidBonus {
  name: string
  description: string
  growthValue: number
  unit: string
  milestones: Array<{
    chapterId: string
    value: number
  }>
}

export interface ResolvedMaidBonus {
  name: string
  description: string
  value: number
  unit: string
  isUnlocked: boolean
  unlockHint?: string
}

export interface MaidSkill {
  name: string
  description: string
}

export interface MaidStoryChapter {
  id: string
  title: string
  unlockLevel: number
  unlockAffection: number
  content: string
}

export interface MaidProfile {
  birthday: string
  height: number
  weight: number
  bloodType: string
  hobby: string
  dislike: string
}

export interface Maid {
  id: string
  name: string
  rarity: Rarity
  role: string
  unlocked: boolean
  unlockHint: string
  level: number
  affection: number
  isInTeam: boolean
  isShowcase: boolean
  accent: string
  accentSoft: string
  portraitLabel: string
  profile: MaidProfile
  bonuses: MaidBonus[]
  skills: MaidSkill[]
  storyChapters: MaidStoryChapter[]
}

export type BaseMaidData = Omit<Maid, 'bonuses'>