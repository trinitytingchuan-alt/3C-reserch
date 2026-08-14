// placeholderize.mjs — 把 report-template.html 的内联数据常量占位化为 __DATA_*__
// 用途：单一渲染引擎剥离。把 anker 内联数据常量(IDEAS/SCORES/EVIDENCE/GTMS/VERIFICATIONS/SCEN_SRC/DATASOURCE/VALIDATION/PRDS/DERIVATION)
// 替换为 `const NAME = __DATA_NAME__;`，保留渲染函数/CSS/渐进式载入/TOP5计算/伪需求拦截/DATA_WINDOW/REPORT_STAGE/RAW_EV/DIM_ORDER/DIM_LABEL。
// 幂等：重复执行不会破坏已占位化的文件（检测到已有 __DATA_ 则跳过该块）。
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');
const tplPath = join(BASE, 'templates', 'report-template.html');

let html = readFileSync(tplPath, 'utf-8');

const CONSTANTS = ['IDEAS', 'SCORES', 'EVIDENCE', 'GTMS', 'VERIFICATIONS', 'SCEN_SRC', 'DATASOURCE', 'VALIDATION', 'PRDS', 'DERIVATION'];

function findBlock(src, marker) {
  // marker 形如 "const IDEAS = "
  const idx = src.indexOf(marker);
  if (idx === -1) return null;
  const after = idx + marker.length;
  const open = src[after];
  if (open !== '[' && open !== '{') return null; // 已是占位符(__DATA_)则 open 为 _，跳过
  const closeCh = open === '[' ? ']' : '}';
  let depth = 0, inStr = false, esc = false, inTmpl = false, end = -1;
  for (let i = after; i < src.length; i++) {
    const c = src[i];
    if (esc) { esc = false; continue; }
    if (c === '\\') { esc = true; continue; }
    if (c === '"' && !inTmpl) { inStr = !inStr; continue; }
    if (c === '`' && !inStr) { inTmpl = !inTmpl; continue; }
    if (inStr || inTmpl) continue;
    if (c === open) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return null;
  return { start: idx, end, open, close: closeCh };
}

let replaced = 0;
for (const name of CONSTANTS) {
  const marker = `const ${name} = `;
  // 跳过已占位化的（后面跟 __DATA_）
  const already = html.indexOf(`${marker}__DATA_`);
  if (already !== -1) { console.log(`⏭ ${name}: 已占位化，跳过`); continue; }
  const blk = findBlock(html, marker);
  if (!blk) { console.log(`⚠ ${name}: 未找到可占位的数据块（可能是占位符或结构异常）`); continue; }
  const before = html.slice(0, blk.start);
  const afterHtml = html.slice(blk.end + 1);
  html = before + `${marker}__DATA_${name}__;` + afterHtml;
  replaced++;
  console.log(`✅ ${name}: 已占位化为 __DATA_${name}__`);
}

writeFileSync(tplPath, html, 'utf-8');
console.log(`\n完成: 占位化 ${replaced} 个数据常量 → ${tplPath}`);
