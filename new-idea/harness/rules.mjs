// NEW IDEA Harness — 契约定义 (rules.mjs)
// 版本: 1.0.0 | 八维评估体系 + 场景优先采集 + 伪需求拦截
// 依赖方: qa.mjs / build.mjs / lock.mjs

export const IDEA_RULES = {
  // ========== 评分阈值 ==========
  TOP5_COUNT: 5,                     // TOP5 硬性输出 5 个
  TOP5_MIN_SCORE: 90,                // 最终分 >90 才可进入 TOP5
  LIST_MIN_SCORE: 75,                // 功能需求清单门槛 >75
  SORT_DESC: true,                   // 清单按评分倒序排列

  // ========== 证据门槛 ==========
  MIN_EVIDENCE_PER_TOP5: 3,          // 每条 TOP5 需求至少 3 条证据
  MIN_TREND_EVIDENCE: 1,             // 至少 1 条趋势证据（搜索/销量/社媒 YoY 增长）
  MIN_TIER_PER_TOP5: 2,              // 交叉验证：至少 2 个不同数据源 Tier
  VALID_TIERS: [0, 1, 2, 3],        // 合法 Tier 级别

  // ========== 场景优先约束 ==========
  VALID_DISCOVERY_PATHS: ['scene-pain', 'competitor-gap', 'cross-industry'],
  MAX_SCENE_ONLY_IDEAS: 0,           // 禁止无场景锚的产品优先 idea

  // ========== 市场验证闭环（五源强支撑，进入 TOP5 前置硬门槛） ==========
  VALIDATION_CHAIN_TYPES: [           // 五类验证维度，缺任一 → 不得进 TOP5
    'marketVoice',                    // ① 市场声音：市场够大且在增长
    'competitorValidation',           // ② 竞品验证：同类已被市场接受
    'industryValidation',             // ③ 行业验证：处于上升通道
    'crossIndustryRef',               // ④ 参考行业验证：路径可复用
    'userVoice',                      // ⑤ 用户声音：真实痛点非伪需求
  ],
  VC_MIN_EVIDENCE: {                  // 各维度最小证据数
    marketVoice: 1,
    competitorValidation: 1,
    industryValidation: 1,
    crossIndustryRef: 1,              // 允许"无可参考行业"需显式说明
    userVoice: 2,                     // 用户声音须 ≥2 且来自不同平台
  },
  VC_USER_VOICE_MIN_PLATFORMS: 2,     // 用户声音至少来自 2 个不同平台（防单平台偏差）

  // ========== 数据质量准则（data-quality-criteria.md） ==========
  MIN_DATA_SOURCES_PER_IDEA: 10,       // 每条 TOP5 功能需求至少 10 条数据源（去重）
  MIN_DATA_SOURCES_LIST: 6,            // 功能需求清单（>75）至少 6 条数据源
  MIN_S_TIER_EVIDENCE: 4,              // S 级（直接支撑）至少 4 条
  MIN_S_TIER_LIST: 2,                  // 功能清单 S 级至少 2 条
  MIN_A_TIER_EVIDENCE: 3,              // A 级（间接强关联）至少 3 条
  MIN_A_TIER_LIST: 2,                  // 功能清单 A 级至少 2 条
  MAX_B_TIER_EVIDENCE: 3,              // B 级（背景）最多 3 条
  MIN_SOURCE_TYPES: 4,                 // 至少 4 种不同来源类型
  MAX_SHARED_EVIDENCE_COUNT: 3,        // 被 >3 个 IDEA 引用的证据自动降级为 B 级

  // ========== 八维权重（合计 100） ==========
  WEIGHTS: {
    marketOpp: 15,          // 市场机会 TAM/SAM/SOM 评估
    pain: 15,               // 用户痛点强度（频率 × 严重度）
    trend: 12,              // 趋势增长率（搜索/社媒 YoY）
    techFeas: 10,           // 技术可行性（制造成熟度/供应链可获取性）
    competitiveMoat: 10,    // 竞争壁垒（差异化可持续性、护城河）
    unitEcon: 10,           // 单位经济模型（毛利/回收期）
    strategicFit: 8,        // 战略契合度（公司核心能力匹配）
    uxPotential: 10,        // 用户体验潜力（预期 NPS 提升幅度）
    execRisk: 5,            // 执行风险（合规/监管/排期）
    innovation: 5,          // 创新溢价（市场新颖度/先发优势）
  },

  // ========== 四专家子权重（专家在其擅长领域的放大系数） ==========
  // 第四角色 hardware_expert（硬件专家）：伪需求技术拦截，techFeas/execRisk 放大
  EXPERT_SUB_WEIGHTS: {
    product_expert:   { techFeas: 2.0, uxPotential: 2.0, innovation: 2.0, competitiveMoat: 1.5 },
    market_expert:    { marketOpp: 2.0, trend: 2.0, competitiveMoat: 2.0, unitEcon: 2.0 },
    user_expert:      { pain: 2.5, uxPotential: 2.5 },
    hardware_expert:  { techFeas: 3.0, execRisk: 2.0, competitiveMoat: 1.5, unitEcon: 1.5 },
  },

  // ========== 评分维度范围 ==========
  DIMENSION_MAX: 10,                 // 每个维度 0-10 分
  DIMENSION_MIN: 0,

  // ========== 数据窗口默认（可案例级覆盖） ==========
  DEFAULT_DATA_WINDOW: '2025-08 ~ 2026-08',

  // ========== 指标 ==========
  GTM_FIELDS_REQUIRED: ['audience', 'channel', 'pricing', 'entry', 'northStar', 'first100'],
  PRD_SECTIONS_REQUIRED: ['background', 'users', 'scenarios', 'solution', 'metrics', 'risks', 'timeline'],

  // ========== AI 黑话禁止列表（qa.mjs 扫描） ==========
  FORBIDDEN_PATTERNS: [
    /底座/g, /赋能/g, /抓手/g, /组合拳/g, /飞轮/g,
    /侵蚀(?!沟)/g, /降维打击/g, /端到端/g, /闭环/g,
    /倒逼/g, /对齐(?!颗粒)/g, /颗粒度/g, /拉通/g,
  ],

  // ========== 报告透出红线（External Report Disclosure Rules） ==========
  // 以下术语严禁在 HTML 报告正文中透出（仅限 AGENTS.md / docs/ 内部文档使用）
  FORBIDDEN_REPORT_TERMS: [
    'AI 采集', 'AI 排除错误', 'Agent 架构', 'skill 加载',
    'pipeline', '勾稽传导', 'harness 闸门', 'QA 校验过程',
    '子权重', '伪需求拦截机制', '五源强支撑',
    'evidence.json', 'ideas.json', 'scores.json', 'verification.json',
    'web-design-engineer', '伪需求技术拦截', '一票否决式拦截',
  ],
};

// 用于 qa.mjs 扫描的违规模式
export const VIOLATION_PATTERNS = {
  GHOST_REF: /\bE(?:-news|-[a-z]+)\b|\(E\)\b/gi,  // 幽灵证据编号（含裸 (E) 无来源标记）
  UNVERIFIABLE_GAP: /(?:缺少|没有|无|缺失)\s*(?:该|此|这个|这项)(?:功能|产品|服务)(?!\s*[（(]核验)/g,
  CROSS_DIM_MIX: /(?:功能\s*[→对照→比]\s*机制)|(?:机制\s*[→对照→比]\s*功能)/g,
};

// ============================================================
// 评分聚合函数（三专家 × 八维，子权重加权聚合）
// 归一化到 0-100
// 计算逻辑：
//   1) 对每个维度，用专家子权重对各专家评分做加权平均（专家在擅长领域话语权更大）
//   2) 将维度加权平均值 × 维度权重，累加得 0-100 分
// ============================================================
export function computeFinalScore(expertScores) {
  // expertScores: { product_expert: {...}, market_expert: {...}, user_expert: {...} }
  const WEIGHTS = IDEA_RULES.WEIGHTS;
  const SUB = IDEA_RULES.EXPERT_SUB_WEIGHTS;
  const experts = Object.keys(expertScores);

  let total = 0;

  for (const [dim, w] of Object.entries(WEIGHTS)) {
    let sum = 0;
    let subTotal = 0;
    for (const expert of experts) {
      const score = expertScores[expert][dim];
      if (typeof score !== 'number') {
        throw new Error(`专家 ${expert} 缺少维度 ${dim} 评分`);
      }
      const sub = (SUB[expert] || {})[dim] || 1.0;
      sum += score * sub;
      subTotal += sub;
    }
    const dimAvg = subTotal === 0 ? 0 : sum / subTotal; // 0-10
    total += dimAvg * w; // 权重和为100，dimAvg≤10 → total≤1000
  }

  return Math.round(total / 10 * 10) / 10; // 归一化到 0-100，保留1位小数
}

export default IDEA_RULES;
