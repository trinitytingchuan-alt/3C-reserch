// 防惰自检：扫描 PRD 二级界面 DATA.prds 各段字数，标出简略字段
// 直接逐行解析，避免整块 JSON 解析失败
const fs = require('fs');
const p = 'new-idea/output/index.html';
const lines = fs.readFileSync(p, 'utf8').split('\n');

const cn = t => ((t || '').match(/[一-龥]/g) || []).length;
const secs = ['background','users','scenarios','solution','differentiation','competitorSignal','trendSignal','tam','metrics','risks','plan'];

// 找到 prds 块范围
let st = -1, en = -1;
for (let i = 0; i < lines.length; i++) {
  if (st < 0 && /^\s*"prds":\s*\{/.test(lines[i])) st = i;
  else if (st >= 0 && /^\s*"gtms":\s*\{/.test(lines[i])) { en = i; break; }
}
if (st < 0 || en < 0) { console.log('未定位 prds 块'); process.exit(1); }

let curId = null, curSec = null, buf = {}, fail = 0;
const flush = () => {
  if (!curId || !curSec) return;
  const txt = (buf[curSec] || '').replace(/<[^>]+>/g, '');
  const n = cn(txt);
  const lev = n < 20 ? '❌' : n < 40 ? '⚠️' : '✅';
  if (n < 20) fail++;
  console.log(`    ${lev} ${curSec}: ${n}字`);
};
let inPrds = false;
for (let i = st; i < en; i++) {
  const l = lines[i];
  const idm = l.match(/^\s*"(ID-\d{3})":\s*\{/);
  if (idm) {
    if (curId) { console.log(`\n=== ${curId} ===`); for (const s of secs) {} flush(); }
    curId = idm[1]; curSec = null; buf = {}; inPrds = true;
    console.log(`\n=== ${curId} ===`);
    continue;
  }
  if (!inPrds) continue;
  const secm = l.match(/^\s*"(background|users|scenarios|solution|differentiation|competitorSignal|trendSignal|tam|metrics|risks|plan)":/);
  if (secm) {
    flush();
    curSec = secm[1];
    buf[curSec] = l.slice(secm.index + secm[0].length).replace(/^[\s:]*\[?\s*"?/, '');
    continue;
  }
  if (curSec) {
    // 遇到下一个顶层键或闭合
    if (/^\s*\},?\s*$/.test(l) && curSec) { flush(); curSec = null; continue; }
    buf[curSec] += '\n' + l.replace(/^\s*/, '').replace(/[",\]]+$/, '');
  }
}
if (curId) { flush(); }

console.log(`\n==== PRD 结论: ${fail === 0 ? '无严重简略(均≥20字)' : fail + ' 项缺失/严重简略(<20字)'} ====`);
