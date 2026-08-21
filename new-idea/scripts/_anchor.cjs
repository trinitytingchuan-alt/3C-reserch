const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const a = s.indexOf('"prds": {');
const b = s.indexOf('"gtms": {');
const c = s.indexOf('"scores": {');
fs.writeFileSync('new-idea/scripts/_anchor.txt', `prds@${a}\ngtms@${b}\nscores@${c}\nlen=${s.length}`);
