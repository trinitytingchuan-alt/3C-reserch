const fs = require('fs');
const s = fs.readFileSync('new-idea/output/index.html', 'utf8');
const prdsStart = s.indexOf('"prds": {');
const prdsEnd = s.indexOf('"gtms": {');
const prds = s.slice(prdsStart, prdsEnd);
function findBlock(str, id){const open=str.indexOf('"'+id+'": {');if(open<0)return null;let i=str.indexOf('{',open),d=0;for(;i<str.length;i++){if(str[i]==='{')d++;else if(str[i]==='}'){d--;if(d===0)return str.slice(open,i+1);}}return null;}
const cn = t => ((t||'').match(/[一-龥]/g)||[]).length;
const ids = [];
const re = /"(ID-\d{3})":\s*\{/g; let m; while((m=re.exec(prds))) ids.push(m[1]);
const seen=new Set(); const ord=ids.filter(x=>seen.has(x)?false:seen.add(x));
const out=[];
for(const id of ord){
  const blk = findBlock(prds, id);
  if(!blk){out.push('=== '+id+' ===\n  BLOCK NOT FOUND');continue;}
  out.push('=== '+id+' ===');
  for(const f of ['competitorSignal','trendSignal','tam','differentiation']){
    const mm = blk.match(new RegExp('"'+f+'":\\s*"([^"]*)"'));
    const n = mm? cn(mm[1]):0;
    out.push(`  ${n>=60?'OK':n>=40?'~':'!!'} ${f}: ${n}字`);
  }
  const um = blk.match(/"users":\s*\[([\s\S]*?)\]/);
  if(um){const rows=um[1].split('\n').filter(l=>l.includes('['));out.push('  users rows='+rows.length+' minLen='+Math.min(...rows.map(r=>cn(r))));}
  const sm = blk.match(/"scenarios":\s*\[([\s\S]*?)\]/);
  if(sm){const rows=sm[1].split('\n').filter(l=>l.includes('['));out.push('  scenarios rows='+rows.length+' minLen='+Math.min(...rows.map(r=>cn(r))));}
}
const eCnt = (prds.match(/E\d{3}/g)||[]).length;
out.push('\nprds 内残留 E 编号: '+eCnt);
fs.writeFileSync('new-idea/scripts/_verify_prd.txt', out.join('\n'));
