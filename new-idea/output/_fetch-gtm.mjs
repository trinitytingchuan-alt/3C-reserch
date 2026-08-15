import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'assets', 'func', 'glasses');
fs.mkdirSync(D, { recursive: true });
const items = [
  ['g4_wear_1903.jpg', 'https://www.notebookcheck.net/fileadmin/_processed_/a/4/csm_rayneox3proteaser_55b32599e5.jpg'],
  ['g10_review_1280.jpg', 'https://thegadgetflow.com/wp-content/uploads/2025/12/RayNeo-x3-Pro-01.jpg'],
  ['g11_review_1280b.jpg', 'https://cdn.dimsumdaily.hk/wp-content/uploads/2026/01/11111659/X3-pro-1.webp'],
];
async function dl(name, url){
  try{
    const r = await fetch(url,{headers:{'User-Agent':'Mozilla/5.0'}});
    if(!r.ok){console.log('FAIL',name,r.status);return;}
    const b=Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(path.join(D,name),b);
    console.log('OK',name,b.length);
  }catch(e){console.log('ERR',name,e.message);}
}
for(const [n,u] of items) await dl(n,u);
console.log('done');
