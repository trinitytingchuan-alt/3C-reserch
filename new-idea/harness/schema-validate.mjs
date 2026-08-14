// NEW IDEA Harness — 数据契约 schema 校验 (schema-validate.mjs)
// 版本: 1.1.0 | 与分模块产出(数据层)配套：build 前先校验各模块数据契约，
// 杜绝 schema 与渲染契约脱节(undefined/幽灵引用/字段缺失)这一历史病根。
// 职责边界：本模块只校验【数据结构契约】；业务规则(TOP5≥90/权重和/透出红线)由 qa.mjs 负责。
// 用法: node harness/schema-validate.mjs --company <slug>
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const errs = [];
const warns = [];
function err(m) { errs.push(m); }
function warn(m) { warns.push(m); }

// ---------- IDEAS 契约 ----------
const IDEA_REQUIRED = ['id', 'title', 'painPoint', 'solution', 'discoveryPath', 'validationChain'];
const VALIDATION_CHAIN_KEYS = ['marketVoice', 'competitorValidation', 'industryValidation', 'crossIndustryRef', 'userVoice', 'hardware'];

export function validateIdeas(ideas) {
  if (!Array.isArray(ideas)) { err('ideas 必须为数组'); return; }
  const ids = new Set();
  for (const it of ideas) {
    if (!it.id) { err('ideas[].id 缺失'); continue; }
    if (ids.has(it.id)) err(`ideas[] 重复 id: ${it.id}`);
    ids.add(it.id);
    for (const k of IDEA_REQUIRED) if (it[k] === undefined || it[k] === null || it[k] === '') err(`ID-${it.id}: 缺必填字段 ${k}`);
    // 伪需求须走 verify_first + 轻量实现路径论证
    if (it.isPseudo) {
      const vc = it.validationChain || {};
      const neg = (vc.negative || []).map(n => n.note || '').join(' ');
      const t = `${it.title} ${it.painPoint} ${neg}`;
      if (!/(已实现|已支持|已上线).*(支付|功能)/.test(t) === false && /支付|功能已存在/.test(t)) {
        // 不做硬判，仅提醒
      }
      if (!/(不可|无法|无|未|不具备|不能|垄断|监管|牌照|形态|控制器|模组|栈)/.test(t)) {
        warn(`ID-${it.id}: 伪需求建议显式论证「无轻量实现路径」`);
      }
    }
  }
}

// ---------- EVIDENCE 契约 ----------
export function validateEvidence(evidence, opts = {}) {
  // opts.strictDate: 聚焦模式(true)下 date 缺失算 ERROR；全量模式(false)下历史产品待重跑，date 缺失降级 WARN 不阻断
  if (!Array.isArray(evidence)) { err('evidence 必须为数组'); return; }
  for (const e of evidence) {
    for (const k of ['id', 'source', 'url']) if (!e[k]) err(`evidence[].${k} 缺失 (${e.id || ''})`);
    if (!e.date) {
      if (opts.strictDate) err(`evidence[].date 缺失 (${e.id || ''})`);
      else warn(`evidence[].date 缺失 (${e.id || ''})，建议后续重跑时补齐`);
    }
    // 兼容新旧字段名：新契约用 level；历史 anker 数据用 verification_level
    const lv = e.level ?? e.verification_level;
    if (!lv) err(`evidence[].level 缺失 (${e.id || ''})`);
    else if (!/^[L]?[1-3]$/.test(String(lv))) warn(`evidence ${e.id}: level 建议为 L1/L2/L3 或 1-3`);
  }
}

// ---------- SCORES 契约 ----------
export function validateScores(scores, ideas) {
  if (!Array.isArray(scores)) { err('scores 必须为数组'); return; }
  const ideaIds = new Set((ideas || []).map(i => i.id));
  for (const s of scores) {
    if (!s.ideaId) { err('scores[].ideaId 缺失'); continue; }
    if (!ideaIds.has(s.ideaId)) err(`scores.${s.ideaId} 引用了不存在的 idea`);
    if (!s.scores) { err(`scores.${s.ideaId}: 缺 scores 专家维度`); continue; }
    for (const ex of ['product_expert', 'market_expert', 'user_expert', 'hardware_expert']) {
      if (!s.scores[ex]) err(`scores.${s.ideaId}: 缺专家 ${ex}`);
    }
    if (!Array.isArray(s.evidenceIds) || s.evidenceIds.length < 10) warn(`scores.${s.ideaId}: 建议 ≥10 条证据支撑`);
  }
}

// ---------- GTM 契约（分模块：gtm.json） ----------
const GTM_FIELDS = ['ideaId', 'audience', 'channel', 'pricing', 'entry', 'northStar', 'first100', 'tamSamSom'];
export function validateGtm(gtm, ideas) {
  if (!Array.isArray(gtm)) { err('gtm 必须为数组'); return; }
  const ideaIds = new Set((ideas || []).map(i => i.id));
  for (const g of gtm) {
    if (!g.ideaId) { err('gtm[].ideaId 缺失'); continue; }
    if (!ideaIds.has(g.ideaId)) err(`gtm.${g.ideaId} 引用了不存在的 idea`);
    for (const k of GTM_FIELDS) if (!g[k]) err(`gtm.${g.ideaId}: 缺 ${k}`);
    // GTM 核心数据虽公司级共享，但落地打法须按 idea 差异化（防偷懒整段复用）
    if (!g.launchCadence && !g.channels) warn(`gtm.${g.ideaId}: 建议提供差异化的渠道/发布节奏，避免整段复用`);
  }
}

// ---------- VERIFICATIONS 契约 ----------
export function validateVerifications(verifications) {
  if (!Array.isArray(verifications)) { err('verifications 必须为数组'); return; }
  for (const v of verifications) {
    for (const k of ['id', 'method', 'conclusion']) if (!v[k]) err(`verifications[].${k} 缺失 (${v.id || ''})`);
  }
}

// ---------- 主入口 ----------
function main() {
  const argIdx = process.argv.indexOf('--company');
  const company = argIdx > -1 ? process.argv[argIdx + 1] : null;
  const dataDir = company ? join(BASE, 'data', company) : join(BASE, 'data');

  const load = (f) => existsSync(join(dataDir, f)) ? JSON.parse(readFileSync(join(dataDir, f), 'utf8')) : null;
  const loadCompany = (c, f) => existsSync(join(BASE, 'data', c, f)) ? JSON.parse(readFileSync(join(BASE, 'data', c, f), 'utf8')) : null;

  // 单一公司模式
  if (company) {
    if (!existsSync(dataDir)) { console.error(`❌ 案例不存在: ${company}`); process.exit(1); }
    const ideas = load('ideas.json');
    const evidence = load('evidence.json');
    const scores = load('scores.json');
    const gtm = load('gtm.json');
    const verifications = load('verification.json');
    validateIdeas(ideas || []);
    validateEvidence(evidence || [], { strictDate: true }); // 聚焦模式严格校验 date
    validateScores(scores || [], ideas || []);
    validateGtm(gtm || [], ideas || []);
    validateVerifications(verifications || []);
  } else {
    // 全量模式：校验所有案例（保证不因新案例破坏旧案例）；跳过含 .incomplete 标记的测试残留
    const dirs = readdirSync(dataDir, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('.') && !existsSync(join(BASE, 'data', d.name, '.incomplete')))
      .map(d => d.name);
    for (const c of dirs) {
      const ideas = loadCompany(c, 'ideas.json');
      const evidence = loadCompany(c, 'evidence.json');
      const scores = loadCompany(c, 'scores.json');
      const gtm = loadCompany(c, 'gtm.json');
      validateIdeas(ideas || []);
      validateEvidence(evidence || []);
      validateScores(scores || [], ideas || []);
      validateGtm(gtm || [], ideas || []);
    }
  }

  console.log('\n===== 数据契约 schema 校验 =====');
  if (errs.length === 0) console.log('✅ schema 校验通过');
  else errs.forEach(e => console.log(`  ❌ ${e}`));
  warns.forEach(w => console.log(`  ⚠ ${w}`));
  console.log(`\n结果: ${errs.length} ERROR, ${warns.length} WARN`);
  process.exit(errs.length > 0 ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}` || process.argv[1].endsWith('schema-validate.mjs')) {
  main();
}

export { main as runSchemaValidate };
