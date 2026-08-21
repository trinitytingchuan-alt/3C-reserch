const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const st = s.indexOf('"prds": {');
const en = s.indexOf('"gtms": {', st);
const blk = s.slice(st, en);
const lines = blk.split('\n');
let cnt = 0;
const out = [];
for (let i = 0; i < lines.length; i++) {
  if (/E\d{3}/.test(lines[i])) {
    cnt++;
    if (cnt <= 60) out.push((st + i) + ' | ' + lines[i].trim().slice(0, 140));
  }
}
out.push('TOTAL lines with E: ' + cnt);
fs.writeFileSync('new-idea/scripts/_scan_e.txt', out.join('\n'));
