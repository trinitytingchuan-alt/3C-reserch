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

  // Load data
  const evidenceData = loadJSON(evidencePath);
  const prdText = loadText(prdPath);

  if (!evidenceData) {
    console.error(`❌ 无法加载证据文件：${evidencePath}`);
    process.exit(1);
  }
  if (!prdText) {
    console.warn(`⚠️ 无法加载 PRD 文件：${prdPath}（跳过 PRD 文本检查）`);
  }

  const evidence = evidenceData.evidence || [];
  const optimizations = evidenceData.prd_draft?.optimizations || [];

  // Run all checks
  const allResults = [
    ...checkEvidenceCount(evidence),
    ...checkOptEvidence(optimizations),
    ...checkTierCoverage(evidence),
    ...(prdText ? checkCrossDimension(prdText) : []),
    ...(prdText ? checkNoSourceAssertions(prdText) : []),
    ...(prdText ? checkBuzzwords(prdText) : []),
    ...checkEvidenceFields(evidence),
    ...(prdText ? checkNumericClaims(prdText, evidence.map(e => e.id)) : []),
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
