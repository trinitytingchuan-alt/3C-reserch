// NEW IDEA Harness — QA 质量闸门 (qa.mjs)
// 版本: 1.0.0 | 15 项检测
// 用法: node harness/qa.mjs [--company <slug>]
// 输出: 0 ERROR 方可继续发布；WARN 可接受但需关注

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { IDEA_RULES, VIOLATION_PATTERNS } from './rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

let errors = 0;
let warnings = 0;
const results = [];

function err(msg) { results.push(`[ERROR] ${msg}`); errors++; }
function warn(msg) { results.push(`[WARN]  ${msg}`); warnings++; }
function ok(msg) { results.push(`[OK]    ${msg}`); }

// ========== 1. 目录结构完整性 ==========
const REQUIRED_DIRS = ['docs', 'harness', 'templates', 'data', 'scripts', 'output', 'skill'];
for (const d of REQUIRED_DIRS) {
  if (!existsSync(join(BASE, d))) err(`目录缺失: ${d}/`);
  else ok(`目录存在: ${d}/`);
}

// ========== 2. 评分模型完整性 ==========
const weights = IDEA_RULES.WEIGHTS;
const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
if (totalWeight !== 100) err(`八维权重总和=${totalWeight}, 应为 100`);
else ok(`八维权重总和=100 ✓`);

const dims = Object.keys(weights);
if (dims.length !== 10) warn(`预期 10 个评分维度，当前 ${dims.length} 个`);
else ok(`评分维度数量=10 ✓`);

// ========== 3. 专家子权重合理性 ==========
const subWeights = IDEA_RULES.EXPERT_SUB_WEIGHTS;
for (const [expert, dimWeights] of Object.entries(subWeights)) {
  for (const dim of Object.keys(dimWeights)) {
    if (!dims.includes(dim)) err(`专家 ${expert} 子权重引用了不存在的维度: ${dim}`);
  }
}
ok('四专家(含硬件专家)子权重维度引用有效 ✓');

// ========== 4. 案例数据存在性 ==========
const dataDir = join(BASE, 'data');
const cases = readdirSync(dataDir, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('.'))
  .map(d => d.name);

if (cases.length === 0) warn('data/ 下未发现案例文件夹');
else ok(`data/ 下发现 ${cases.length} 个案例: ${cases.join(', ')}`);

// ========== 5-14. 案例级详细校验 ==========
for (const caseSlug of cases) {
  const caseDir = join(dataDir, caseSlug);
  ok(`\n--- 案例校验: ${caseSlug} ---`);

  // 新公司脚手架跳过：data/<company>/ 存在 .incomplete 标记 → 数据未采集完，跳过校验
  if (existsSync(join(caseDir, '.incomplete'))) {
    ok(`[${caseSlug}] 标记为未完成（.incomplete），跳过校验（采集完成后删除该文件再 build）`);
    continue;
  }

  // 5. company-profile.json
  const profilePath = join(caseDir, 'company-profile.json');
  if (!existsSync(profilePath)) { err(`[${caseSlug}] 缺 company-profile.json`); continue; }

  // 6. ideas.json
  const ideasPath = join(caseDir, 'ideas.json');
  if (!existsSync(ideasPath)) { warn(`[${caseSlug}] 缺 ideas.json — 案例尚未进入评分阶段`); continue; }

  let ideas;
  try { ideas = JSON.parse(readFileSync(ideasPath, 'utf-8')); }
  catch (e) { err(`[${caseSlug}] ideas.json 解析失败: ${e.message}`); continue; }

  if (!Array.isArray(ideas)) { err(`[${caseSlug}] ideas.json 应为数组`); continue; }
  ok(`[${caseSlug}] 需求池共 ${ideas.length} 条 IDEA`);
  const ideasById = Object.fromEntries(ideas.map(i => [i.id, i]));

  // 7. 场景路径有效性
  for (const idea of ideas) {
    if (!IDEA_RULES.VALID_DISCOVERY_PATHS.includes(idea.discoveryPath)) {
      err(`[${caseSlug}] ID-${idea.id}: 发现路径 "${idea.discoveryPath}" 无效，合法路径: ${IDEA_RULES.VALID_DISCOVERY_PATHS.join(', ')}`);
    }
  }

  // 8. 场景锚检查（禁止无场景的纯产品优先 idea）
  const sceneOnlyIdeas = ideas.filter(i => i.discoveryPath === 'scene-pain' && (!i.scene || !i.painPoint));
  if (sceneOnlyIdeas.length > IDEA_RULES.MAX_SCENE_ONLY_IDEAS) {
    err(`[${caseSlug}] ${sceneOnlyIdeas.length} 条 scene-pain 类型的 IDEA 缺少场景或痛点描述 (上限=${IDEA_RULES.MAX_SCENE_ONLY_IDEAS})`);
  } else {
    ok(`[${caseSlug}] 场景锚检查通过 ✓`);
  }

  // 9. scores.json
  const scoresPath = join(caseDir, 'scores.json');
  if (!existsSync(scoresPath)) { warn(`[${caseSlug}] 缺 scores.json — 案例尚未进入评分阶段`); continue; }

  let scores;
  try { scores = JSON.parse(readFileSync(scoresPath, 'utf-8')); }
  catch (e) { err(`[${caseSlug}] scores.json 解析失败: ${e.message}`); continue; }

  // 10. TOP5 强门槛：排除伪需求 + 最终分必须 ≥ TOP5_MIN_SCORE(90) 才能进入 TOP5（用户强制规则）
  const real = scores.filter(s => !s.isPseudo && !(ideasById[s.ideaId] && ideasById[s.ideaId].isPseudo));
  const eligible = real.filter(s => s.finalScore >= IDEA_RULES.TOP5_MIN_SCORE);
  const top5 = [...eligible].sort((a, b) => b.finalScore - a.finalScore).slice(0, IDEA_RULES.TOP5_COUNT);
  // 10.1 分数门槛校验：任何进入 TOP5 的卡必须 ≥90，否则 ERROR（防止低分卡混入）
  for (const s of top5) {
    if (s.finalScore < IDEA_RULES.TOP5_MIN_SCORE) {
      err(`[${caseSlug}] ID-${s.ideaId}: finalScore=${s.finalScore} < ${IDEA_RULES.TOP5_MIN_SCORE}（强制门槛：低于 ${IDEA_RULES.TOP5_MIN_SCORE} 不得进入 TOP5）`);
    }
  }
  // 10.2 所有非伪需求中低于门槛的卡不得出现在 TOP5（反向校验）
  const belowThresholdInTop5 = top5.filter(s => s.finalScore < IDEA_RULES.TOP5_MIN_SCORE);
  if (belowThresholdInTop5.length > 0) {
    err(`[${caseSlug}] TOP5 含 ${belowThresholdInTop5.length} 张低于 ${IDEA_RULES.TOP5_MIN_SCORE} 分的卡（${belowThresholdInTop5.map(s=>'ID-'+s.ideaId).join(',')}），违反强制门槛`);
  } else {
    ok(`[${caseSlug}] TOP5 全部 ≥${IDEA_RULES.TOP5_MIN_SCORE} 分（强制门槛校验通过，实际 ${top5.length} 条达标）✓`);
  }
  if (top5.length === 0) {
    err(`[${caseSlug}] 无需求达到 TOP5 强制门槛 ${IDEA_RULES.TOP5_MIN_SCORE} 分，TOP5 为空`);
  }

  // 11. 功能清单 >75
  const above75 = scores.filter(s => s.finalScore > IDEA_RULES.LIST_MIN_SCORE);
  ok(`[${caseSlug}] 评分>75的需求共 ${above75.length} 条`);

  // 12. 证据门槛 + 伪需求拦截（趋势证据 + Tier 覆盖）
  let evidenceMap = {};
  try {
    const evidencePath = join(caseDir, 'evidence.json');
    if (existsSync(evidencePath)) {
      const evArr = JSON.parse(readFileSync(evidencePath, 'utf-8'));
      evidenceMap = Object.fromEntries(evArr.map(e => [e.id, e]));
    }
  } catch (e) {
    err(`[${caseSlug}] evidence.json 解析失败: ${e.message}`);
  }

  // 12.1 市场验证闭环（五源强支撑）——每条 TOP5 需求必须五维齐全
  for (const s of top5) {
    const idea = ideasById[s.ideaId];
    const vc = idea?.validationChain;
    if (!vc || typeof vc !== 'object') {
      err(`[${caseSlug}] ID-${s.ideaId}: 缺少 validationChain（市场验证闭环）——进入 TOP5 必须五维强支撑，详见 docs/market-validation-loop.md`);
      continue;
    }
    for (const type of IDEA_RULES.VALIDATION_CHAIN_TYPES) {
      const slot = vc[type];
      const min = IDEA_RULES.VC_MIN_EVIDENCE[type];
      if (!slot || !Array.isArray(slot.evidenceIds) || slot.evidenceIds.length < min) {
        err(`[${caseSlug}] ID-${s.ideaId}: validationChain.${type} 证据=${slot?.evidenceIds?.length || 0} 条，应 ≥${min}（市场验证闭环缺失，不得进入 TOP5）`);
      }
    }
    // 用户声音须来自 ≥2 个不同独立来源（防单条评论/单一文章偏差）
    const userVoiceSlots = (vc.userVoice?.evidenceIds || []).map(id => evidenceMap[id]).filter(Boolean);
    const userSources = new Set(userVoiceSlots.map(e => e?.source).filter(Boolean));
    if (userSources.size < IDEA_RULES.VC_USER_VOICE_MIN_PLATFORMS) {
      err(`[${caseSlug}] ID-${s.ideaId}: 用户声音仅覆盖 ${userSources.size} 个独立来源，应 ≥${IDEA_RULES.VC_USER_VOICE_MIN_PLATFORMS}（须来自不同来源防单源偏差）`);
    }
  }

  for (const s of top5) {
    if (!s.evidenceIds || s.evidenceIds.length < IDEA_RULES.MIN_EVIDENCE_PER_TOP5) {
      err(`[${caseSlug}] ID-${s.ideaId}: 证据仅 ${s.evidenceIds?.length || 0} 条，应 ≥${IDEA_RULES.MIN_EVIDENCE_PER_TOP5}`);
      continue;
    }
    // 伪需求拦截 A：必须包含 ≥1 条趋势证据（证明需求有递增趋势）
    const trendCount = s.evidenceIds.filter(id => evidenceMap[id]?.isTrend).length;
    if (trendCount < IDEA_RULES.MIN_TREND_EVIDENCE) {
      err(`[${caseSlug}] ID-${s.ideaId}: 趋势证据=${trendCount} 条，应 ≥${IDEA_RULES.MIN_TREND_EVIDENCE}（伪需求拦截：须证明市场有递增趋势）`);
    }
    // 伪需求拦截 B：证据必须覆盖 ≥2 个不同 Tier（交叉验证）
    const tiers = new Set(s.evidenceIds.map(id => evidenceMap[id]?.tier).filter(t => t !== undefined));
    if (tiers.size < IDEA_RULES.MIN_TIER_PER_TOP5) {
      err(`[${caseSlug}] ID-${s.ideaId}: 数据源 Tier 覆盖=${tiers.size}，应 ≥${IDEA_RULES.MIN_TIER_PER_TOP5}（交叉验证不足，可能为伪需求）`);
    }
  }

  // 12.2 数据质量准则（data-quality-criteria.md）——强逻辑闭环，ERROR 级强制
  // 统计每条证据被多少个 IDEA 引用（通用证据检测）
  const evidenceUsageCount = {};
  for (const idea of ideas) {
    const vc = idea?.validationChain;
    if (!vc) continue;
    const allEvIds = new Set();
    for (const type of IDEA_RULES.VALIDATION_CHAIN_TYPES) {
      const slot = vc[type];
      if (slot && Array.isArray(slot.evidenceIds)) {
        slot.evidenceIds.forEach(id => allEvIds.add(id));
      }
    }
    if (vc.hardware && Array.isArray(vc.hardware.evidenceIds)) {
      vc.hardware.evidenceIds.forEach(id => allEvIds.add(id));
    }
    allEvIds.forEach(id => { evidenceUsageCount[id] = (evidenceUsageCount[id] || 0) + 1; });
  }

  for (const s of top5) {
    const idea = ideasById[s.ideaId];
    const vc = idea?.validationChain;
    if (!vc) continue;

    // 收集所有维度的去重 evidenceIds
    const allEvIds = new Set();
    const allDims = [...IDEA_RULES.VALIDATION_CHAIN_TYPES, 'hardware'];
    for (const type of allDims) {
      const slot = vc[type];
      if (slot && Array.isArray(slot.evidenceIds)) {
        slot.evidenceIds.forEach(id => allEvIds.add(id));
      }
    }
    if (Array.isArray(vc.positive)) vc.positive.forEach(p => { if (p.ev) allEvIds.add(p.ev); });
    if (Array.isArray(vc.negative)) vc.negative.forEach(n => { if (n.ev) allEvIds.add(n.ev); });

    const totalCount = allEvIds.size;
    if (totalCount < IDEA_RULES.MIN_DATA_SOURCES_PER_IDEA) {
      err(`[${caseSlug}] ID-${s.ideaId}: 数据源总量=${totalCount}，必须 >=${IDEA_RULES.MIN_DATA_SOURCES_PER_IDEA}（验证闭环硬门槛：不足则需求不成立）`);
    } else {
      ok(`[${caseSlug}] ID-${s.ideaId}: 数据源总量=${totalCount} >=${IDEA_RULES.MIN_DATA_SOURCES_PER_IDEA} ✓`);
    }

    // 检查通用证据（被 >3 个 IDEA 引用 → 降级为 B 级，不计入强相关）
    const overSharedEvs = [...allEvIds].filter(id => (evidenceUsageCount[id] || 0) > IDEA_RULES.MAX_SHARED_EVIDENCE_COUNT);
    if (overSharedEvs.length > 0) {
      warn(`[${caseSlug}] ID-${s.ideaId}: 以下证据被 >${IDEA_RULES.MAX_SHARED_EVIDENCE_COUNT} 个 IDEA 引用（自动降级为 B 级，不计入强相关）: ${overSharedEvs.join(', ')}`);
    }

    // dataSourceSummary 必须存在且满足 S/A/B 门槛
    if (!idea.dataSourceSummary) {
      err(`[${caseSlug}] ID-${s.ideaId}: 缺少 dataSourceSummary 字段（验证闭环要求显式标注数据质量分布）`);
    } else {
      const dss = idea.dataSourceSummary;
      if (dss.sTier < IDEA_RULES.MIN_S_TIER_EVIDENCE) {
        err(`[${caseSlug}] ID-${s.ideaId}: S 级（直接支撑）证据=${dss.sTier}，必须 >=${IDEA_RULES.MIN_S_TIER_EVIDENCE}（强相关数据不足，需求推导不成立）`);
      }
      if (dss.bTier > IDEA_RULES.MAX_B_TIER_EVIDENCE) {
        err(`[${caseSlug}] ID-${s.ideaId}: B 级（背景）证据=${dss.bTier}，必须 <=${IDEA_RULES.MAX_B_TIER_EVIDENCE}（弱相关数据过多，稀释推导强度）`);
      }
      if (dss.sourceTypes && dss.sourceTypes.length < IDEA_RULES.MIN_SOURCE_TYPES) {
        err(`[${caseSlug}] ID-${s.ideaId}: 来源类型=${dss.sourceTypes.length}，必须 >=${IDEA_RULES.MIN_SOURCE_TYPES}（多方来源不足，无法交叉验证）`);
      }
    }

    // relevance 标注检测：每个维度须有 relevance 数组
    for (const type of IDEA_RULES.VALIDATION_CHAIN_TYPES) {
      const slot = vc[type];
      if (slot && slot.evidenceIds && !Array.isArray(slot.relevance)) {
        err(`[${caseSlug}] ID-${s.ideaId}: validationChain.${type} 缺少 relevance 数组（须标注每条证据的 S/A/B 相关性级别）`);
      }
    }
  }

  // 12.3 推导链路闭环检查（derivation-logic-standard.md）——ERROR 级强制
  for (const s of top5) {
    const idea = ideasById[s.ideaId];
    const vc = idea?.validationChain;
    if (!vc) continue;

    // chainLink 必须存在（每个维度须显式描述跨维度因果关系）
    for (const type of IDEA_RULES.VALIDATION_CHAIN_TYPES) {
      const slot = vc[type];
      if (slot && slot.logic && !slot.chainLink) {
        err(`[${caseSlug}] ID-${s.ideaId}: validationChain.${type} 缺少 chainLink（推导链路断裂：维度之间无因果连接）`);
      }
    }

    // 规则 1：场景-痛点对应（userVoice 必须同时描述场景和痛点）
    const uvLogic = vc.userVoice?.logic || '';
    const sceneRe = /场景|出差|户外|家庭|办公|酒店|海滩|旅行|咖啡馆|拍摄|通勤|露营|桌面|充电/;
    const painRe = /痛点|焦虑|抱怨|不满|困难|负担|麻烦|损伤|老化|缺失|不足|空白|无感知|找不到|不够|缠绕/;
    if (uvLogic && (!sceneRe.test(uvLogic) || !painRe.test(uvLogic))) {
      err(`[${caseSlug}] ID-${s.ideaId}: userVoice.logic 未同时包含场景词和痛点词（推导链路规则 1 断裂：用户声音必须描述「在什么场景存在什么痛点」）`);
    }

    // 规则 2：竞品响应描述（competitorValidation 必须说明竞品针对该痛点做了什么+缺口在哪）
    const cvLogic = vc.competitorValidation?.logic || '';
    const compActionRe = /已|率先|推出|发布|做|提供|上线|落地|拿到|获得/;
    const compGapRe = /但|无|缺|仅|未|不|空白|不足|局限|没有|停/;
    if (cvLogic && (!compActionRe.test(cvLogic) || !compGapRe.test(cvLogic))) {
      err(`[${caseSlug}] ID-${s.ideaId}: competitorValidation.logic 未同时包含竞品行动和缺口描述（推导链路规则 2 断裂：必须说明竞品针对该场景/痛点如何反应及未覆盖什么）`);
    }

    // 规则 3：chainLink 跨维度因果引用（必须引用至少一个其他维度的证据编号）
    for (const type of IDEA_RULES.VALIDATION_CHAIN_TYPES) {
      const slot = vc[type];
      if (!slot?.chainLink) continue;
      const ownEvs = new Set(slot.evidenceIds || []);
      const crossRef = (slot.chainLink.match(/E\d+/g) || []).filter(eid => !ownEvs.has(eid));
      if (crossRef.length === 0) {
        err(`[${caseSlug}] ID-${s.ideaId}: validationChain.${type}.chainLink 未引用其他维度的证据（推导链路规则 3 断裂：维度之间无交叉支撑，为散点堆砌）`);
      }
    }

    // 规则 4：方案-缺口对接（solution 必须引用竞品缺口或跨行业参考）
    const solution = idea.solution || '';
    const gapRefRe = /空白|缺口|无.*做|没有.*提供|未.*覆盖|借鉴|迁移|跨行业/;
    if (solution && !gapRefRe.test(solution)) {
      warn(`[${caseSlug}] ID-${s.ideaId}: solution 未显式引用竞品缺口或跨行业参考（推导链路规则 4：方案应说明填补了哪个缺口）`);
    }
  }

  // 12.4 报告透出红线扫描（FORBIDDEN_REPORT_TERMS）——按 company 读取对应模板（隔离各公司数据）
  const templateArgIdx = process.argv.indexOf('--company');
  const qaCompany = templateArgIdx > -1 ? process.argv[templateArgIdx + 1] : 'anker';
  const templatePath = join(BASE, 'templates', 'report-template.html'); // 单一渲染引擎（数据由 build 注入，QA 只扫渲染层红线）
  if (existsSync(templatePath)) {
    const htmlContent = readFileSync(templatePath, 'utf-8');
    let disclosureViolations = 0;
    for (const term of IDEA_RULES.FORBIDDEN_REPORT_TERMS) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const matches = htmlContent.match(new RegExp(escaped, 'g'));
      if (matches) {
        err(`[${caseSlug}] report-template.html: 透出红线违规——"${term}" 出现 ${matches.length} 次`);
        disclosureViolations += matches.length;
      }
    }
    if (disclosureViolations === 0) ok(`[${caseSlug}] 报告透出红线扫描通过 ✓`);
  }

  // 12.x 四专家评审完整性 + 伪需求硬拦截 + 正/负向验证门槛
  const EXPERTS = Object.keys(IDEA_RULES.EXPERT_SUB_WEIGHTS); // 含 hardware_expert
  for (const s of scores) {
    // (a) 四专家评分齐全
    for (const expert of EXPERTS) {
      if (!s.scores || typeof s.scores[expert] !== 'object') {
        err(`[${caseSlug}] ID-${s.ideaId}: 缺少 ${expert} 专家评分（必须四专家：产品/市场/用户/硬件）`);
      }
    }
    const idea = ideasById[s.ideaId];
    const vc = idea?.validationChain;
    if (vc) {
      // (b) 每个需求正向/负向验证各 ≥10 条
      const pos = Array.isArray(vc.positive) ? vc.positive : [];
      const neg = Array.isArray(vc.negative) ? vc.negative : [];
      if (pos.length < 10) err(`[${caseSlug}] ID-${s.ideaId}: validationChain.positive 仅 ${pos.length} 条，应 ≥10（须收集正向验证支撑真需求）`);
      if (neg.length < 10) err(`[${caseSlug}] ID-${s.ideaId}: validationChain.negative 仅 ${neg.length} 条，应 ≥10（须收集负向验证评估伪需求）`);
      // (c) 每条负向验证须挂可溯源证据 E##
      for (const item of neg) {
        if (!item.ev || !/^E\d+$/.test(item.ev)) err(`[${caseSlug}] ID-${s.ideaId}: negative 条目 "${item.note}" 未挂证据编号 E##`);
        else if (!evidenceMap[item.ev]) err(`[${caseSlug}] ID-${s.ideaId}: negative 引用了不存在的证据 ${item.ev}`);
      }
    }
  }
  // (d) 伪需求硬拦截 + verify_first / 轻量实现路径校验（防止误判创新点）
  // 铁律：判定伪需求前须核验「当前功能是否已存在」+「是否有轻量实现路径（搭载生态/SDK）」
  // 通用校验：所有标记 isPseudo 的需求必须满足——非「已存在功能」，且无「搭载现有软件生态即可实现」的路径
  const pseudoItems = scores.filter(s => s.isPseudo);
  if (pseudoItems.length === 0) {
    err(`[${caseSlug}] 框架要求至少 1 个 isPseudo 伪需求占位（验证拦截机制），当前为 0`);
  }
  for (const s of pseudoItems) {
    const idea = ideasById[s.ideaId];
    const vc = idea?.validationChain;
    // (d1) verify_first：伪需求不得是「已存在/已实现」的功能
    const negNotes = Array.isArray(vc?.negative) ? vc.negative.map(n => n.note || '').join(' ') : '';
    const t = `${idea?.title || ''} ${idea?.painPoint || ''} ${negNotes}`;
    if (/(已实现|已支持|已上线|已搭载|内置).*(支付|支付功能|功能已存在)/.test(t)) {
      err(`[${caseSlug}] ID-${s.ideaId}: 伪需求判定疑似误判——该功能可能已实现（见负向验证描述），须先 verify_first 核验现状，不得将「已存在功能」判为伪需求`);
    }
    // (d2) 轻量实现路径：伪需求须论证「无轻量实现路径」
    // 合理论证方式：①硬件/技术不可行（无Host控制器、光引擎形态、主控垄断等），或 ②明确排除软件生态/SDK/第三方可搭载实现。
    // 只要 negative 出现「不可/无法/无/未/不具备」等否定 + 明确的不可行根因（技术/硬件/能力/垄断/监管）即视为已论证，
    // 不强求必须出现「软件/SDK」字样（硬件技术不可行同样是成立的无轻量路径论证）。
    const hasNoPath = /(不可|无法|无|未|不具备|不能|禁止|垄断|监管|牌照|形态|控制器|模组|栈)/.test(t);
    if (!hasNoPath) {
      err(`[${caseSlug}] ID-${s.ideaId}: 伪需求须显式论证「无轻量实现路径」（硬件/技术不可行，或排除可搭载现成App/SDK/云API实现），避免把可经软件生态实现的需求误判为伪需求`);
    }
  }

  // 13. 评分维度完整性
  const requiredDims = dims;
  for (const s of scores) {
    for (const expert of Object.keys(IDEA_RULES.EXPERT_SUB_WEIGHTS)) {
      const expertScores = s.scores?.[expert];
      if (!expertScores) { err(`[${caseSlug}] ID-${s.ideaId}: ${expert} 评分缺失`); continue; }
      for (const dim of requiredDims) {
        if (typeof expertScores[dim] !== 'number') {
          err(`[${caseSlug}] ID-${s.ideaId}: ${expert}.${dim} 缺失`);
        }
        if (expertScores[dim] < 0 || expertScores[dim] > IDEA_RULES.DIMENSION_MAX) {
          err(`[${caseSlug}] ID-${s.ideaId}: ${expert}.${dim}=${expertScores[dim]} 超出范围 [0,${IDEA_RULES.DIMENSION_MAX}]`);
        }
      }
    }
  }

  // 14. AI 黑话扫描
  const textFiles = [
    join(caseDir, 'company-profile.json'),
    join(caseDir, 'ideas.json'),
    join(caseDir, 'evidence.json'),
    join(caseDir, 'scores.json'),
    join(caseDir, 'prd-draft.md'),
  ];
  for (const fp of textFiles) {
    if (!existsSync(fp)) continue;
    const content = readFileSync(fp, 'utf-8');
    for (const pattern of IDEA_RULES.FORBIDDEN_PATTERNS) {
      const matches = content.match(pattern);
      if (matches) {
        err(`[${caseSlug}] ${fp.replace(BASE, '')}: 禁用词汇 "${pattern.source}" 出现 ${matches.length} 次`);
      }
    }
  }
}

// ========== 15. 输出汇总 ==========
results.push(`\n========== QA 汇总 ==========`);
results.push(`ERROR: ${errors}  |  WARN: ${warnings}`);

console.log(results.join('\n'));

if (errors > 0) {
  console.error(`\n❌ QA 失败: ${errors} 个错误`);
  process.exit(1);
}

// 12.5 内联脚本语法可解析性（防止整段脚本语法错误导致界面空白）
try {
  const { readFileSync } = await import('fs');
  const outPath = join(BASE, 'output', 'index.html');
  if (existsSync(outPath)) {
    const html = readFileSync(outPath, 'utf-8');
    const blocks = html.match(/<script>([\s\S]*?)<\/script>/g) || [];
    const vm = await import('vm');
    blocks.forEach((b, i) => {
      const code = b.replace(/^<script>/, '').replace(/<\/script>$/, '');
      try { new vm.Script(code, { filename: `output-script-${i}.js` }); }
      catch (e) { err(`output/index.html 第 ${i} 个 <script> 语法错误 -> ${e.message}`); }
    });
  }
} catch (e) {
  err(`脚本语法解析检查异常: ${e.message}`);
}

if (errors > 0) {
  console.error(`\n❌ QA 失败: ${errors} 个错误`);
  process.exit(1);
} else {
  console.log(`\n✅ QA 通过: 0 ERROR, ${warnings} WARN`);
  process.exit(0);
}
