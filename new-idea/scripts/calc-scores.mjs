// NEW IDEA — 评分计算器（三专家×八维 → finalScore）
// 用法: node scripts/calc-scores.mjs [--company <slug>] [--write]
// 说明: 从 scores.json 的专家评分重算 finalScore，--write 时写回

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { computeFinalScore } from '../harness/rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = join(__dirname, '..');

const args = process.argv.slice(2);
const companyIdx = args.indexOf('--company');
const company = companyIdx > -1 ? args[companyIdx + 1] : 'anker';
const shouldWrite = args.includes('--write');

const scoresPath = join(BASE, 'data', company, 'scores.json');
if (!existsSync(scoresPath)) {
  console.error(`❌ 未找到: ${scoresPath}`);
  process.exit(1);
}

const scores = JSON.parse(readFileSync(scoresPath, 'utf-8'));

let changed = false;
for (const item of scores) {
  try {
    const computed = computeFinalScore(item.scores);
    const stored = item.finalScore;
    if (stored !== computed) {
      console.log(`ID-${item.ideaId}: 存储=${stored} 计算=${computed} ${shouldWrite ? '→ 将更新' : '⚠️ 不一致'}`);
      if (shouldWrite) {
        item.finalScore = computed;
        changed = true;
      }
    } else {
      console.log(`ID-${item.ideaId}: finalScore=${computed} ✓`);
    }
  } catch (e) {
    console.error(`ID-${item.ideaId}: ${e.message}`);
    process.exit(1);
  }
}

if (shouldWrite && changed) {
  writeFileSync(scoresPath, JSON.stringify(scores, null, 2) + '\n', 'utf-8');
  console.log('\n✅ scores.json 已更新');
} else if (!shouldWrite && changed) {
  console.log('\n⚠️ 存在不一致，运行 `node scripts/calc-scores.mjs --company <slug> --write` 修正');
} else {
  console.log('\n✅ 全部一致');
}
