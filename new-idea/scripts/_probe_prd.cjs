const fs = require('fs');
const out = [];
try {
  const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
  const st = s.indexOf('"prds": {');
  const en = s.indexOf('"gtms": {', st);
  const a = s.indexOf('{', st);
  const b = s.lastIndexOf('}', en);
  const blk = s.slice(a, b + 1);
  let o;
  try {
    o = JSON.parse(blk);
    out.push('JSON OK keys=' + Object.keys(o).length);
    for (const id of Object.keys(o)) {
      const prd = o[id];
      const arr = Array.isArray(prd) ? prd[0] : prd;
      out.push(id + ' secs=' + (arr && typeof arr === 'object' ? Object.keys(arr).join(',') : typeof prd));
    }
  } catch (e) {
    out.push('JSON FAIL: ' + e.message);
    out.push('BLK TAIL: ' + blk.slice(-150));
    out.push('BLK HEAD: ' + blk.slice(0, 150));
  }
} catch (e) {
  out.push('TOP FAIL: ' + e.message);
}
fs.writeFileSync('new-idea/scripts/_probe_prd.txt', out.join('\n'));
