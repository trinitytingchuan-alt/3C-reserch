import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'assets', 'func', 'glasses');
fs.mkdirSync(D, { recursive: true });
const items = [
  ['gx1_kv1.png', 'https://www.rayneo.com/cdn/shop/files/X3_KV_1_1_2x_8d9d4f3a.png?v=1762775115&width=1418'],
  ['gx2_2x2.png', 'https://www.rayneo.com/cdn/shop/files/39976_2x_2.png?v=1763359449&width=2252'],
  ['gx3_2x4.png', 'https://www.rayneo.com/cdn/shop/files/39976_2x_4.png?v=1763359449&width=2252'],
];
async function dl(name, url){
  try{
    const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0','Referer':'https://www.rayneo.com/'}});
    if(!r.ok){console.log('FAIL',name,r.status);return;}
    const b=Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(D,name),b);
    console.log('OK',name,b.length);
  }catch(e){console.log('ERR',name,e.message);}
}
for(const [n,u] of items) await dl(n,u);
console.log('done');
