const fs = require('fs');
const p = 'new-idea/output/index.html';
let s = fs.readFileSync(p, 'utf8');
const stPrds = s.indexOf('"prds": {');
const stScores = s.indexOf('"scores": {', stPrds);
let head = s.slice(0, stPrds); let tail = s.slice(stScores); let blk = s.slice(stPrds, stScores);
blk = blk.replace(/（E\d{3}(?:\/E\d{3})*\s*([^）]*?)）/g, (m,d)=> d&&d.trim()?'（'+d.trim()+'）':'');
blk = blk.replace(/（E\d{3}(?:\/E\d{3})*）/g,'').replace(/E\d{3}(?:\/E\d{3})*\s*[:：]\s*/g,'').replace(/E\d{3}(?:\/E\d{3})*/g,'').replace(/（\s+/g,'（').replace(/\s+）/g,'）').replace(/（）/g,'').replace(/[ \t]{2,}/g,' ');
s = head+blk+tail;
function findBlock(str,id){const open=str.indexOf('"'+id+'": {');if(open<0)return null;let i=str.indexOf('{',open),depth=0,start=i;for(;i<str.length;i++){if(str[i]==='{')depth++;else if(str[i]==='}'){depth--;if(depth===0)return{text:str.slice(start,i+1),end:i+1};}}return null;}
const F = { 'ID-002': { competitorSignal:'TEST_MARKER_002' } };
const prdsEnd = s.indexOf('"gtms": {');
let work = s.slice(0, prdsEnd);
const re2=/"ID-\d{3}":\s*\{/g; let mm; const order=[]; while((mm=re2.exec(work)))order.push(mm[1]);
const seen=new Set(); const ord=order.filter(x=>seen.has(x)?false:seen.add(x));
const out=[];
for(const id of ord){
  if(!F[id])continue;
  const b=findBlock(work,id);
  out.push(id+' findBlock='+(b?('len'+b.text.length):'NULL')+' inWork='+(b?work.indexOf(b.text):'-1'));
}
fs.writeFileSync('new-idea/scripts/_dbg2.txt', out.join('\n'));
