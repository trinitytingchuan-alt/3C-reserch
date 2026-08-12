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

  // 10. TOP5 数量（排除伪需求后，按综合分降序取前 TOP5_COUNT）
  const real = scores.filter(s => !s.isPseudo && !(ideasById[s.ideaId] && ideasById[s.ideaId].isPseudo));
  const top5 = [...real].sort((a, b) => b.finalScore - a.finalScore).slice(0, IDEA_RULES.TOP5_COUNT);
  if (real.length < IDEA_RULES.TOP5_COUNT) {
    err(`[${caseSlug}] 非伪需求仅 ${real.length} 条，不足 TOP5 门槛 ${IDEA_RULES.TOP5_COUNT}`);
  } else if (top5.length !== IDEA_RULES.TOP5_COUNT) {
    err(`[${caseSlug}] TOP5 数量=${top5.length}，应为 ${IDEA_RULES.TOP5_COUNT}`);
  } else {
    ok(`[${caseSlug}] TOP5 数量=${top5.length}（已排除伪需求）✓`);
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
  // (d) 伪需求硬拦截：ID-004 必须被硬件专家判定为 isPseudo
  const id004 = scores.find(s => s.ideaId === 'ID-004');
  const id004Idea = ideasById['ID-004'];
  if (id004) {
    if (!id004.isPseudo && !(id004Idea && id004Idea.isPseudo)) {
      err(`[${caseSlug}] ID-004: 充电宝+SSD 经硬件专家判定为伪需求（USB Host/供电通道分离、NVMe主控壁垒、安克无存储栈），必须标记 isPseudo:true 并综合分 <80`);
    } else {
      ok(`[${caseSlug}] ID-004 伪需求拦截已生效（硬件专家技术拦截）✓`);
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
} else {
  console.log(`\n✅ QA 通过: 0 ERROR, ${warnings} WARN`);
  process.exit(0);
}
