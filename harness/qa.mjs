/**
 * qa.mjs — 3C 竞品分析质量闸门
 * 
 * 用法：node harness/qa.mjs --category headphones
 * 
 * 检查项：
 * 1. 证据数量 ≥ 阈值
 * 2. 每个 PRD 优化点 ≥ 2 条证据
 * 3. 数据源覆盖 ≥ 3 个 Tier
 * 4. 无跨维度混比
 * 5. 无无出处断言
 * 6. 无 AI 黑话
 * 7. 证据字段完整性
 * 8. 数字化断言都有 E## 引用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import minimist from 'minimist';
import {
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
} from './rules.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================
// Helpers
// ============================================================
function log(level, msg) {
  const icons = { ERROR: '❌', WARNING: '⚠️', INFO: 'ℹ️', OK: '✅' };
  const prefix = icons[level] || '';
  console.log(`  ${prefix} [${level}] ${msg}`);
}

function loadJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

function loadText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    return null;
  }
}

// ============================================================
// Checkers
// ============================================================

/** 1. 证据数量 ≥ 阈值 */
function checkEvidenceCount(evidence) {
  const count = evidence.length;
  const min = EVIDENCE_THRESHOLDS.MIN_EVIDENCE_COUNT;
  if (count < min) {
    return [{ severity: SEVERITY.ERROR, msg: `证据数量不足：当前 ${count} 条，最少需要 ${min} 条` }];
  }
  return [{ severity: 'OK', msg: `证据数量：${count} 条（≥${min}）✅` }];
}

/** 2. 每个 PRD 优化点 ≥ 2 条证据 */
function checkOptEvidence(optimizations) {
  const results = [];
  if (!optimizations || !Array.isArray(optimizations)) {
    results.push({ severity: SEVERITY.WARNING, msg: 'PRD 优化建议列表为空或格式错误' });
    return results;
  }
  for (const opt of optimizations) {
    const evCount = (opt.evidence_ids || []).length;
    if (evCount < EVIDENCE_THRESHOLDS.MIN_EVIDENCE_PER_OPT) {
      results.push({
        severity: SEVERITY.ERROR,
        msg: `${opt.id}（${opt.title}）仅 ${evCount} 条证据，需 ≥${EVIDENCE_THRESHOLDS.MIN_EVIDENCE_PER_OPT} 条`,
      });
    }
  }
  if (results.filter(r => r.severity === SEVERITY.ERROR).length === 0) {
    results.push({ severity: 'OK', msg: `所有优化点证据数量达标（≥${EVIDENCE_THRESHOLDS.MIN_EVIDENCE_PER_OPT}条/点）✅` });
  }
  return results;
}

/** 3. 数据源 Tier 覆盖 */
function checkTierCoverage(evidence) {
  const tiers = new Set(evidence.map(e => e.tier));
  const tierSet = new Set(['T0', 'T1', 'T2', 'T3']);
  const covered = [...tiers].filter(t => tierSet.has(t));
  const min = EVIDENCE_THRESHOLDS.MIN_TIER_COVERAGE;
  if (covered.length < min) {
    return [{ severity: SEVERITY.ERROR, msg: `数据源 Tier 覆盖不足：当前覆盖 ${covered.join(',')}（${covered.length}/${min}），需至少 ${min} 个 Tier` }];
  }
  return [{ severity: 'OK', msg: `数据源 Tier 覆盖：${covered.join(',')}（${covered.length}/${min}+）✅` }];
}

/** 4. 检查 PRD 文本中的跨维度混比 */
function checkCrossDimension(prdText) {
  const results = [];
  const sentences = prdText.split(/[。！\n]/);
  for (const pattern of CLAIM_PATTERNS.CROSS_DIMENSION) {
    for (const sentence of sentences) {
      const hasUser = pattern.user.test(sentence);
      const hasPlatform = pattern.platform.test(sentence);
      if (hasUser && hasPlatform) {
        results.push({
          severity: SEVERITY.ERROR,
          msg: `疑似跨维度混比："${sentence.trim().slice(0, 80)}..."（用户功能词 + 平台机制词共现）`,
        });
      }
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '无跨维度混比 ✅' });
  }
  return results;
}

/** 5. 无出处断言检测 */
function checkNoSourceAssertions(text) {
  const results = [];
  for (const pattern of CLAIM_PATTERNS.NO_FEATURE) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30);
      results.push({
        severity: SEVERITY.ERROR,
        msg: `禁止断言"竞品无某功能"：${ctx.trim()}（位置 ${m.index}）`,
      });
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '无"竞品无某功能"类断言 ✅' });
  }
  return results;
}

/** 6. AI 黑话检测 */
function checkBuzzwords(text) {
  const results = [];
  for (const pattern of CLAIM_PATTERNS.AI_BUZZWORDS) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
    for (const m of matches) {
      results.push({
        severity: SEVERITY.WARNING,
        msg: `AI 黑话："${m[0]}"（位置 ${m.index}）`,
      });
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '无 AI 黑话 ✅' });
  }
  return results;
}

/** 7. 证据字段完整性 */
function checkEvidenceFields(evidence) {
  const results = [];
  for (const ev of evidence) {
    for (const field of EVIDENCE_FIELD_REQUIRED) {
      if (!(field in ev) || ev[field] === null || ev[field] === undefined || ev[field] === '') {
        results.push({
          severity: SEVERITY.ERROR,
          msg: `${ev.id || '?'} 缺少必填字段：${field}`,
        });
      }
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '证据字段完整性 ✅' });
  }
  return results;
}

/** 8. 数字化断言有 E## 引用（文档级上下文检测，±200 字符内查找 E##） */
function checkNumericClaims(text, evidenceIds) {
  const results = [];
  for (const pattern of CLAIM_PATTERNS.NUMERIC_WITHOUT_EVIDENCE) {
    const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
    for (const m of matches) {
      // 检查前后 200 字符内是否有 E## 引用
      const ctxStart = Math.max(0, m.index - 200);
      const ctxEnd = Math.min(text.length, m.index + m[0].length + 200);
      const context = text.slice(ctxStart, ctxEnd);
      if (!/E\d{3}/.test(context)) {
        const snippet = text.slice(Math.max(0, m.index - 20), m.index + m[0].length + 40);
        results.push({
          severity: SEVERITY.WARNING,
          msg: `数字化断言可能缺少 E## 引用："${snippet.trim().slice(0, 60)}"`,
        });
      }
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '数字化断言均有出处或需人工复查 ✅' });
  }
  return results;
}

/** 9. 幽灵证据引用检测 — PRD 引用的每个 E## 必须真实存在于 evidence 数组 */
function checkGhostRefs(text, evidenceIds) {
  const results = [];
  const idSet = new Set(evidenceIds.map(id => id.replace(/^E/, 'E')));
  const matches = text.match(EVIDENCE_REF_PATTERN);
  if (!matches) {
    results.push({ severity: 'OK', msg: 'PRD 无证据引用 ✅' });
    return results;
  }
  const seen = new Set();
  const ghostRefs = [];
  for (const ref of matches) {
    if (seen.has(ref)) continue;
    seen.add(ref);
    if (!idSet.has(ref)) {
      ghostRefs.push(ref);
    }
  }
  if (ghostRefs.length > 0) {
    results.push({
      severity: SEVERITY.ERROR,
      msg: `幽灵证据引用：${ghostRefs.join(', ')} 不存在于 evidence.json（违反数据溯源）`,
    });
  } else {
    results.push({ severity: 'OK', msg: `证据引用完整（${seen.size} 个唯一引用均存在）✅` });
  }
  return results;
}

/** 10. 孤儿证据检测 — 每条 E## 是否被至少一个优化点引用 */
function checkOrphanEvidence(evidence, optimizations) {
  const results = [];
  const usedIds = new Set();
  for (const opt of optimizations) {
    for (const evId of (opt.evidence_ids || [])) {
      usedIds.add(evId);
    }
  }
  const orphans = evidence
    .filter(e => !usedIds.has(e.id))
    .map(e => e.id);

  if (orphans.length > 0) {
    results.push({
      severity: SEVERITY.WARNING,
      msg: `孤儿证据（未被任何优化点使用）：${orphans.join(', ')} — 建议补充到优化点或删除`,
    });
  } else {
    results.push({ severity: 'OK', msg: '无孤儿证据，所有 E## 均有归属 ✅' });
  }
  return results;
}

/** 11. 不可观测行为推测检测（claim_discipline 红线 2） */
function checkUnobservable(text) {
  const results = [];
  for (const pattern of CLAIM_PATTERNS.UNOBSERVABLE) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const ctx = text.slice(Math.max(0, m.index - 25), m.index + m[0].length + 25);
      results.push({
        severity: SEVERITY.ERROR,
        msg: `不可观测行为推测："${m[0]}"（${ctx.trim().slice(0, 60)}...）— 请改为可观测/可测量的目标`,
      });
    }
  }
  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '无不可观测行为推测 ✅' });
  }
  return results;
}

/** 12. 证据-核验对应关系：每个 E## 有且仅有 1 条 V##，final_level 合法 */
function checkEvidenceVerification(evidence, verifications) {
  const results = [];
  const vByEvidence = new Map();
  for (const v of verifications) {
    if (!vByEvidence.has(v.evidence_id)) {
      vByEvidence.set(v.evidence_id, []);
    }
    vByEvidence.get(v.evidence_id).push(v.id);
  }

  // 1. 每个 E## 有对应 V##
  for (const ev of evidence) {
    const vList = vByEvidence.get(ev.id);
    if (!vList || vList.length === 0) {
      results.push({
        severity: SEVERITY.ERROR,
        msg: `${ev.id} 缺少对应的核验记录（V##）`,
      });
    } else if (vList.length > 1) {
      results.push({
        severity: SEVERITY.WARNING,
        msg: `${ev.id} 有多条核验记录 ${vList.join(',')} — 应一一对应`,
      });
    }
  }

  // 2. 每条 V## 引用的 E## 必须存在，且 final_level 合法
  for (const v of verifications) {
    const evExists = evidence.some(e => e.id === v.evidence_id);
    if (!evExists) {
      results.push({
        severity: SEVERITY.ERROR,
        msg: `${v.id} 引用了不存在的证据 ${v.evidence_id}`,
      });
    }
    if (!VALID_VERIFICATION_LEVELS.includes(v.final_level)) {
      results.push({
        severity: SEVERITY.ERROR,
        msg: `${v.id} 的 final_level=${v.final_level} 非法，应为 L1/L2/L3`,
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}T/.test(v.verified_at || '')) {
      results.push({
        severity: SEVERITY.WARNING,
        msg: `${v.id} 的 verified_at 不是有效 ISO 时间戳`,
      });
    }
  }

  if (results.filter(r => r.severity === SEVERITY.ERROR).length === 0) {
    results.push({ severity: 'OK', msg: '证据-核验一一对应，final_level 合法 ✅' });
  }
  return results;
}

/** 13. 设计系统声明检测（web-design-engineer 门槛） */
function checkDesignTokens(templateHtml, reportHtml) {
  const results = [];
  const combined = templateHtml + '\n' + reportHtml;

  // 1. 必需设计令牌
  for (const token of DESIGN_REQUIREMENTS.REQUIRED_TOKENS) {
    if (!combined.includes(token)) {
      results.push({
        severity: SEVERITY.WARNING,
        msg: `设计系统缺少令牌：${token}`,
      });
    }
  }

  // 2. 反陈词滥调：检测模板是否误用了 AI 默认设计模式
  for (const cliche of DESIGN_REQUIREMENTS.ANTI_CLICHE) {
    if (combined.includes(cliche)) {
      results.push({
        severity: SEVERITY.WARNING,
        msg: `检测到 AI 趋同设计模式：${cliche} — 建议替换为设计系统自定义令牌`,
      });
    }
  }

  // 3. 设计系统声明标记
  if (!combined.toLowerCase().includes(DESIGN_REQUIREMENTS.DESIGN_SYSTEM_MARKER)) {
    results.push({
      severity: SEVERITY.WARNING,
      msg: '缺少设计系统声明标记（design-system）',
    });
  }

  if (results.length === 0) {
    results.push({ severity: 'OK', msg: '设计系统声明完备，无趋同模式 ✅' });
  }
  return results;
}

// ============================================================
// Main
// ============================================================
async function main() {
  const argv = minimist(process.argv.slice(2));
  const category = argv.category || argv.c || 'headphones';
  
  console.log(`\n🔍 3C QA 质量闸门 — 品类：${category}\n${'─'.repeat(50)}`);

  const dataDir = path.join(ROOT, 'data', category);
  const evidencePath = path.join(dataDir, 'evidence.json');
  const prdPath = path.join(dataDir, 'prd-draft.md');
  const templatePath = path.join(ROOT, 'templates', 'index-base.html');

  // Load data
  const evidenceData = loadJSON(evidencePath);
  const prdText = loadText(prdPath);
  const templateHtml = loadText(templatePath);
  // 若品类已有构建产物则加载用于设计检查
  const reportHtmlPath = path.join(dataDir, 'index.html');
  const reportHtml = loadText(reportHtmlPath);

  if (!evidenceData) {
    console.error(`❌ 无法加载证据文件：${evidencePath}`);
    process.exit(1);
  }
  if (!prdText) {
    console.warn(`⚠️ 无法加载 PRD 文件：${prdPath}（跳过 PRD 文本检查）`);
  }

  const evidence = evidenceData.evidence || [];
  const verifications = evidenceData.verifications || [];
  const optimizations = evidenceData.prd_draft?.optimizations || [];
  const evidenceIds = evidence.map(e => e.id);

  // Run all checks
  const allResults = [
    ...checkEvidenceCount(evidence),
    ...checkOptEvidence(optimizations),
    ...checkTierCoverage(evidence),
    ...(prdText ? checkCrossDimension(prdText) : []),
    ...(prdText ? checkNoSourceAssertions(prdText) : []),
    ...(prdText ? checkBuzzwords(prdText) : []),
    ...checkEvidenceFields(evidence),
    ...(prdText ? checkNumericClaims(prdText, evidenceIds) : []),
    ...(prdText ? checkGhostRefs(prdText, evidenceIds) : []),
    ...checkOrphanEvidence(evidence, optimizations),
    ...(prdText ? checkUnobservable(prdText) : []),
    ...checkEvidenceVerification(evidence, verifications),
    ...(templateHtml ? checkDesignTokens(templateHtml, reportHtml || '') : []),
  ];

  // Report
  const errors = allResults.filter(r => r.severity === SEVERITY.ERROR);
  const warnings = allResults.filter(r => r.severity === SEVERITY.WARNING);
  const oks = allResults.filter(r => r.severity === 'OK');
  const infos = allResults.filter(r => r.severity === SEVERITY.INFO);

  console.log('\n📋 检查结果：\n');
  for (const r of allResults) {
    if (r.severity !== 'OK') {
      log(r.severity, r.msg);
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`📊 汇总：${oks.length} 通过 | ${warnings.length} 警告 | ${errors.length} 错误`);

  if (errors.length > 0) {
    console.log('\n❌ QA 未通过 — 请修复以上错误后重试。\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('\n⚠️ QA 通过（有警告）— 建议关注上述警告项。\n');
    process.exit(0);
  } else {
    console.log('\n✅ QA 全部通过！\n');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
