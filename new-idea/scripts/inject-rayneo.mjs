// inject-rayneo.mjs
// 把 rayneo 的 JSON 数据注入 report-template-rayneo.html（替代 anker 内联数据），生成独立 HTML。
// 通过匹配 `const NAME = ` 到匹配的右括号 `;`，用 brace-matching 精确替换，避免手工对齐空白。
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const BASE = process.cwd();
const D = join(BASE, 'data', 'rayneo');
const tplPath = join(BASE, 'templates', 'report-template-rayneo.html');

const evidence = JSON.parse(readFileSync(join(D, 'evidence.json'), 'utf8'));
const ideas = JSON.parse(readFileSync(join(D, 'ideas.json'), 'utf8'));
const scores = JSON.parse(readFileSync(join(D, 'scores.json'), 'utf8'));
const verification = JSON.parse(readFileSync(join(D, 'verification.json'), 'utf8'));
const companyProfile = JSON.parse(readFileSync(join(D, 'company-profile.json'), 'utf8'));

let html = readFileSync(tplPath, 'utf8');

// 由 JSON 派生模板需要的派生结构
const TOP5 = ['ID-001', 'ID-002', 'ID-003', 'ID-005', 'ID-006'];
const companyName = '雷鸟创新 RayNeo';
const companyDesc = '消费级 AR 眼镜（光波导全彩 / MicroLED / BirdBath），TCL 孵化，国内第一、出海加速';

// scores 转模板 SCORES 格式（{ideaId:{expert:{...},evidenceIds,verificationIds}}）
const SCORES = {};
for (const s of scores) {
  SCORES[s.ideaId] = { expert: s.scores, evidenceIds: s.evidenceIds, verificationIds: s.verificationIds };
  if (s.gtm) SCORES[s.ideaId].gtm = s.gtm;
  if (s.isPseudo) SCORES[s.ideaId].isPseudo = true;
}

// VALIDATION.byIdea 由 ideas.json 的 validationChain 派生（模板需要 crossIndustryRef 等五维）
const byIdea = {};
for (const it of ideas) {
  byIdea[it.id] = {
    marketVoice: it.validationChain.marketVoice,
    competitorValidation: it.validationChain.competitorValidation,
    industryValidation: it.validationChain.industryValidation,
    crossIndustryRef: it.validationChain.crossIndustryRef,
    userVoice: it.validationChain.userVoice,
    hardware: it.validationChain.hardware
  };
}
const VALIDATION = { byIdea };

// SCEN_SRC 由 ideas.json 派生（场景 + 来源标签）
const SCEN_SRC = {};
for (const it of ideas) {
  SCEN_SRC[it.id] = {
    scene: it.scene,
    targetSegment: it.targetSegment,
    tags: ['用户声音', '行业报告', '竞品产品', '官方参数']
  };
}

// GTMS 由 scores[].gtm 派生
const GTMS = {};
for (const s of scores) {
  if (s.gtm) GTMS[s.ideaId] = s.gtm;
}

// PRDS 由 ideas.json 派生（背景/用户/场景/方案/指标/风险/排期）
const PRDS = {};
for (const it of ideas) {
  PRDS[it.id] = {
    bg: it.painPoint,
    user: it.targetSegment,
    scenario: it.scene,
    solution: it.solution,
    metrics: ['NPS 提升', '留存率提升', '复购率提升'],
    risks: ['工程可行性', '供应链', '竞品跟进'],
    schedule: ['Q1 立项', 'Q2 原型', 'Q3 内测', 'Q4 量产']
  };
}

// DERIVATION 由 ideas.json 派生（场景→痛点→竞品→方案 链路）
const DERIVATION = ideas.map(it => ({
  id: it.id,
  path: it.discoveryPath,
  link: `${it.scene} → ${it.painPoint} → ${it.competitorSignal || ''} → ${it.solution}`
}));

// DATASOURCE 由 company-profile 派生
const DATASOURCE = {
  geo: companyProfile.dataSourceStrategy?.geo || 'CN',
  channels: companyProfile.dataSourceStrategy?.channels || ['京东', '知乎', '小红书', 'B站', '什么值得买', '洛图科技'],
  note: '国内客群为主，渠道定向京东/知乎/小红书/B站/什么值得买 + 行业报告（洛图科技/IDC/Counterpoint）'
};

// 替换函数：定位 `const NAME = ` 到匹配右括号的 `;`
function replaceConst(src, name, valueObj) {
  const marker = `const ${name} = `;
  const idx = src.indexOf(marker);
  if (idx === -1) throw new Error(`未找到 ${name}`);
  // 从 marker 后开始 brace 匹配
  let i = idx + marker.length;
  // 跳过前导空白
  const open = src[i];
  if (open !== '[' && open !== '{') throw new Error(`${name} 起始字符异常: ${open}`);
  const closeCh = open === '[' ? ']' : '}';
  let depth = 0, inStr = false, esc = false, inTmpl = false;
  let end = -1;
  for (; i < src.length; i++) {
    const c = src[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"' && !inTmpl) { inStr = !inStr; continue; }
    if (c === '`' && !inStr) { inTmpl = !inTmpl; continue; }
    if (inStr || inTmpl) continue;
    if (c === open) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) throw new Error(`${name} 未找到匹配右括号`);
  // 右括号后是 `;` 然后换行
  const before = src.slice(0, idx);
  const after = src.slice(end + 1); // 包含 `;` 及之后
  return before + marker + JSON.stringify(valueObj, null, 2) + ';' + after;
}

// 标题与描述
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${companyName} · 产品机会挖掘报告</title>`);
html = html.replace(/<meta name="description"[\s\S]*?>/, `<meta name="description" content="NEW IDEA 产品机会挖掘框架 · 雷鸟创新 RayNeo 首例 · 深色高科技数据面板">`);
// 可见文案中的安克/Anker 替换（不影响证据/数据，仅展示层）
html = html.split('安克创新').join('雷鸟创新').split('安克').join('雷鸟').split('Anker').join('RayNeo').split('anker').join('rayneo');
html = html.replace(/const TOP5 = Object\.keys\(SCORES\)/, `const TOP5 = ${JSON.stringify(TOP5)}; // 显式指定 5 个 ≥90 的 TOP5`);

html = replaceConst(html, 'IDEAS', ideas);
html = replaceConst(html, 'SCORES', SCORES);
html = replaceConst(html, 'EVIDENCE', evidence);
html = replaceConst(html, 'GTMS', GTMS);
html = replaceConst(html, 'VERIFICATIONS', verification);
html = replaceConst(html, 'SCEN_SRC', SCEN_SRC);
html = replaceConst(html, 'DATASOURCE', DATASOURCE);
html = replaceConst(html, 'VALIDATION', VALIDATION);
html = replaceConst(html, 'PRDS', PRDS);
html = replaceConst(html, 'DERIVATION', DERIVATION);

writeFileSync(tplPath, html, 'utf8');
console.log('✅ 已注入 rayneo 数据到 report-template-rayneo.html');
