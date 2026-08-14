// NEW IDEA Harness — 构建程序 (build.mjs)
// 版本: 1.0.0
// 用法: node harness/build.mjs [--company <slug>] [--output <path>]
// 功能: 读取案例数据 → 注入模板 → 自动 QA → 输出 HTML

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const args = process.argv.slice(2);
const companyIdx = args.indexOf('--company');
const company = companyIdx > -1 ? args[companyIdx + 1] : 'anker';
const outputIdx = args.indexOf('--output');
const outputPath = outputIdx > -1 ? args[outputIdx + 1] : join(BASE, 'output', 'index.html');
const stageIdx = args.indexOf('--stage');
const stage = stageIdx > -1 ? args[stageIdx + 1] : 'report';

// 分步骤产出状态机：demand → gtm → report
// 铁律：后置模块产出前，前置模块必须已 done（需求未确认不得产出 GTM，避免返工）
const STAGE_ORDER = ['demand', 'gtm', 'report'];
const stageFile = join(BASE, 'data', company, 'stage.json');
function loadStage() {
  if (!existsSync(stageFile)) return { stages: { demand: 'pending', gtm: 'pending', report: 'pending' } };
  try { return JSON.parse(readFileSync(stageFile, 'utf-8')); } catch { return { stages: { demand: 'pending', gtm: 'pending', report: 'pending' } }; }
}
function assertStage(stage, current) {
  const idx = STAGE_ORDER.indexOf(stage);
  for (let i = 0; i < idx; i++) {
    const prev = STAGE_ORDER[i];
    if ((current.stages[prev] || 'pending') !== 'done') {
      console.error(`❌ 分步骤产出拦截：产出「${stage}」前，「${prev}」必须已 done（当前 ${current.stages[prev]}）。`);
      console.error(`   请先确认上一阶段产出，再执行对应 stage。`);
      process.exit(1);
    }
  }
}

// Step 0: Validate inputs + stage 约束
const dataDir = join(BASE, 'data', company);
if (!existsSync(dataDir)) {
  console.error(`❌ 案例数据目录不存在: ${dataDir}`);
  process.exit(1);
}
const stageState = loadStage();
if (stage === 'report') {
  // report 阶段要求前置模块(demand/evidence/gtm)全部 done 才产出完整报告；否则拦截，强制先逐模块产出
  assertStage('report', stageState);
  for (const pre of ['evidence', 'gtm']) {
    if ((stageState.stages[pre] || 'pending') !== 'done') {
      console.error(`❌ 分步骤产出拦截：产出「report」前，模块「${pre}」必须已 done（当前 ${stageState.stages[pre]}）。`);
      console.error(`   请先执行对应 stage（如 --stage gtm）完成该模块后再产出完整报告。`);
      process.exit(1);
    }
  }
}
console.log(`📦 构建案例: ${company} | 阶段: ${stage} | stage.json: ${JSON.stringify(stageState.stages)}`);

// Step 1: Load single render engine（单一渲染引擎，数据由 data/<company>/ 注入，不再用复制模板）
const templatePath = join(BASE, 'templates', 'report-template.html');
if (!existsSync(templatePath)) {
  console.error(`❌ 单一渲染引擎模板不存在: ${templatePath}`);
  process.exit(1);
}

// Step 2: Load case data
const loadJSON = (name) => {
  const fp = join(dataDir, name);
  if (!existsSync(fp)) return null;
  try { return JSON.parse(readFileSync(fp, 'utf-8')); }
  catch (e) { console.warn(`⚠️  无法解析 ${name}: ${e.message}`); return null; }
};

const profile = loadJSON('company-profile.json');
const ideas = loadJSON('ideas.json');
const evidence = loadJSON('evidence.json');
const verification = loadJSON('verification.json');
const scores = loadJSON('scores.json');

console.log(`📦 构建案例: ${company}`);
console.log(`   画像: ${profile ? '✓' : '✗'}  |  IDEA池: ${ideas ? `${ideas.length}条` : '✗'}  |  证据: ${evidence ? '✓' : '✗'}`);
console.log(`   核验: ${verification ? '✓' : '✗'}  |  评分: ${scores ? `${scores.length}条` : '✗'}`);

// Step 2.5: Schema 数据契约前置校验（结构层，杜绝 undefined/幽灵引用/字段缺失）
console.log('\n🔍 运行 Schema 数据契约校验...');
try {
  const schemaResult = execSync(`node "${join(__dirname, 'schema-validate.mjs')}" --company ${company}`, {
    cwd: BASE,
    encoding: 'utf-8',
    timeout: 15000,
  });
  const lastLine = schemaResult.trim().split('\n').pop();
  if (!/通过|0 ERROR/.test(lastLine)) {
    console.error(`❌ Schema 校验未通过:\n${schemaResult}`);
    process.exit(1);
  }
  console.log(schemaResult.trim().split('\n').slice(-3).join('\n'));
} catch (e) {
  console.error(`❌ Schema 校验失败:\n${e.stdout || e.message}`);
  process.exit(1);
}

// Step 3: Run QA
console.log('\n🔍 运行 QA 闸门...');
try {
  const qaResult = execSync(`node "${join(__dirname, 'qa.mjs')}" --company ${company}`, {
    cwd: BASE,
    encoding: 'utf-8',
    timeout: 30000,
  });
  console.log(qaResult.trim().split('\n').slice(-3).join('\n'));
} catch (e) {
  console.error(`❌ QA 未通过:\n${e.stdout || e.message}`);
  console.error('   请修复上述 ERROR 后重试');
  process.exit(1);
}

// Step 4: 数据派生 + 占位符注入（单一引擎渲染，前后端分离）
// 派生逻辑与渲染函数契约严格对齐（IDEAS/SCORES/EVIDENCE/GTMS/VERIFICATIONS/SCEN_SRC/DATASOURCE/VALIDATION/PRDS/DERIVATION）
const outputDir = dirname(outputPath);
if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

const evIdx = new Set((evidence || []).map(e => e.id));

// --- IDEAS（渲染读 idea.eng/path/scene/painPoint/solution/differentiation） ---
const IDEAS = (ideas || []).map(it => ({
  id: it.id,
  title: it.title,
  eng: it.eng || '',
  path: it.discoveryPath || it.path,
  category: it.category,
  scene: it.scene,
  painPoint: it.painPoint,
  solution: it.solution,
  differentiation: it.differentiation || '',
  competitorSignal: it.competitorSignal || '',
  trendSignal: it.trendSignal || '',
  tamEstimate: it.tamEstimate || '',
}));

// --- SCORES（渲染读 sc.expert/evidenceIds/isPseudo/pseudoReason/position） ---
const SCORES = {};
for (const s of (scores || [])) {
  SCORES[s.ideaId] = {
    expert: s.scores,
    evidenceIds: s.evidenceIds || [],
    verificationIds: s.verificationIds || [],
    position: '四专家加权评估',
  };
  if (s.isPseudo) {
    SCORES[s.ideaId].isPseudo = true;
    SCORES[s.ideaId].pseudoReason = '硬件专家(第四角色)判定：与轻量 AR 眼镜形态/公司能力冲突、无轻量实现路径，技术不可行';
  }
}

// --- EVIDENCE（渲染读 ev.id/source/tier/level/date/url/dim/summary/trend/evergreen） ---
const EVIDENCE = (evidence || []).map(e => {
  const out = {
    id: e.id, source: e.source, tier: e.tier,
    level: e.level ?? e.verification_level,
    date: e.date, url: e.url, dim: e.dim, summary: e.summary,
    trend: e.trend ?? e.isTrend ?? false,
  };
  if (e.evergreen) out.evergreen = true;
  return out;
});

// --- DERIVATION（对象按 ideaId 索引，openPrdDoc 读 DERIVATION[id][dim][].ev/claim/logic/cross） ---
const DERIVATION = {};
const dimMap = { marketVoice: 'market', competitorValidation: 'competitor', userVoice: 'user', industryValidation: 'market', crossIndustryRef: 'strategic', hardware: 'strategic' };
for (const it of (ideas || [])) {
  const vc = it.validationChain || {};
  const d = { market: [], competitor: [], user: [], strategic: [] };
  for (const [vcKey, dim] of Object.entries(dimMap)) {
    const slot = vc[vcKey];
    if (!slot || !Array.isArray(slot.evidenceIds)) continue;
    const evs = slot.evidenceIds.filter(e => evIdx.has(e));
    if (!evs.length) continue;
    const logic = slot.logic || '';
    d[dim].push({ ev: evs[0], claim: logic.split(/[，。；]/)[0] || '该维度证据支撑需求成立', logic, cross: evs.slice(1) });
  }
  DERIVATION[it.id] = d;
}

// --- PRDS（renderPrdBody 读 prd.background/users/scenarios/solution/metrics/risks/timeline；openPrdDoc 读 prd.decision） ---
const PRDS = {};
for (const it of (ideas || [])) {
  PRDS[it.id] = {
    decision: `【${it.isPseudo ? '不予立项（技术不可行）' : '建议立项'}】${(it.trendSignal || it.painPoint || '').slice(0, 60)}。综合分 ${((scores || []).find(s => s.ideaId === it.id)?.finalScore ?? 0).toFixed(1)}/100。`,
    background: [it.painPoint, it.competitorSignal || '', it.trendSignal || ''].filter(Boolean),
    users: [it.targetSegment || '', it.scene ? `在「${it.scene}」场景中的核心用户` : ''].filter(Boolean),
    scenarios: [it.scene].filter(Boolean),
    solution: [it.solution].filter(Boolean),
    metrics: [{ k: '北极星', v: '目标客群渗透率 ≥ 5%（发布后 12 个月）' }, { k: '留存', v: '月活跃留存 ≥ 30%' }, { k: 'NPS', v: '≥ 35' }],
    risks: [['工程可行性', '中', '中', '先做软硬分离验证，再整机量产'], ['供应链', '中', '高', '关键器件双备份'], ['竞品跟进', '中', '中', '专利+快速迭代']],
    timeline: ['0-3 月：立项与可行性验证', '3-6 月：原型开发与用户内测', '6-12 月：量产与渠道铺货'],
  };
}

// --- VALIDATION（renderValidationLoop 读 VALIDATION.chainDef 与 byIdea[id][key].ev/logic） ---
const VALIDATION = {
  chainDef: [
    { key: 'marketVoice', label: '① 市场声音', color: 'var(--cyan)', desc: '市场够大且在增长', min: '≥1' },
    { key: 'competitorValidation', label: '② 竞品验证', color: 'var(--blue)', desc: '同类已被市场接受', min: '≥1' },
    { key: 'industryValidation', label: '③ 行业验证', color: 'var(--green)', desc: '处于上升通道', min: '≥1' },
    { key: 'crossIndustryRef', label: '④ 参考行业验证', color: 'var(--violet)', desc: '路径可复用', min: '≥1' },
    { key: 'userVoice', label: '⑤ 用户声音', color: 'var(--amber)', desc: '真实痛点·≥2 独立来源', min: '≥2' },
  ],
  byIdea: {},
};
for (const it of (ideas || [])) {
  const vc = it.validationChain || {};
  const by = {};
  for (const key of VALIDATION.chainDef.map(c => c.key)) {
    const slot = vc[key];
    by[key] = { ev: (slot?.evidenceIds || []).filter(e => evIdx.has(e)), logic: slot?.logic || '' };
  }
  VALIDATION.byIdea[it.id] = by;
}

// --- GTMS（renderGtmCards 读 g.audience/channel/pricing/entry；详情读 northStar/first100/tamSamSom/channels/launchCadence/smarketing/metrics/risks） ---
const GTMS = {};
for (const s of (scores || [])) {
  if (!s.gtm) continue;
  const g = s.gtm;
  GTMS[s.ideaId] = {
    audience: g.audience || '目标客群',
    channel: g.channel || '线上电商+运营商+IP联名+海外25国',
    pricing: g.pricing || '—',
    entry: g.entry || '—',
    anchor: g.anchor || '—',
    northStar: g.northStar || '目标客群渗透率 ≥ 5%（发布后 12 个月）',
    first100: g.first100 || '雷鸟社区/粉丝群 100 人内测',
    tamSamSom: g.tamSamSom || '',
    channels: g.channels || [],
    launchCadence: g.launchCadence || [],
    smarketing: g.smarketing || '',
    metrics: g.metrics || [],
    risks: g.risks || [],
  };
}

// --- VERIFICATIONS（renderVerTable 读 v.id/ev/level/window/conclusion/url） ---
const VERIFICATIONS = (verification || []).map(v => {
  const ev = (v.evidenceIds && v.evidenceIds[0]) || v.ev || '';
  const evObj = EVIDENCE.find(e => e.id === ev);
  return { id: v.id, ev, level: v.level, method: v.method, window: v.window, conclusion: v.conclusion, url: evObj?.url || '' };
});

// --- SCEN_SRC（renderPrdBody scenarios 读 SCEN_SRC[id][i]={t,label,url,date}） ---
const SCEN_SRC = {};
for (const it of (ideas || [])) {
  const uvIds = (it.validationChain?.userVoice?.evidenceIds || []).filter(e => evIdx.has(e));
  const items = uvIds.map(evId => {
    const ev = EVIDENCE.find(e => e.id === evId);
    return ev ? { t: 'voice', label: ev.source, url: ev.url, date: ev.date } : null;
  }).filter(Boolean);
  SCEN_SRC[it.id] = items;
}

// --- DATASOURCE（renderDataSource 读 ds.channels[].role/overseas/domestic + geographyLabel/language/note） ---
const dsGeo = (profile?.dataSourceStrategy && (profile.dataSourceStrategy.coreAudienceGeography || profile.dataSourceStrategy.geo)) || 'CN';
const DATASOURCE = {
  coreAudienceGeography: dsGeo,
  geographyLabel: dsGeo === 'CN' ? '国内客群为主' : '海外客群为主',
  language: dsGeo === 'CN' ? 'zh' : 'en',
  channels: [
    { role: '用户声音 L3', overseas: ['Amazon Reviews', 'Reddit', 'Trustpilot', 'Best Buy'], domestic: ['京东/天猫评价', '知乎', '小红书', 'B站/抖音'] },
    { role: '竞品验证 L2', overseas: ['RTINGS', 'The Verge', 'Android Central'], domestic: ['中关村在线', 'IT之家', 'PChome'] },
    { role: '行业验证 L1/L2', overseas: ['Counterpoint', 'IDC', 'Grand View'], domestic: ['洛图科技', 'IDC 中国', '奥维云网'] },
    { role: '趋势信号 Tier3', overseas: ['Google Trends', 'SimilarWeb'], domestic: ['百度指数', '七麦数据'] },
    { role: '参考行业验证', overseas: ['Gartner', 'McKinsey'], domestic: ['中国信通院', '前瞻产业研究院'] },
  ],
  note: '数据源地理定向按核心客群配置，避免用错地理渠道误判需求。',
};

// --- 注入占位符 ---
const replacePlaceholders = (html, blocks) => {
  let out = html;
  for (const [name, val] of blocks) {
    const marker = `__DATA_${name}__`;
    if (!out.includes(marker)) throw new Error(`模板缺少占位符 ${marker}`);
    out = out.split(marker).join(JSON.stringify(val));
  }
  return out;
};
const blocks = [
  ['IDEAS', IDEAS], ['SCORES', SCORES], ['EVIDENCE', EVIDENCE], ['GTMS', GTMS],
  ['VERIFICATIONS', VERIFICATIONS], ['SCEN_SRC', SCEN_SRC], ['DATASOURCE', DATASOURCE],
  ['VALIDATION', VALIDATION], ['PRDS', PRDS], ['DERIVATION', DERIVATION],
];
const templateHtml = readFileSync(templatePath, 'utf-8');
// 注入分模块产出状态 __STAGE__（控制模块可见性：未 done 模块渲染"待确认"占位）
const stageJson = existsSync(stageFile) ? readFileSync(stageFile, 'utf-8') : JSON.stringify({ stages: { demand: 'done', gtm: 'done', evidence: 'done', report: 'done' } });
let outputHtml = replacePlaceholders(templateHtml, blocks);
outputHtml = outputHtml.split('__STAGE__').join(stageJson.trim());
// 注入公司元信息（消除标题/快照硬编码，实现跨公司数据隔离）
const COMPANY_META = {
  slug: company,
  displayName: profile?.displayName || company,
  generatedAt: new Date().toISOString().slice(0, 10),
  dataWindowLabel: (profile && profile.dataWindow) || '',
  // 案例速览快照：公司专属项来自 profile.snapshot，框架通用项由数据自动计算
  snapshot: (() => {
    const profileSnap = Array.isArray(profile?.snapshot) ? profile.snapshot : [];
    const ideasCount = Array.isArray(IDEAS) ? IDEAS.length : 0;
    const top5 = Array.isArray(scores) ? scores.filter(s => (s.finalScore ?? s.finalAggregateScore ?? s.aggregateScore) >= 90).length : 0;
    const evCount = Array.isArray(EVIDENCE) ? EVIDENCE.length : 0;
    const vCount = Array.isArray(VERIFICATIONS) ? VERIFICATIONS.length : 0;
    const autoSnap = [
      { v: String(ideasCount) + '条', k: '候选需求 IDEA' },
      { v: String(top5) + '条', k: 'TOP5（评分 >90）' },
      { v: String(evCount) + '条', k: '证据链 E##' },
      { v: String(vCount) + '条', k: '三级核验 V##' },
    ];
    // 公司专属在前，框架通用在后；去重（若 profile 已含同名项则后者覆盖）
    const merged = [...profileSnap];
    autoSnap.forEach(a => { if (!merged.some(m => m.k === a.k)) merged.push(a); });
    return merged;
  })(),
};
if (!outputHtml.includes('__COMPANY_META__')) {
  console.warn('⚠️  模板未声明 __COMPANY_META__ 占位符，标题将回退为硬编码');
} else {
  outputHtml = outputHtml.split('__COMPANY_META__').join(JSON.stringify(COMPANY_META));
}
writeFileSync(outputPath, outputHtml, 'utf-8');

console.log(`\n✅ 构建完成`);
console.log(`   输出路径: ${outputPath} (${(outputHtml.length / 1024).toFixed(1)} KB)`);
console.log(`   运行 'node harness/lock.mjs --update' 锁定基线`);
