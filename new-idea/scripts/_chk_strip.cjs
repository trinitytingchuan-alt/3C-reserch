const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const st = s.indexOf('"prds": {');
const en = s.indexOf('"scores": {', st);
const blk = s.slice(st, en);
const lines = blk.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  if (/（）|（\s|\s）|E\d{3}/.test(lines[i])) {
    out.push((st + i) + ' | ' + lines[i].trim().slice(0, 140));
  }
}
fs.writeFileSync('new-idea/scripts/_chk_strip.txt', out.length ? out.join('\n') : 'CLEAN: no residual');
