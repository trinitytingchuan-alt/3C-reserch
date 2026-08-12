import fs from 'fs';

const html = fs.readFileSync('output/index.html', 'utf8');

// 提取 const NAME = ... 直到匹配的右括号 (;)
function extractConst(name) {
  const start = html.indexOf('const ' + name + ' =');
  if (start < 0) throw new Error('未找到 const ' + name);
  const eq = html.indexOf('=', start);
  let i = eq + 1;
  while (i < html.length && /\s/.test(html[i])) i++;
  const open = html[i];
  const close = open === '[' ? ']' : open === '{' ? '}' : null;
  if (!close) throw new Error('未知容器: ' + open);
  let depth = 0, j = i;
  for (; j < html.length; j++) {
    if (html[j] === open) depth++;
    else if (html[j] === close) { depth--; if (depth === 0) { j++; break; } }
  }
  const code = html.slice(i, j);
  return eval('(' + code + ')');
}

const EVIDENCE = extractConst('EVIDENCE');
const VERIFICATIONS = extractConst('VERIFICATIONS');
const DERIVATION = extractConst('DERIVATION');
const SCORES = extractConst('SCORES');
const DATA_WINDOW = extractConst('DATA_WINDOW');
const DIM_ORDER = extractConst('DIM_ORDER');

const evIds = new Set(EVIDENCE.map(e => e.id));
const evMap = Object.fromEntries(EVIDENCE.map(e => [e.id, e]));

function parseYmd(s) {
  if (!s) return null;
  const m = String(s).match(/(\d{4})[-/](\d{1,2})(?:[-/](\d{1,2}))?/);
  if (!m) return null;
  return (+m[1]) * 10000 + (+m[2]) * 100 + (m[3] ? +m[3] : 1);
}
function inWindow(ev) {
  if (ev.evergreen) return true;
  const v = parseYmd(ev.date);
  if (!v) return true;
  const s = parseYmd(DATA_WINDOW.start), e = parseYmd(DATA_WINDOW.end);
  return v >= s && v <= e;
}

let errors = 0;
const fail = (m) => { console.log('  ✗ ' + m); errors++; };
const ok = (m) => console.log('  ✓ ' + m);

console.log('== 1. 证据维度与窗口 ==');
const dimCount = { market: 0, competitor: 0, user: 0, strategic: 0 };
let outWin = [];
EVIDENCE.forEach(e => {
  if (!e.dim) fail(e.id + ' 缺少 dim'); else dimCount[e.dim]++;
  if (!inWindow(e)) outWin.push(e.id);
});
console.log('  维度分布:', dimCount, '| 总数', EVIDENCE.length, '| 窗口外:', outWin.length ? outWin.join(',') : '无');

console.log('== 2. DERIVATION 引用有效性 ==');
Object.entries(DERIVATION).forEach(([id, dims]) => {
  DIM_ORDER.forEach(dim => {
    (dims[dim] || []).forEach(d => {
      if (!evIds.has(d.ev)) fail('DERIVATION ' + id + '.' + dim + ' 引用了不存在的证据 ' + d.ev);
      (d.cross || []).forEach(c => { if (!evIds.has(c)) fail('DERIVATION ' + id + '.' + dim + ' cross 引用了不存在的 ' + c); });
    });
  });
});
ok('DERIVATION 引用检查完成');

console.log('== 3. TOP5 三维覆盖与阈值 ==');
const top5 = Object.entries(SCORES).filter(([, v]) => v.finalScore >= 90).map(([k]) => k);
top5.forEach(id => {
  const evs = SCORES[id].evidenceIds;
  if (evs.length < 3) fail(id + ' 证据数 < 3 (' + evs.length + ')');
  const tiers = new Set(evs.map(e => evMap[e] && evMap[e].tier).filter(t => t !== undefined));
  if (tiers.size < 2) fail(id + ' Tier 覆盖 < 2 (' + [...tiers].join(',') + ')');
  const hasTrend = evs.some(e => evMap[e] && evMap[e].trend);
  if (!hasTrend) fail(id + ' 缺少趋势证据');
  const dims = {};
  evs.forEach(e => { const d = evMap[e] && evMap[e].dim; if (d) dims[d] = (dims[d] || 0) + 1; });
  const dimStr = Object.entries(dims).map(([k, v]) => k + ':' + v).join(' ');
  ok(id + ' 证据 ' + evs.length + ' | Tier×' + tiers.size + ' | 维度[' + dimStr + ']' + (hasTrend ? ' | 趋势✓' : ' | 趋势✗'));
});

console.log('== 4. 窗口约束 ==');
console.log('  数据窗口:', DATA_WINDOW.label, '| 窗口外证据数:', outWin.length);
if (outWin.length) fail('存在窗口外证据: ' + outWin.join(','));

console.log('\n结果:', errors === 0 ? '✅ 全部通过' : '❌ ' + errors + ' 个错误');
process.exit(errors === 0 ? 0 : 1);
