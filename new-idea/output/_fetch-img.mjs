import { writeFileSync, mkdirSync } from 'node:fs';

const SOURCES = [
  'https://www.ithome.com/0/856/414.htm',
  'https://product.pconline.com.cn/smarteyeglass/leiniao/2653199.html',
  'https://www.leikeji.com/article/69898'
];

for (const url of SOURCES) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const t = await r.text();
    const m = t.match(/https?:\/\/[^'"]+\.(?:jpg|png|jpeg|webp)/gi) || [];
    const u = [...new Set(m)].filter(x => /x3|rayneo|ar|glasses|pro|img/i.test(x));
    console.log('=== ' + url + ' ===');
    console.log(u.slice(0, 40).join('\n'));
  } catch (e) {
    console.log('ERR ' + url + ' : ' + e.message);
  }
}
