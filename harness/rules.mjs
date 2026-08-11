/**
 * rules.mjs — 3C 竞品分析契约定义
 * 
 * 定义所有质量规则的阈值、检测模式与严重等级。
 * qa.mjs 和 build.mjs 依赖此模块。
 */

// ============================================================
// 证据数量阈值
// ============================================================
export const EVIDENCE_THRESHOLDS = {
  /** 单品类最少证据条数 */
  MIN_EVIDENCE_COUNT: 5,
  /** 每个 PRD 优化点最少证据条数 */
  MIN_EVIDENCE_PER_OPT: 2,
  /** 最少数据源 Tier 覆盖数 */
  MIN_TIER_COVERAGE: 3,
  /** 数字化断言（含数字+单位）必须标注证据的最大容忍度（条） */
  MAX_UNANNOTATED_NUMERIC_CLAIMS: 0,
};

// ============================================================
// 表述违规检测模式（正则）
// ============================================================
export const CLAIM_PATTERNS = {
  /** 禁止：断言竞品"没有"某功能（排除"无线""无法""无需"等非否定词） */
  NO_FEATURE: [
    /没有.{1,20}(功能|能力|支持|模式|服务)/g,
    /不具备.{1,20}(能力|功能)/g,
    /无(?!线|法|需|须|意|论|疑|关|人|一|数|条|从|边|所|所|所).{1,10}(降噪|功能|模式|支持)/g,
    /缺失.{1,10}(功能|特性)/g,
    /未提供.{1,10}(功能|服务)/g,
  ],
  /** 禁止：不可观测行为推测（claim_discipline 红线 2） */
  UNOBSERVABLE: [
    /算法.{1,10}(优化|改进|升级|调整)/g,
    /调整.{1,10}(策略|定价|算法|方案)/g,
    /内部.{1,10}(机制|逻辑|算法)/g,
    /供应链.{1,10}(选择|调整|更换)/g,
    /运营.{1,10}(方式|手段|策略)/g,
    /更换.{1,10}(芯片|方案|供应链|供应商)/g,
    /优化.{1,10}(算法|调度|策略)/g,
    /商业.{1,10}(策略|逻辑|意图)/g,
  ],
  /** 禁止：跨维度混比关键词 */
  CROSS_DIMENSION: [
    // 用户功能词 + 平台机制词的共现（在 sentence 级别检测）
    { user: /(用户|消费者|购买者).{0,20}(功能|体验|操作)/g, platform: /(平台|机制|策略|运营|供给侧)/g },
  ],
  /** 禁止：数字化断言无 E## 引用（跨行检测，在 qa.mjs 中做文档级检查） */
  NUMERIC_WITHOUT_EVIDENCE: [
    /\d+(\.\d+)?\s*(dB|小时|h|mm|g|mAh|Hz|kHz|ms|%|天|次)/g,
  ],
  /** 禁止：AI 黑话（"维度"在分析语境中为正常术语，已移除） */
  AI_BUZZWORDS: [
    /底座/g,
    /侵蚀/g,
    /飞轮/g,
    /组合拳/g,
    /赋能/g,
    /抓手/g,
    /闭环/g,
    /打法/g,
    /心智/g,
    /链路/g,
    /颗粒度/g,
    /对齐/g,
    /拉通/g,
    /拆解/g,
  ],
};

// ============================================================
// 数据源覆盖要求
// ============================================================
export const TIER_REQUIREMENTS = {
  /** 每个品类至少覆盖的 source ID 数量（按 Tier） */
  TIER_MIN_SOURCES: {
    T0: 1, // 至少 1 个官方来源
    T1: 2, // 至少 2 个专业/KOL 来源（含 B站/小红书/抖音至少一种）
    T2: 1, // 至少 1 个社区/电商来源
    T3: 0, // 可选
  },
  /** Tier 1 必须包含至少一种中文社交平台 */
  MUST_INCLUDE_CN_SOCIAL: true,
  CN_SOCIAL_IDS: ['bilibili_review', 'xiaohongshu_review', 'douyin_review'],
};

// ============================================================
// 证据完整性检查
// ============================================================
export const EVIDENCE_FIELD_REQUIRED = [
  'id',
  'claim',
  'source',
  'source_type',
  'tier',
  'verification_level',
  'verification_method',
  'data_window',
  'category',
  'tags',
  'status',
];

export const VERIFICATION_FIELD_REQUIRED = [
  'id',
  'evidence_id',
  'final_level',
  'verified_at',
];

/** 核验级别合法值（verify_first 三级体系） */
export const VALID_VERIFICATION_LEVELS = ['L1', 'L2', 'L3'];

/** E##/V## 引用模式（用于幽灵引用检测） */
export const EVIDENCE_REF_PATTERN = /E\d{3}/g;
export const VERIFICATION_REF_PATTERN = /V\d{3}/g;

// ============================================================
// web-design-engineer 设计系统声明要求
// ============================================================
export const DESIGN_REQUIREMENTS = {
  /** 报告模板必须包含的设计令牌变量（防 AI 趋同设计） */
  REQUIRED_TOKENS: [
    '--font-sans',
    '--accent',
    '--bg-primary',
    '--text-primary',
    '--radius-md',
  ],
  /** 反陈词滥调：禁止的 AI 默认设计模式（检测"裸用"而非"设计系统声明内使用"） */
  ANTI_CLICHE: [
    "font-family: 'Inter'",      // 裸用 Inter 且无设计声明（设计系统已声明则豁免）
    '#3b82f6',                    // 默认蓝
    'linear-gradient(135deg, #3b82f6',  // 默认蓝紫渐变
    'rgba(59,130,246',            // 蓝半透明
    'text-align:center;' ,        // 无目的的全居中对齐
  ],
  /** 设计系统声明必须在 HTML 中存在（注释或 meta） */
  DESIGN_SYSTEM_MARKER: 'design-system',
};

// ============================================================
// 严重等级
// ============================================================
export const SEVERITY = {
  ERROR: 'ERROR',     // 必须修复，阻断构建
  WARNING: 'WARNING', // 需要关注，不阻断但标记
  INFO: 'INFO',       // 信息性提示
};

export default {
  EVIDENCE_THRESHOLDS,
  CLAIM_PATTERNS,
  TIER_REQUIREMENTS,
  EVIDENCE_FIELD_REQUIRED,
  VERIFICATION_FIELD_REQUIRED,
  VALID_VERIFICATION_LEVELS,
  EVIDENCE_REF_PATTERN,
  VERIFICATION_REF_PATTERN,
  DESIGN_REQUIREMENTS,
  SEVERITY,
};
