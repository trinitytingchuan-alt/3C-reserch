const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const lines = s.split('\n');
const out = [];
for (let i = 0; i < lines.length; i++) {
  if (/，\s*[）"]/.test(lines[i])) {
    out.push((i + 1) + ' | ' + lines[i].trim().slice(0, 150));
  }
}
fs.writeFileSync('new-idea/scripts/_orphan.txt', out.join('\n') || 'NONE');
