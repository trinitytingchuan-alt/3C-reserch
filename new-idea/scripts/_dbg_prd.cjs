const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const ids = ['ID-001','ID-002','ID-003'];
const end = s.indexOf('"gtms": {');
let cur = s.indexOf('"ID-001": {');
const out = [];
for (let i=0;i<ids.length;i++){
  const start = s.indexOf('"'+ids[i]+'": {', cur);
  const nextStart = (i+1<ids.length)? s.indexOf('"'+ids[i+1]+'": {', start): end;
  const block = s.slice(start, nextStart);
  out.push(ids[i]+' start='+start+' next='+nextStart+' blockLen='+block.length+' head='+block.slice(0,40).replace(/\n/g,' '));
  cur = nextStart;
}
fs.writeFileSync('new-idea/scripts/_dbg_prd.txt', out.join('\n'));
