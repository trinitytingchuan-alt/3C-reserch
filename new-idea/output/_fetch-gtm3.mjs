import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'assets', 'func', 'glasses');
fs.mkdirSync(D, { recursive: true });
const items = [
  ['gx1_ap_review3.jpg', 'https://www.androidpolice.com/wp-content/uploads/2026/01/rayneo-x3-pro-review-3.jpg'],
  ['gx2_nc_wear2.jpg', 'https://www.notebookcheck.net/fileadmin/_processed_/5/9/csm_rayneo_x3_pro_hand_4f3b8c.jpg'],
  ['gx3_pcmag.jpg', 'https://www.pcmag.com/wp-content/uploads/2025/12/rayneo-x3-pro-1.jpg'],
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
