import fs from 'fs';
const html = fs.readFileSync('index.html','utf8');
const re = /assets\/(?:func\/[^\s"')]+|ithome_[0-9]+\.jpg)/g;
const refs = [...html.matchAll(re)].map(m=>m[0]);
const top5 = ['shoot','battery','eco','wear','lens'].map(k=>'assets/func/glasses/'+{shoot:'g16_gadgetflow_1600.jpg',battery:'g15_case_2000.jpg',eco:'g1_form_5712.jpg',wear:'g2_form_4885.jpg',lens:'g6_product_1200.png'}[k]);
const gtm = ['assets/ithome_7.jpg','assets/ithome_9.jpg','assets/func/glasses/g10_review_1280.jpg','assets/func/glasses/gx2_2x2.png','assets/func/glasses/gx3_2x4.png'];
const overlap = top5.filter(x=>gtm.includes(x));
console.log('TOP5 vs GTM overlap:', overlap.length?overlap:'NONE (good)');
const uniq=[...new Set(refs)];
let miss=0;
for(const u of uniq){ if(!fs.existsSync(u)){console.log('MISSING',u);miss++;} }
console.log(miss?('MISSING '+miss):'all files exist ('+uniq.length+' unique)');
console.log('--- list ---'); uniq.forEach(u=>console.log(u));
