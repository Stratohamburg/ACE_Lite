import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { ShopItemConfig } from '../data/configLoader'
import type { Maid } from '../types'

type PriceType = '免费' | '金币' | '钻石' | '人民币'
type ItemId = 'gachaToken' | 'enhancementStone' | 'normalGift' | 'premiumGift'
type GiftKind = 'normal' | 'premium'
type EquipmentRarity = 'normal' | 'rare' | 'epic'

interface ActionResult {
  ok: boolean
  message: string
}

interface ActionState {
  disabled: boolean
  label: string
  hint: string
  tone: 'ready' | 'danger' | 'muted'
}

export interface MaidActionCost {
  itemId: ItemId
  itemName: string
  amount: number
  owned: number
}

export interface EquipmentInventoryItem {
  id: string
  part: string
  name: string
  rarity: EquipmentRarity
  level: number
  attack: number
  critRate: number
}

const GACHA_DIAMOND_COST = 150
const PROTAGONIST_UPGRADE_COST = 2000
const EQUIPMENT_STRENGTHEN_GOLD_COST = 8000
const EQUIPMENT_STRENGTHEN_STONE_COST = 10

function formatCompactAmount(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k`
  }

  return `${value}`
}

function parseMaidSequence(maidId: string) {
  const numericSegment = Number(maidId.split('_')[1] ?? 1)
  return Number.isFinite(numericSegment) && numericSegment > 0 ? numericSegment : 1
}

function createInitialEquipments(): EquipmentInventoryItem[] {
  return [
    { id: 'equip_001', part: '武器', name: '【破败之刃】', rarity: 'epic', level: 20, attack: 1200, critRate: 5 },
    { id: 'equip_002', part: '头盔', name: '钛合金战盔', rarity: 'rare', level: 16, attack: 420, critRate: 1.5 },
    { id: 'equip_003', part: '武器', name: '制式冲锋枪', rarity: 'normal', level: 12, attack: 360, critRate: 0.5 },
    { id: 'equip_004', part: '头盔', name: '鹰眼战术头环', rarity: 'rare', level: 18, attack: 510, critRate: 2 },
    { id: 'equip_005', part: '鞋子', name: '流火长靴', rarity: 'epic', level: 22, attack: 760, critRate: 3.5 },
    { id: 'equip_006', part: '饰品', name: '银辉吊坠', rarity: 'normal', level: 10, attack: 240, critRate: 0.8 },
    { id: 'equip_007', part: '饰品', name: '裂空徽记', rarity: 'normal', level: 11, attack: 280, critRate: 1 },
    { id: 'equip_008', part: '衣服', name: '夜幕礼装', rarity: 'epic', level: 19, attack: 690, critRate: 2.4 },
  ]
}

export const useEconomyStore = defineStore('economy', () => {
  const gold = ref(50200)
  const diamonds = ref(1500)
  const items = ref<Record<ItemId, number>>({
    gachaToken: 0,
    enhancementStone: 30,
    normalGift: 8,
    premiumGift: 3,
  })
  const purchaseCounts = ref<Record<number, number>>({})

  const protagonistLevel = ref(45)
  const protagonistPower = ref(125000)

  const equipmentInventory = ref<EquipmentInventoryItem[]>(createInitialEquipments())
  const selectedEquipmentId = ref(equipmentInventory.value[0]?.id ?? '')

  const goldLabel = computed(() => formatCompactAmount(gold.value))
  const diamondLabel = computed(() => formatCompactAmount(diamonds.value))
  const gachaTokenCount = computed(() => items.value.gachaToken ?? 0)
  const enhancementStoneCount = computed(() => items.value.enhancementStone ?? 0)
  const normalGiftCount = computed(() => items.value.normalGift ?? 0)
  const premiumGiftCount = computed(() => items.value.premiumGift ?? 0)
  const protagonistUpgradeCost = computed(() => PROTAGONIST_UPGRADE_COST)
  const equipmentStrengthenGoldCost = computed(() => EQUIPMENT_STRENGTHEN_GOLD_COST)
  const equipmentStrengthenStoneCost = computed(() => EQUIPMENT_STRENGTHEN_STONE_COST)
  const selectedEquipment = computed(() => equipmentInventory.value.find((item) => item.id === selectedEquipmentId.value) ?? null)

  function getPurchaseCount(shopItemId: number) {
    return purchaseCounts.value[shopItemId] ?? 0
  }

  function getItemCount(itemId: ItemId) {
    return items.value[itemId] ?? 0
  }

  function addGold(amount: number) {
    gold.value += amount
  }

  function addDiamonds(amount: number) {
    diamonds.value += amount
  }

  function addItem(itemId: ItemId, amount: number) {
    items.value[itemId] = getItemCount(itemId) + amount
  }

  function grantGold(amount: number) {
    addGold(amount)
  }

  function grantDiamonds(amount: number) {
    addDiamonds(amount)
  }

  function grantItem(itemId: ItemId, amount: number) {
    addItem(itemId, amount)
  }

  function getItemLabel(itemId: ItemId) {
    const itemLabels: Record<ItemId, string> = {
      gachaToken: '抽卡代币',
      enhancementStone: '强化石',
      normalGift: '普通礼盒',
      premiumGift: '高级礼盒',
    }

    return itemLabels[itemId]
  }

  function spendItem(itemId: ItemId, amount: number) {
    if (getItemCount(itemId) < amount) {
      return false
    }

    items.value[itemId] -= amount
    return true
  }

  function canAffordPrice(priceType: PriceType, amount: number) {
    if (priceType === '免费') {
      return true
    }

    if (priceType === '金币') {
      return gold.value >= amount
    }

    if (priceType === '钻石') {
      return diamonds.value >= amount
    }

    return false
  }

  function getPriceShortage(priceType: PriceType, amount: number) {
    if (priceType === '金币') {
      return Math.max(amount - gold.value, 0)
    }

    if (priceType === '钻石') {
      return Math.max(amount - diamonds.value, 0)
    }

    return 0
  }

  function getPriceShortageHint(priceType: PriceType, amount: number) {
    const shortage = getPriceShortage(priceType, amount)
    return shortage > 0 ? `还差 ${shortage} ${priceType}` : ''
  }

  function spendPrice(priceType: PriceType, amount: number): ActionResult {
    if (priceType === '免费') {
      return { ok: true, message: '领取成功' }
    }

    if (!canAffordPrice(priceType, amount)) {
      return { ok: false, message: `${priceType}不足` }
    }

    if (priceType === '金币') {
      gold.value -= amount
    }

    if (priceType === '钻石') {
      diamonds.value -= amount
    }

    return { ok: true, message: `${priceType}消耗 -${amount}` }
  }

  function isShopItemSoldOut(item: ShopItemConfig) {
    return getPurchaseCount(item.id) >= item.buy_limit
  }

  function getShopItemState(item: ShopItemConfig): ActionState {
    if (item.price_type === '人民币') {
      return {
        disabled: true,
        label: '待接支付',
        hint: '该礼包将在接入支付后开放',
        tone: 'muted',
      }
    }

    if (isShopItemSoldOut(item)) {
      return {
        disabled: true,
        label: '限购已满',
        hint: '本期库存已售完，等待下次刷新',
        tone: 'muted',
      }
    }

    if (!canAffordPrice(item.price_type as PriceType, item.price_value)) {
      return {
        disabled: true,
        label: `${item.price_type}不足`,
        hint: getPriceShortageHint(item.price_type as PriceType, item.price_value),
        tone: 'danger',
      }
    }

    if (item.price_type === '免费') {
      return {
        disabled: false,
        label: '立即领取',
        hint: item.buy_limit < 99 ? `剩余 ${Math.max(item.buy_limit - getPurchaseCount(item.id), 0)} 次` : '可领取',
        tone: 'ready',
      }
    }

    return {
      disabled: false,
      label: `${item.price_type}: ${item.price_value}`,
      hint: item.buy_limit < 99 ? `剩余 ${Math.max(item.buy_limit - getPurchaseCount(item.id), 0)} / ${item.buy_limit}` : '可重复购买',
      tone: 'ready',
    }
  }

  function canPurchaseShopItem(item: ShopItemConfig) {
    return !getShopItemState(item).disabled
  }

  function applyShopReward(item: ShopItemConfig) {
    switch (item.id) {
      case 2001:
        addGold(2000)
        addDiamonds(100)
        return '领取补给: 金币 +2000, 钻石 +100'
      case 2002:
        addItem('gachaToken', 1)
        return '获得 抽卡代币 x1'
      case 2003:
        addItem('enhancementStone', 10)
        return '获得 初级强化石 x10'
      default:
        return `${item.item_name} 已入账`
    }
  }

  function purchaseShopItem(item: ShopItemConfig): ActionResult {
    if (item.price_type === '人民币') {
      return { ok: false, message: '当前版本未接入付费购买' }
    }

    if (isShopItemSoldOut(item)) {
      return { ok: false, message: `${item.item_name} 已达限购` }
    }

    const result = spendPrice(item.price_type as PriceType, item.price_value)
    if (!result.ok) {
      return result
    }

    purchaseCounts.value[item.id] = getPurchaseCount(item.id) + 1
    return { ok: true, message: applyShopReward(item) }
  }

  function canPerformGacha(times: number) {
    const tokenUsage = Math.min(gachaTokenCount.value, times)
    const diamondNeeded = (times - tokenUsage) * GACHA_DIAMOND_COST
    return diamonds.value >= diamondNeeded
  }

  function getGachaActionState(times: number): ActionState {
    const tokenUsage = Math.min(gachaTokenCount.value, times)
    const diamondNeeded = (times - tokenUsage) * GACHA_DIAMOND_COST

    if (!canPerformGacha(times)) {
      return {
        disabled: true,
        label: '资源不足',
        hint: `还差 ${Math.max(diamondNeeded - diamonds.value, 0)} 钻石`,
        tone: 'danger',
      }
    }

    const segments = []
    if (tokenUsage > 0) {
      segments.push(`代币 x${tokenUsage}`)
    }
    if (diamondNeeded > 0) {
      segments.push(`钻石 ${diamondNeeded}`)
    }

    return {
      disabled: false,
      label: '可抽取',
      hint: `本次将消耗 ${segments.join(' + ') || '免费次数'}`,
      tone: 'ready',
    }
  }

  function spendForGacha(times: number): ActionResult {
    const tokenUsage = Math.min(gachaTokenCount.value, times)
    const diamondNeeded = (times - tokenUsage) * GACHA_DIAMOND_COST

    if (!canPerformGacha(times)) {
      return { ok: false, message: `抽卡资源不足，需要额外 ${diamondNeeded} 钻石` }
    }

    if (tokenUsage > 0) {
      spendItem('gachaToken', tokenUsage)
    }

    if (diamondNeeded > 0) {
      diamonds.value -= diamondNeeded
    }

    const segments = []
    if (tokenUsage > 0) {
      segments.push(`抽卡代币 -${tokenUsage}`)
    }
    if (diamondNeeded > 0) {
      segments.push(`钻石 -${diamondNeeded}`)
    }

    return { ok: true, message: segments.join('，') || '抽卡完成' }
  }

  function getGiftCost(kind: GiftKind): MaidActionCost {
    const itemId = kind === 'normal' ? 'normalGift' : 'premiumGift'
    return {
      itemId,
      itemName: getItemLabel(itemId),
      amount: 1,
      owned: getItemCount(itemId),
    }
  }

  function getMaidUnlockCost(maid: Pick<Maid, 'id' | 'rarity'>) {
    const baseByRarity = {
      R: 240,
      SR: 520,
      SSR: 880,
    }
    const sequence = Math.max(parseMaidSequence(maid.id) - 5, 1)
    return baseByRarity[maid.rarity] + (sequence - 1) * 40
  }

  function getMaidUnlockState(maid: Pick<Maid, 'id' | 'rarity' | 'unlocked' | 'unlockHint'>): ActionState {
    if (maid.unlocked) {
      return {
        disabled: true,
        label: '已解锁',
        hint: '已加入可用名册',
        tone: 'ready',
      }
    }

    const cost = getMaidUnlockCost(maid)
    if (diamonds.value < cost) {
      return {
        disabled: true,
        label: `钻石不足 · 💎 ${cost}`,
        hint: `${maid.unlockHint}，${getPriceShortageHint('钻石', cost)}`,
        tone: 'danger',
      }
    }

    return {
      disabled: false,
      label: `快速签约 · 💎 ${cost}`,
      hint: `${maid.unlockHint}，或消耗钻石直接签约`,
      tone: 'ready',
    }
  }

  function spendForMaidUnlock(maid: Pick<Maid, 'id' | 'name' | 'rarity' | 'unlocked'>): ActionResult {
    if (maid.unlocked) {
      return { ok: false, message: `${maid.name} 已解锁` }
    }

    const cost = getMaidUnlockCost(maid)
    if (diamonds.value < cost) {
      return { ok: false, message: `钻石不足，${getPriceShortageHint('钻石', cost)}` }
    }

    diamonds.value -= cost
    return { ok: true, message: `已与 ${maid.name} 完成快速签约，钻石 -${cost}` }
  }

  function canAffordGift(kind: GiftKind) {
    const cost = getGiftCost(kind)
    return cost.owned >= cost.amount
  }

  function spendForGift(kind: GiftKind): ActionResult {
    const cost = getGiftCost(kind)
    if (cost.owned < cost.amount) {
      return { ok: false, message: `${cost.itemName}不足，需要 ${cost.amount} 个` }
    }

    spendItem(cost.itemId, cost.amount)
    return { ok: true, message: `赠礼消耗 ${cost.itemName} x${cost.amount}` }
  }

  function canUpgradeProtagonist() {
    return gold.value >= PROTAGONIST_UPGRADE_COST
  }

  function upgradeProtagonist(): ActionResult {
    if (!canUpgradeProtagonist()) {
      return { ok: false, message: `金币不足，需要 ${PROTAGONIST_UPGRADE_COST}` }
    }

    gold.value -= PROTAGONIST_UPGRADE_COST
    protagonistLevel.value += 1
    protagonistPower.value += 5000
    return { ok: true, message: `主角升级成功，金币 -${PROTAGONIST_UPGRADE_COST}` }
  }

  function selectEquipment(equipmentId: string) {
    selectedEquipmentId.value = equipmentId
  }

  function canStrengthenSelectedEquipment() {
    return Boolean(selectedEquipment.value) && gold.value >= EQUIPMENT_STRENGTHEN_GOLD_COST && enhancementStoneCount.value >= EQUIPMENT_STRENGTHEN_STONE_COST
  }

  function strengthenSelectedEquipment(): ActionResult {
    if (!selectedEquipment.value) {
      return { ok: false, message: '当前没有可强化的装备' }
    }

    if (!canStrengthenSelectedEquipment()) {
      return { ok: false, message: `强化需要 ${EQUIPMENT_STRENGTHEN_GOLD_COST} 金币和 ${EQUIPMENT_STRENGTHEN_STONE_COST} 强化石` }
    }

    gold.value -= EQUIPMENT_STRENGTHEN_GOLD_COST
    spendItem('enhancementStone', EQUIPMENT_STRENGTHEN_STONE_COST)

    const growthByRarity: Record<EquipmentRarity, { attack: number; critRate: number }> = {
      normal: { attack: 80, critRate: 0.2 },
      rare: { attack: 120, critRate: 0.25 },
      epic: { attack: 180, critRate: 0.35 },
    }

    const growth = growthByRarity[selectedEquipment.value.rarity]
    selectedEquipment.value.level += 1
    selectedEquipment.value.attack += growth.attack
    selectedEquipment.value.critRate = Number((selectedEquipment.value.critRate + growth.critRate).toFixed(2))

    return {
      ok: true,
      message: `强化成功，金币 -${EQUIPMENT_STRENGTHEN_GOLD_COST}，强化石 -${EQUIPMENT_STRENGTHEN_STONE_COST}`,
    }
  }

  function dismantleSelectedEquipment(): ActionResult {
    if (!selectedEquipment.value) {
      return { ok: false, message: '当前没有可分解的装备' }
    }

    const rewardByRarity: Record<EquipmentRarity, number> = {
      normal: 6,
      rare: 12,
      epic: 20,
    }

    const target = selectedEquipment.value
    equipmentInventory.value = equipmentInventory.value.filter((item) => item.id !== target.id)
    addItem('enhancementStone', rewardByRarity[target.rarity])
    selectedEquipmentId.value = equipmentInventory.value[0]?.id ?? ''

    return { ok: true, message: `${target.name} 已分解，获得 强化石 x${rewardByRarity[target.rarity]}` }
  }

  return {
    gold,
    diamonds,
    goldLabel,
    diamondLabel,
    gachaTokenCount,
    enhancementStoneCount,
    normalGiftCount,
    premiumGiftCount,
    protagonistUpgradeCost,
    equipmentStrengthenGoldCost,
    equipmentStrengthenStoneCost,
    protagonistLevel,
    protagonistPower,
    equipmentInventory,
    selectedEquipment,
    getPurchaseCount,
    getItemCount,
    getItemLabel,
    getGiftCost,
    grantGold,
    grantDiamonds,
    grantItem,
    canAffordPrice,
    isShopItemSoldOut,
    canPurchaseShopItem,
    getShopItemState,
    purchaseShopItem,
    canPerformGacha,
    getGachaActionState,
    spendForGacha,
    getMaidUnlockCost,
    getMaidUnlockState,
    spendForMaidUnlock,
    canAffordGift,
    spendForGift,
    canUpgradeProtagonist,
    upgradeProtagonist,
    selectEquipment,
    canStrengthenSelectedEquipment,
    strengthenSelectedEquipment,
    dismantleSelectedEquipment,
  }
})