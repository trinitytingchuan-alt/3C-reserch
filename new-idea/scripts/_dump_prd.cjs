const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const st = s.indexOf('"prds": {');
const en = s.indexOf('"gtms": {', st);
const blk = s.slice(st, en);
const lines = blk.split('\n');
const secs = ['competitorSignal','trendSignal','tam','differentiation','users','scenarios'];
let curId = null;
const rec = {};
let curSec = null, buf = '';
const flush = () => {
  if (curId && curSec) rec[curId][curSec] = (buf || '').trim();
};
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  const idm = l.match(/^\s*"(ID-\d{3})":\s*\{/);
  if (idm) { if (curId) flush(); curId = idm[1]; rec[curId] = {}; curSec = null; buf = ''; continue; }
  const secm = l.match(/^\s*"(competitorSignal|trendSignal|tam|differentiation|users|scenarios)":/);
  if (secm && curId) { flush(); curSec = secm[1]; buf = l.slice(secm.index + secm[0].length).replace(/^[\s:]*\[?\s*"?/, '').trim(); continue; }
  if (curSec && curId) {
    if (/^\s*\},?\s*$/.test(l)) { flush(); curSec = null; buf = ''; continue; }
    buf += '\n' + l.replace(/^\s*/, '').replace(/[",\]]+$/, '');
  }
}
if (curId) flush();
let out = '';
for (const id of Object.keys(rec)) {
  out += '\n### ' + id + '\n';
  for (const sec of secs) {
    if (rec[id][sec] != null) out += '  [' + sec + '] ' + rec[id][sec].slice(0, 400) + '\n';
  }
}
fs.writeFileSync('new-idea/scripts/_dump_prd.txt', out);
