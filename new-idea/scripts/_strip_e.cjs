// 红线修复：剥离 PRD/GTM 二级界面正文中透出的 E### 证据编号
// 仅处理可见正文数据（prds 块 ~ gtms 块，到 scores 之前），保留真实数据描述，去掉 E 标签
const fs = require('fs');
const p = 'new-idea/output/index.html';
let s = fs.readFileSync(p, 'utf8');

const stPrds = s.indexOf('"prds": {');
const stScores = s.indexOf('"scores": {', stPrds);
if (stPrds < 0 || stScores < 0) { console.log('锚点未找到'); process.exit(1); }
const head = s.slice(0, stPrds);
const tail = s.slice(stScores);
let blk = s.slice(stPrds, stScores);

// 统计处理前
const before = (blk.match(/E\d{3}/g) || []).length;

// 1) （E###/E### 描述） -> （描述）；无描述则整括号删
blk = blk.replace(/（E\d{3}(?:\/E\d{3})*\s*([^）]*?)）/g, (m, desc) => desc && desc.trim() ? '（' + desc.trim() + '）' : '');
// 2) 残留 （E###/E###） 纯编号括号
blk = blk.replace(/（E\d{3}(?:\/E\d{3})*）/g, '');
// 3) 行内 E###： 描述 或 E###/E###： 描述
blk = blk.replace(/E\d{3}(?:\/E\d{3})*\s*[:：]\s*/g, '');
// 4) 残留孤立 E###（如出现在句中无括号无冒号）
blk = blk.replace(/E\d{3}(?:\/E\d{3})*/g, '');
// 5) 清理多余空格与括号
blk = blk.replace(/（\s+/g, '（').replace(/\s+）/g, '）');
blk = blk.replace(/（）/g, '');
blk = blk.replace(/[ \t]{2,}/g, ' ');

const after = (blk.match(/E\d{3}/g) || []).length;

s = head + blk + tail;
fs.writeFileSync(p, s);
fs.writeFileSync('new-idea/scripts/_strip_e_log.txt', `before=${before} after=${after}`);
console.log('done before=' + before + ' after=' + after);
