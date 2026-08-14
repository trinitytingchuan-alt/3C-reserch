import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'assets');
mkdirSync(OUT, { recursive: true });

// IT之家 雷鸟 X3 Pro 评测/新闻图（真实产品图）
const IMGS = [
  ['ithome_1.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/2cc3a32d-431f-4112-bac4-bc63c3d06444.jpg'],
  ['ithome_2.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/6440cb8e-bdf4-4440-8f81-1b718e1ddd93.jpg'],
  ['ithome_4.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/ba27b7d7-02f5-473b-a693-d9eee1f696fd.jpg'],
  ['ithome_5.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/4b482633-f03b-4443-a4ad-634bcd0e6403.jpg'],
  ['ithome_6.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/c1bb57ac-8b0a-40b7-a887-4a6e5a8e24ac.jpg'],
  ['ithome_7.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/f1c98bc2-d1fb-408b-93c9-c8b740ccfa44.jpg'],
  ['ithome_8.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/d78f50ea-88a2-4af3-a698-16a4aef7c90b.jpg'],
  ['ithome_9.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/c9ddd956-909c-4207-9b3a-0c2e87b7969d.jpg'],
  ['ithome_10.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/48a3d889-3f49-4d7a-a8f1-65787484e1d5.jpg'],
  ['ithome_11.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/8f9a6410-8188-44b2-8006-41f829d7f97a.jpg'],
  ['ithome_12.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/0f1bc12a-9995-4e81-b719-8f205e5016ef.jpg'],
  ['ithome_13.jpg', 'https://img.ithome.com/newsuploadfiles/2025/5/fae79980-d65b-442b-9863-59cf51206938.jpg'],
];

for (const [name, url] of IMGS) {
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) { console.log('SKIP ' + name + ' status ' + r.status); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    // 解析 JPEG 尺寸
    let w = 0, h = 0;
    if (buf[0] === 0xFF && buf[1] === 0xD8) {
      let i = 2;
      while (i < buf.length - 9) {
        if (buf[i] === 0xFF && buf[i + 1] >= 0xC0 && buf[i + 1] <= 0xCF && buf[i + 1] !== 0xC4 && buf[i + 1] !== 0xC8 && buf[i + 1] !== 0xCC) {
          h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break;
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
    writeFileSync(join(OUT, name), buf);
    console.log(name + '  ' + w + 'x' + h + '  ' + buf.length + 'B');
  } catch (e) {
    console.log('ERR ' + name + ' ' + e.message);
  }
}
console.log('DONE');
