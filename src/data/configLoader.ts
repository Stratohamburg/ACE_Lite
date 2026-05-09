import { parseCSV } from '../utils/csvParser';

// 使用 Vite 的 ?raw 语法直接作为字符串引入 CSV 文件
import maidsCsvRaw from '../../configs/maids.csv?raw';
import shopItemsCsvRaw from '../../configs/shop_items.csv?raw';
import gachaPoolCsvRaw from '../../configs/gacha_pool.csv?raw';
import equipmentsCsvRaw from '../../configs/equipments.csv?raw';

// 定义数据接口
export interface MaidConfig {
  id: number;
  name: string;
  profession: string;
  rarity: string;
  element: string;
  base_hp: number;
  base_atk: number;
  base_def: number;
  description: string;
}

export interface ShopItemConfig {
  id: number;
  tab_name: string;
  item_name: string;
  price_type: string;
  price_value: number;
  buy_limit: number;
  description: string;
}

export interface GachaPoolConfig {
  pool_id: number;
  maid_id: number;
  weight: number;
  is_up_rate: number;
}

export interface EquipmentConfig {
  id: number;
  part: string;
  name: string;
  rarity: string;
  main_attr: string;
  base_value: number;
  growth_value: number;
}

// 解析并导出所有配置表数据
export const GameConfigs = {
  maids: parseCSV<MaidConfig>(maidsCsvRaw),
  shopItems: parseCSV<ShopItemConfig>(shopItemsCsvRaw),
  gachaPool: parseCSV<GachaPoolConfig>(gachaPoolCsvRaw),
  equipments: parseCSV<EquipmentConfig>(equipmentsCsvRaw),
};
