export const MODULE_TYPES = [
  "assessment",
  "capability_eval",
  "contact_network",
  "sales_pipeline",
  "brand_os",
  "strategy",
] as const;

export type ModuleType = (typeof MODULE_TYPES)[number];

export interface ModuleMeta {
  name: string;
  group: string;
  description: string;
  order: number;
  external?: boolean;
  externalUrl?: string;
}

export const MODULES: Record<ModuleType, ModuleMeta> = {
  assessment: {
    name: "影響力密碼",
    group: "入口",
    description: "5 力雷達 + 12 挑戰排名",
    order: 1,
  },
  capability_eval: {
    name: "能力評分",
    group: "營運力",
    description: "組織健診 + 九宮格分布",
    order: 2,
  },
  contact_network: {
    name: "人脈管理",
    group: "銷售力",
    description: "聯絡人 / 公司 / 關係",
    order: 3,
  },
  sales_pipeline: {
    name: "銷售大師",
    group: "銷售力",
    description: "Pipeline + 拜訪 + 抽成",
    order: 4,
  },
  brand_os: {
    name: "品牌大師",
    group: "品牌力",
    description: "金字塔 + Soul + 同理心地圖",
    order: 5,
    external: true,
    externalUrl: "https://consumer-insight-map.vercel.app",
  },
  strategy: {
    name: "360 戰略",
    group: "戰略",
    description: "5 年戰略 + 一頁戰略書",
    order: 6,
  },
};

export const SIZE_BANDS = [
  { value: "micro", label: "微型（1-10 人）" },
  { value: "small", label: "小型（11-50 人）" },
  { value: "mid", label: "中型（51-250 人）" },
  { value: "large", label: "大型（250+ 人）" },
] as const;
