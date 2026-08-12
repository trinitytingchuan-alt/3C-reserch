// NEW IDEA — HTML 报告完整性校验 (validate-html.mjs)
// 用法: node scripts/validate-html.mjs [--file <path>]
// 功能: 校验 HTML 内嵌 JS 语法、关键渲染挂载点存在、section 配对
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import vm from 'vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const args = process.argv.slice(2);
const fileIdx = args.indexOf('--file');
const filePath = fileIdx > -1 ? args[fileIdx + 1] : join(BASE, 'output', 'index.html');

let errors = 0;

if (!existsSync(filePath)) {
  console.error(`❌ 文件不存在: ${filePath}`);
  process.exit(1);
}

const html = readFileSync(filePath, 'utf-8');

// 1. 提取内嵌 JS（仅主 script 块）
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length === 0) {
  console.error('❌ 未找到内嵌 <script> 块');
  process.exit(1);
}

scripts.forEach((code, i) => {
  try {
    new vm.Script(code, { filename: `inline-script-${i + 1}` });
    console.log(`[OK]    内嵌 JS 块 ${i + 1} 语法有效 (${code.length} 字符)`);
  } catch (e) {
    console.error(`❌ 内嵌 JS 块 ${i + 1} 语法错误: ${e.message}`);
    errors++;
  }
});

// 2. 关键渲染挂载点
const requiredIds = [
  'top5Flat', 'radarContainer', 'dimBars',
  'listBody', 'listEmpty', 'prdTabs', 'prdPanels', 'gtmCards', 'evBody', 'verBody',
  'modalBackdrop', 'modalContent', 'expertTabs',
];
for (const id of requiredIds) {
  if (!html.includes(`id="${id}"`)) {
    console.error(`❌ 缺少渲染挂载点: ${id}`);
    errors++;
  }
}
console.log(`[OK]    渲染挂载点检查完成 (${requiredIds.length} 个)`);

// 3. section 配对
const openSections = (html.match(/<section\b/g) || []).length;
const closeSections = (html.match(/<\/section>/g) || []).length;
if (openSections !== closeSections) {
  console.error(`❌ section 标签不配对: 开 ${openSections} / 闭 ${closeSections}`);
  errors++;
} else {
  console.log(`[OK]    section 配对 (${openSections} 个)`);
}

// 4. 评分勾稽：用 harness computeFinalScore 重算 scores.json，确认存储 finalScore 与规则一致；
//    并确认 HTML 内嵌了各需求的专家评分数据（模板已改为运行时统一计算，不内嵌 finalScore 字段）
try {
  const scoresPath = join(BASE, 'data', 'anker', 'scores.json');
  const scores = JSON.parse(readFileSync(scoresPath, 'utf-8'));
  const { computeFinalScore } = await import('../harness/rules.mjs');
  for (const s of scores) {
    const computed = computeFinalScore(s.scores);
    if (Math.abs(computed - s.finalScore) > 0.05) {
      console.error(`❌ ${s.ideaId} 存储 finalScore=${s.finalScore} 与 computeFinalScore 重算=${computed} 不一致`);
      errors++;
    }
    // HTML 必须内嵌该需求专家评分（'ID-XXX': 块存在）
    if (!new RegExp(`'${s.ideaId}':\\s*\\{`).test(html)) {
      console.error(`❌ HTML 未内嵌 ${s.ideaId} 专家评分数据`);
      errors++;
    }
  }
  if (errors === 0) console.log(`[OK]    scores.json 评分均由 computeFinalScore 口径校验一致 (${scores.length} 条)`);
} catch (e) {
  console.error(`❌ 评分勾稽校验失败: ${e.message}`);
  errors++;
}

console.log(errors === 0 ? '\n✅ HTML 校验通过: 0 ERROR' : `\n❌ HTML 校验失败: ${errors} ERROR`);
process.exit(errors === 0 ? 0 : 1);
