import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const D = path.join(__dirname, 'assets', 'func', 'glasses');
fs.mkdirSync(D, { recursive: true });
const items = [
  ['g1_form_5712.jpg', 'https://cdn.mos.cms.futurecdn.net/zsALKKixG2BYPFNJVq6v67.jpg'],
  ['g2_form_4885.jpg', 'https://cdn.mos.cms.futurecdn.net/qrgYbC9YzvRzvYRuhjuoE6.jpg'],
  ['g3_header_2560.jpg', 'https://production-static.mobilesyrup.com/uploads/2026/01/tcl-rayneo-x3-pro-header-scaled.jpg'],
  ['g4_wear_1903.jpg', 'https://www.notebookcheck.net/fileadmin/_processed_/b/8/csm_8f4a8a89ly8i1ue82931rj21rs148x6q_c9d74ab32f.jpg'],
  ['g5_kv_1418.png', 'https://www.rayneo.com/cdn/shop/files/X3_KV_2_1_2x_7fa6986a-2583-4f0b-9433-9e238982c39a.png?v=1762775115&width=1418'],
  ['g6_product_1200.png', 'https://www.rayneo.com/cdn/shop/files/X3pro_5c78e08d-a20f-4067-bd80-0c41c3630cf3.png?v=1772188092&width=1200'],
  ['g7_microled_1200.jpg', 'https://www.microled-info.com/sites/default/files/2025-01/RayNeo-X3-Pro.jpg'],
  ['g8_wear_1200.webp', 'https://m-cdn.phonearena.com/images/review/7797-wide-two_1200/RayNeo-X3-Pro-review-a-taste-of-the-ar-future.webp?1765752911'],
  ['g9_nav_1280.jpg', 'https://www.geeky-gadgets.com/wp-content/uploads/2025/12/sidewalk-guidance-ar-rayneo-x3_optimized.jpg'],
  ['g10_review_1280.jpg', 'https://gizmodo.com/app/uploads/2025/12/RayNeo-X3-Pro-02-1280x853.jpg'],
  ['g11_review_1280b.jpg', 'https://gizmodo.com/app/uploads/2025/12/RayNeo-X3-Pro-10-1280x853.jpg'],
  ['g12_launch_2252.png', 'https://eu.rayneo.com/cdn/shop/files/39976_2x_1.png?v=1763359449&width=2252'],
  ['g13_launch_1752.png', 'https://www.rayneo.com/cdn/shop/files/39976_2x_3.png?v=1763017708&width=1752'],
  ['g14_lifehacker_2000.png', 'https://lifehacker.com/imagery/reviews/01KCSRVE4EN22JEKR4D8YA84KB/images-2.fill.size_2000x1125.v1766096484.png'],
  ['g15_case_2000.jpg', 'https://www.notebookcheck.net/fileadmin/Notebooks/News/_nc5/The-included-carrying-case-of-RayNeo-X3-Pro.jpg'],
  ['g16_gadgetflow_1600.jpg', 'https://thegadgetflow.com/wp-content/uploads/2025/12/RayNeo-x3-Pro-02.jpg'],
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
