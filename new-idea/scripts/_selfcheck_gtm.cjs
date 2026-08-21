// 防惰自检：校验 DATA.gtm 二级界面字段详尽度
const fs = require('fs');
const p = 'new-idea/output/index.html';
const s = fs.readFileSync(p, 'utf8');
// 抽取 DATA.gtm 数组块：从 "gtm": [ 到其对应闭合 ]\n（后接 "gtms"）
const start = s.indexOf('"gtm": [');
if (start < 0) { console.log('FAIL: 未找到 DATA.gtm'); process.exit(1); }
const end = s.indexOf('"gtms"', start);
const arrStart = s.indexOf('[', start);
const arrEnd = s.lastIndexOf(']', end);
const block = s.slice(arrStart, arrEnd + 1);
let gtm;
try { gtm = eval('(' + block + ')'); } catch (e) { console.log('FAIL parse', e.message); process.exit(1); }

const cnLen = t => (t || '').replace(/[^\u4e00-\u9fa5]/g, '').length;
const isList = t => /、/.test(t) && !/[。；;]/.test(t);
const hasE = t => /E\d{2,3}/.test(t);

let fail = 0;
const log = (lvl, msg) => { if (lvl === 'F') fail++; console.log((lvl === 'F' ? '❌ ' : lvl === 'W' ? '⚠️ ' : '✅ ') + msg); };

for (const g of gtm) {
  const id = g.id;
  console.log(`\n=== ${id} ===`);
  // audience
  const aud = Array.isArray(g.audience) ? g.audience : [];
  log(aud.length < 3 ? 'F' : 'P', `audience 客群数=${aud.length} (需≥3)`);
  aud.forEach((a, i) => {
    const w = cnLen(a.who), wy = cnLen(a.why), sc = cnLen(a.scale);
    log(w < 25 ? 'F' : 'P', `  [${i}] who=${w}字 ${isList(a.who) ? '罗列!' : ''} ${hasE(a.who) ? '透E!' : ''} ${a.who.slice(0, 12)}…`);
    log(wy < 30 ? 'F' : 'P', `  [${i}] why=${wy}字 ${isList(a.why) ? '罗列!' : ''} ${hasE(a.why) ? '透E!' : ''} ::${a.why}`);
    log(sc < 20 ? 'F' : 'P', `  [${i}] scale=${sc}字 ${hasE(a.scale) ? '透E!' : ''}`);
  });
  // entry
  const en = Array.isArray(g.entry) ? g.entry : [];
  log(en.length < 3 ? 'F' : 'P', `entry 阶段数=${en.length} (需≥3)`);
  en.forEach((e, i) => {
    const ac = cnLen(e.action);
    log(ac < 40 ? 'F' : 'P', `  [${i}] ${e.phase} action=${ac}字 ${isList(e.action) ? '罗列!' : ''} ${hasE(e.action) ? '透E!' : ''}`);
  });
  // channel / pricing
  const ch = cnLen(g.channel), pr = cnLen(g.pricing);
  log(ch < 50 ? 'F' : 'P', `channel=${ch}字 ${isList(g.channel) ? '罗列!' : ''} ${hasE(g.channel) ? '透E!' : ''}`);
  log(pr < 50 ? 'F' : 'P', `pricing=${pr}字 ${isList(g.pricing) ? '罗列!' : ''} ${hasE(g.pricing) ? '透E!' : ''}`);
}
console.log(`\n==== 结论: ${fail === 0 ? 'ALL PASS' : fail + ' 项 FAIL'} ====`);
const d6 = gtm.find(x => x.id === 'ID-006');
console.log('DEBUG ID-006 aud[3].why =', JSON.stringify(d6 && d6.audience && d6.audience[3] && d6.audience[3].why));
console.log('DEBUG gtm.length=', (gtm && gtm.length));
setTimeout(() => process.exit(fail === 0 ? 0 : 1), 100);
